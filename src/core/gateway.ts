/**
 * WebSocket gateway for real-time Feishu events.
 */

import type * as Lark from "@larksuiteoapi/node-sdk";
import type { Config } from "../config/schema.js";
import type {
  EventHandlers,
  MessageReceivedEvent,
  BotAddedEvent,
  BotRemovedEvent,
} from "../types/index.js";
import { createWsClient, createEventDispatcher, probeConnection } from "../api/client.js";

// ============================================================================
// Types
// ============================================================================

export interface GatewayOptions {
  config: Config;
  handlers: EventHandlers;
  abortSignal?: AbortSignal;
  onLog?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface GatewayState {
  botOpenId: string | undefined;
  wsClient: Lark.WSClient | null;
}

// ============================================================================
// Gateway State
// ============================================================================

const state: GatewayState = {
  botOpenId: undefined,
  wsClient: null,
};

/**
 * Get the current bot's open_id.
 */
export function getBotOpenId(): string | undefined {
  return state.botOpenId;
}

// ============================================================================
// Gateway Lifecycle
// ============================================================================

/**
 * Start the WebSocket gateway.
 * Connects to Feishu and begins processing events.
 */
export async function startGateway(options: GatewayOptions): Promise<void> {
  const { config, handlers, abortSignal, onLog, onError } = options;
  const log = onLog ?? console.log;
  const error = onError ?? console.error;

  // Probe to get bot info
  const probeResult = await probeConnection(config);
  if (probeResult.ok) {
    state.botOpenId = probeResult.botOpenId;
    log(`Gateway: bot open_id resolved: ${state.botOpenId ?? "unknown"}`);
  }

  const connectionMode = config.connectionMode ?? "websocket";
  if (connectionMode !== "websocket") {
    log("Gateway: webhook mode not implemented, use HTTP server");
    return;
  }

  log("Gateway: starting WebSocket connection...");

  const wsClient = createWsClient(config);
  state.wsClient = wsClient;

  const eventDispatcher = createEventDispatcher(config);

  // Register event handlers
  eventDispatcher.register({
    "im.message.receive_v1": async (data: unknown) => {
      try {
        const event = data as MessageReceivedEvent;
        if (handlers.onMessageReceived) {
          await handlers.onMessageReceived(event);
        }
      } catch (err) {
        error(`Gateway: error handling message: ${String(err)}`);
      }
    },

    "im.message.message_read_v1": async () => {
      // Ignore read receipts
    },

    "im.chat.member.bot.added_v1": async (data: unknown) => {
      try {
        const event = data as BotAddedEvent;
        log(`Gateway: bot added to chat ${event.chat_id}`);
        if (handlers.onBotAdded) {
          await handlers.onBotAdded(event);
        }
      } catch (err) {
        error(`Gateway: error handling bot added: ${String(err)}`);
      }
    },

    "im.chat.member.bot.deleted_v1": async (data: unknown) => {
      try {
        const event = data as BotRemovedEvent;
        log(`Gateway: bot removed from chat ${event.chat_id}`);
        if (handlers.onBotRemoved) {
          await handlers.onBotRemoved(event);
        }
      } catch (err) {
        error(`Gateway: error handling bot removed: ${String(err)}`);
      }
    },
  });

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (state.wsClient === wsClient) {
        state.wsClient = null;
      }
    };

    const handleAbort = () => {
      log("Gateway: abort signal received, stopping...");
      cleanup();
      resolve();
    };

    if (abortSignal?.aborted) {
      cleanup();
      resolve();
      return;
    }

    abortSignal?.addEventListener("abort", handleAbort, { once: true });

    try {
      wsClient.start({ eventDispatcher });
      log("Gateway: WebSocket client started");
    } catch (err) {
      cleanup();
      abortSignal?.removeEventListener("abort", handleAbort);
      reject(err);
    }
  });
}

/**
 * Stop the WebSocket gateway.
 */
export function stopGateway(): void {
  state.wsClient = null;
  state.botOpenId = undefined;
}
