/**
 * Type declarations for clawdbot/plugin-sdk.
 * This stub allows strict TypeScript compilation against the peer dependency.
 */

declare module "clawdbot/plugin-sdk" {
  export const DEFAULT_ACCOUNT_ID: string;
  export const PAIRING_APPROVED_MESSAGE: string;

  export function emptyPluginConfigSchema(): unknown;
  export function addWildcardAllowFrom(allowFrom?: (string | number)[]): (string | number)[];
  export function formatDocsLink(path: string, label: string): string;

  export type DmPolicy = "open" | "pairing" | "allowlist";

  export interface RuntimeEnv {
    log?: (message: string) => void;
    error?: (message: string) => void;
    [key: string]: unknown;
  }

  export interface ClawdbotConfig {
    channels?: {
      feishu?: Record<string, unknown>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  export interface ClawdbotPluginApi {
    runtime: RuntimeEnv;
    registerChannel(params: { plugin: ChannelPlugin<unknown> }): void;
  }

  export interface ChannelGroupContext {
    cfg: ClawdbotConfig;
    groupId?: string | null;
    [key: string]: unknown;
  }

  export interface GroupToolPolicyConfig {
    allow?: string[];
    deny?: string[];
  }

  export interface WizardPrompter {
    note(message: string, title?: string): Promise<void>;
    text(params: {
      message: string;
      placeholder?: string;
      initialValue?: string;
      validate?: (value: string | undefined) => string | undefined;
    }): Promise<string | symbol>;
    confirm(params: { message: string; initialValue?: boolean }): Promise<boolean>;
    select<T>(params: {
      message: string;
      options: { value: T; label: string }[];
      initialValue?: T;
    }): Promise<T | symbol>;
  }

  export interface ChannelOnboardingDmPolicy {
    label: string;
    channel: string;
    policyKey: string;
    allowFromKey: string;
    getCurrent(cfg: ClawdbotConfig): DmPolicy;
    setPolicy(cfg: ClawdbotConfig, policy: DmPolicy): ClawdbotConfig;
    promptAllowFrom(params: {
      cfg: ClawdbotConfig;
      prompter: WizardPrompter;
    }): Promise<ClawdbotConfig>;
  }

  export interface ChannelOnboardingAdapter {
    channel: string;
    getStatus(params: { cfg: ClawdbotConfig }): Promise<{
      channel: string;
      configured: boolean;
      statusLines: string[];
      selectionHint?: string;
      quickstartScore?: number;
    }>;
    configure(params: {
      cfg: ClawdbotConfig;
      prompter: WizardPrompter;
    }): Promise<{ cfg: ClawdbotConfig; accountId: string }>;
    dmPolicy: ChannelOnboardingDmPolicy;
    disable(cfg: ClawdbotConfig): ClawdbotConfig;
  }

  export interface ChannelPluginCapabilities {
    chatTypes: string[];
    polls: boolean;
    threads: boolean;
    media: boolean;
    reactions: boolean;
    edit: boolean;
    reply: boolean;
  }

  export interface ChannelPluginOutbound {
    deliveryMode: string;
    chunkerMode: string;
    textChunkLimit: number;
    chunker(text: string, limit: number): string[];
    sendText(params: {
      cfg: ClawdbotConfig;
      to: string;
      text: string;
    }): Promise<{ channel: string; messageId: string; chatId: string }>;
    sendMedia(params: {
      cfg: ClawdbotConfig;
      to: string;
      text?: string;
      mediaUrl?: string;
    }): Promise<{ channel: string; messageId: string; chatId: string }>;
  }

  export interface ChannelPluginStatus {
    defaultRuntime: {
      accountId: string;
      running: boolean;
      lastStartAt: null;
      lastStopAt: null;
      lastError: null;
      port: null;
    };
    buildChannelSummary(params: { snapshot: Record<string, unknown> }): Record<string, unknown>;
    probeAccount(params: { cfg: ClawdbotConfig }): Promise<{
      ok: boolean;
      error?: string;
      appId?: string;
      botName?: string;
      botOpenId?: string;
    }>;
    buildAccountSnapshot(params: {
      account: { accountId: string; enabled: boolean; configured: boolean };
      runtime?: Record<string, unknown>;
      probe?: Record<string, unknown>;
    }): Record<string, unknown>;
  }

  export interface ChannelPluginGateway {
    startAccount(ctx: {
      cfg: ClawdbotConfig;
      accountId: string;
      abortSignal?: AbortSignal;
      setStatus(status: Record<string, unknown>): void;
      log?: { info(msg: string): void; error(msg: string): void };
    }): Promise<void>;
  }

  export interface ChannelPlugin<TAccount> {
    id: string;
    meta: {
      id: string;
      label: string;
      selectionLabel: string;
      docsPath: string;
      docsLabel: string;
      blurb: string;
      aliases: string[];
      order: number;
    };
    pairing?: {
      idLabel: string;
      normalizeAllowEntry(entry: string): string;
      notifyApproval(params: { cfg: ClawdbotConfig; id: string }): Promise<void>;
    };
    capabilities: ChannelPluginCapabilities;
    agentPrompt?: {
      messageToolHints(): string[];
    };
    groups?: {
      resolveToolPolicy(params: ChannelGroupContext): GroupToolPolicyConfig | undefined;
    };
    reload?: { configPrefixes: string[] };
    configSchema?: { schema: Record<string, unknown> };
    config: {
      listAccountIds(): string[];
      resolveAccount(cfg: ClawdbotConfig): TAccount;
      defaultAccountId(): string;
      setAccountEnabled(params: { cfg: ClawdbotConfig; enabled: boolean }): ClawdbotConfig;
      deleteAccount(params: { cfg: ClawdbotConfig }): ClawdbotConfig;
      isConfigured(account: TAccount, cfg: ClawdbotConfig): boolean;
      describeAccount(account: TAccount): {
        accountId: string;
        enabled: boolean;
        configured: boolean;
      };
      resolveAllowFrom(params: { cfg: ClawdbotConfig }): (string | number)[];
      formatAllowFrom(params: { allowFrom: (string | number)[] }): string[];
    };
    security?: {
      collectWarnings(params: { cfg: ClawdbotConfig }): string[];
    };
    setup?: {
      resolveAccountId(): string;
      applyAccountConfig(params: { cfg: ClawdbotConfig }): ClawdbotConfig;
    };
    onboarding: ChannelOnboardingAdapter;
    messaging: {
      normalizeTarget(target: string): string | null;
      targetResolver: {
        looksLikeId(id: string): boolean;
        hint: string;
      };
    };
    directory: {
      self(): Promise<null>;
      listPeers(params: {
        cfg: ClawdbotConfig;
        query?: string;
        limit?: number;
      }): Promise<{ kind: "user"; id: string; name?: string }[]>;
      listGroups(params: {
        cfg: ClawdbotConfig;
        query?: string;
        limit?: number;
      }): Promise<{ kind: "group"; id: string; name?: string }[]>;
      listPeersLive(params: {
        cfg: ClawdbotConfig;
        query?: string;
        limit?: number;
      }): Promise<{ kind: "user"; id: string; name?: string }[]>;
      listGroupsLive(params: {
        cfg: ClawdbotConfig;
        query?: string;
        limit?: number;
      }): Promise<{ kind: "group"; id: string; name?: string }[]>;
    };
    outbound: ChannelPluginOutbound;
    status: ChannelPluginStatus;
    gateway: ChannelPluginGateway;
  }
}
