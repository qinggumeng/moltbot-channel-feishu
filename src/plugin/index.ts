/**
 * Clawdbot plugin entry point.
 */

import type { ClawdbotPluginApi, RuntimeEnv } from "clawdbot/plugin-sdk";
import { emptyPluginConfigSchema } from "clawdbot/plugin-sdk";
import { feishuChannel } from "./channel.js";

// ============================================================================
// Runtime Management
// ============================================================================

let feishuRuntime: RuntimeEnv | null = null;

/**
 * Initialize the runtime for Feishu operations.
 * Called during plugin registration.
 */
export function initializeRuntime(runtime: RuntimeEnv): void {
  feishuRuntime = runtime;
}

/**
 * Get the current runtime.
 * @throws Error if runtime not initialized
 */
export function getRuntime(): RuntimeEnv {
  if (!feishuRuntime) {
    throw new Error("Feishu runtime not initialized");
  }
  return feishuRuntime;
}

// ============================================================================
// Plugin Definition
// ============================================================================

const plugin = {
  id: "feishu",
  name: "Feishu",
  description: "Feishu/Lark channel plugin for Clawdbot",
  configSchema: emptyPluginConfigSchema(),

  register(api: ClawdbotPluginApi) {
    initializeRuntime(api.runtime);
    api.registerChannel({ plugin: feishuChannel });
  },
};

export default plugin;

// ============================================================================
// Public Exports
// ============================================================================

// Re-export channel for direct access
export { feishuChannel } from "./channel.js";
