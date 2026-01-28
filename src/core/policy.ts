/**
 * Access policy engine for DM and group messages.
 */

import type { Config, GroupConfig } from "../config/schema.js";

// ============================================================================
// Types
// ============================================================================

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

export interface AllowlistMatch {
  allowed: boolean;
  matchKey?: string;
  matchSource?: "wildcard" | "id" | "name";
}

// ============================================================================
// Allowlist Matching
// ============================================================================

/**
 * Check if a sender matches an allowlist.
 */
export function matchAllowlist(
  allowFrom: (string | number)[],
  senderId: string,
  senderName?: string | null
): AllowlistMatch {
  const normalized = allowFrom.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean);

  if (normalized.length === 0) {
    return { allowed: false };
  }

  // Check for wildcard
  if (normalized.includes("*")) {
    return { allowed: true, matchKey: "*", matchSource: "wildcard" };
  }

  // Check by ID
  const lowerSenderId = senderId.toLowerCase();
  if (normalized.includes(lowerSenderId)) {
    return { allowed: true, matchKey: lowerSenderId, matchSource: "id" };
  }

  // Check by name
  const lowerName = senderName?.toLowerCase();
  if (lowerName && normalized.includes(lowerName)) {
    return { allowed: true, matchKey: lowerName, matchSource: "name" };
  }

  return { allowed: false };
}

// ============================================================================
// DM Policy
// ============================================================================

/**
 * Check if a DM from a sender is allowed.
 */
export function checkDmPolicy(
  config: Config,
  senderId: string,
  senderName?: string | null
): PolicyResult {
  const policy = config.dmPolicy ?? "pairing";

  switch (policy) {
    case "open":
      return { allowed: true };

    case "pairing":
      // Pairing requires verification flow handled elsewhere
      return { allowed: true };

    case "allowlist": {
      const allowFrom = config.allowFrom ?? [];
      const match = matchAllowlist(allowFrom, senderId, senderName);
      return match.allowed
        ? { allowed: true }
        : { allowed: false, reason: "Sender not in DM allowlist" };
    }

    default:
      return { allowed: false, reason: `Unknown DM policy: ${policy}` };
  }
}

// ============================================================================
// Group Policy
// ============================================================================

/**
 * Resolve group-specific configuration.
 */
export function resolveGroupConfig(
  config: Config,
  groupId: string | null | undefined
): GroupConfig | undefined {
  if (!groupId) return undefined;

  const groups = config.groups ?? {};
  const trimmed = groupId.trim();

  // Direct match
  const direct = groups[trimmed];
  if (direct) return direct;

  // Case-insensitive match
  const lowered = trimmed.toLowerCase();
  const matchKey = Object.keys(groups).find((key) => key.toLowerCase() === lowered);
  return matchKey ? groups[matchKey] : undefined;
}

/**
 * Check if a message in a group from a sender is allowed.
 */
export function checkGroupPolicy(
  config: Config,
  groupId: string,
  senderId: string,
  senderName?: string | null
): PolicyResult {
  const policy = config.groupPolicy ?? "allowlist";

  switch (policy) {
    case "disabled":
      return { allowed: false, reason: "Group messages disabled" };

    case "open":
      return { allowed: true };

    case "allowlist": {
      // Check group-specific allowlist first
      const groupConfig = resolveGroupConfig(config, groupId);
      const groupAllowFrom = groupConfig?.allowFrom ?? config.groupAllowFrom ?? [];

      if (groupAllowFrom.length === 0) {
        // No allowlist configured, deny by default
        return {
          allowed: false,
          reason: "No group allowlist configured",
        };
      }

      const match = matchAllowlist(groupAllowFrom, senderId, senderName);
      return match.allowed
        ? { allowed: true }
        : { allowed: false, reason: "Sender not in group allowlist" };
    }

    default:
      return { allowed: false, reason: `Unknown group policy: ${policy}` };
  }
}

// ============================================================================
// Mention Policy
// ============================================================================

/**
 * Check if an @mention is required for the given context.
 */
export function shouldRequireMention(
  config: Config,
  chatType: "p2p" | "group",
  groupId?: string | null
): boolean {
  // Never require mention in DMs
  if (chatType === "p2p") {
    return false;
  }

  // Check group-specific config
  const groupConfig = resolveGroupConfig(config, groupId);
  if (groupConfig?.requireMention !== undefined) {
    return groupConfig.requireMention;
  }

  // Fall back to global config
  return config.requireMention ?? true;
}

/**
 * Get tool policy for a group.
 */
export function resolveGroupToolPolicy(
  config: Config,
  groupId: string | null | undefined
): { allow?: string[]; deny?: string[] } | undefined {
  const groupConfig = resolveGroupConfig(config, groupId);
  return groupConfig?.tools;
}
