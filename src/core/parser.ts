/**
 * Message event parsing utilities.
 */

import type { MessageReceivedEvent, MessageMention, ParsedMessage } from "../types/index.js";

// ============================================================================
// Content Parsing
// ============================================================================

/**
 * Parse message content based on message type.
 * Extracts text from JSON-wrapped content.
 */
export function parseMessageContent(content: string, messageType: string): string {
  try {
    const parsed: unknown = JSON.parse(content);
    if (
      messageType === "text" &&
      typeof parsed === "object" &&
      parsed !== null &&
      "text" in parsed
    ) {
      return String((parsed as { text: unknown }).text);
    }
    return content;
  } catch {
    return content;
  }
}

// ============================================================================
// Mention Detection
// ============================================================================

/**
 * Check if the bot was mentioned in a message.
 */
export function isBotMentioned(
  mentions: MessageMention[] | undefined,
  botOpenId: string | undefined
): boolean {
  if (!mentions || mentions.length === 0) {
    return false;
  }

  // If we don't know our bot's open_id, assume any mention is us
  if (!botOpenId) {
    return mentions.length > 0;
  }

  return mentions.some((m) => m.id.open_id === botOpenId);
}

/**
 * Remove bot mention text from message content.
 * Cleans up both @name and mention keys.
 */
export function stripMentions(text: string, mentions: MessageMention[] | undefined): string {
  if (!mentions || mentions.length === 0) {
    return text;
  }

  let result = text;
  for (const mention of mentions) {
    // Remove @name format
    const namePattern = new RegExp(`@${escapeRegex(mention.name)}\\s*`, "g");
    result = result.replace(namePattern, "").trim();

    // Remove mention key format (e.g., @_user_xxx)
    result = result.replace(new RegExp(escapeRegex(mention.key), "g"), "").trim();
  }

  return result;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================================
// Event Parsing
// ============================================================================

/**
 * Parse a raw message event into a standardized format.
 */
export function parseMessageEvent(event: MessageReceivedEvent, botOpenId?: string): ParsedMessage {
  const message = event.message;
  const sender = event.sender;

  const rawContent = parseMessageContent(message.content, message.message_type);
  const mentionedBot = isBotMentioned(message.mentions, botOpenId);
  const content = stripMentions(rawContent, message.mentions);

  return {
    chatId: message.chat_id,
    messageId: message.message_id,
    senderId: sender.sender_id.user_id ?? sender.sender_id.open_id ?? "",
    senderOpenId: sender.sender_id.open_id ?? "",
    senderName: undefined, // Not available in event, would need API lookup
    chatType: message.chat_type,
    mentionedBot,
    rootId: message.root_id ?? undefined,
    parentId: message.parent_id ?? undefined,
    content,
    contentType: message.message_type,
  };
}
