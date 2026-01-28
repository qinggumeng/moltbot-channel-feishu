/**
 * Unit tests for config/schema.ts
 */

import { describe, it, expect } from "vitest";
import { ConfigSchema, DmPolicySchema, GroupPolicySchema } from "../../../dist/config/schema.js";

describe("DmPolicySchema", () => {
    it("accepts valid values", () => {
        expect(DmPolicySchema.parse("open")).toBe("open");
        expect(DmPolicySchema.parse("pairing")).toBe("pairing");
        expect(DmPolicySchema.parse("allowlist")).toBe("allowlist");
    });

    it("rejects invalid values", () => {
        expect(() => DmPolicySchema.parse("invalid")).toThrow();
    });
});

describe("GroupPolicySchema", () => {
    it("accepts valid values", () => {
        expect(GroupPolicySchema.parse("open")).toBe("open");
        expect(GroupPolicySchema.parse("allowlist")).toBe("allowlist");
        expect(GroupPolicySchema.parse("disabled")).toBe("disabled");
    });
});

describe("ConfigSchema", () => {
    it("applies defaults", () => {
        const result = ConfigSchema.parse({});
        expect(result.domain).toBe("feishu");
        expect(result.connectionMode).toBe("websocket");
        expect(result.dmPolicy).toBe("pairing");
        expect(result.groupPolicy).toBe("allowlist");
        expect(result.requireMention).toBe(true);
    });

    it("accepts custom values", () => {
        const result = ConfigSchema.parse({
            appId: "app_123",
            appSecret: "secret",
            dmPolicy: "open",
            allowFrom: ["*"], // Required for dmPolicy=open
            domain: "lark",
        });
        expect(result.appId).toBe("app_123");
        expect(result.dmPolicy).toBe("open");
        expect(result.domain).toBe("lark");
    });

    it("validates groups config", () => {
        const result = ConfigSchema.parse({
            groups: {
                "oc_test": { requireMention: false, allowFrom: ["*"] },
            },
        });
        expect(result.groups?.["oc_test"]?.requireMention).toBe(false);
    });

    it("rejects invalid dmPolicy", () => {
        expect(() => ConfigSchema.parse({ dmPolicy: "unknown" })).toThrow();
    });
});
