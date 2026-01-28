/**
 * Unit tests for core/policy.ts
 */

import { describe, it, expect } from "vitest";
import {
    matchAllowlist,
    checkDmPolicy,
    checkGroupPolicy,
    resolveGroupConfig,
    shouldRequireMention,
} from "../../../dist/core/policy.js";
import type { Config } from "../../../dist/config/schema.js";

const baseConfig: Config = {
    appId: "app_123",
    appSecret: "secret",
};

describe("matchAllowlist", () => {
    it("returns false for empty allowlist", () => {
        expect(matchAllowlist([], "user123").allowed).toBe(false);
    });

    it("matches wildcard", () => {
        const result = matchAllowlist(["*"], "anyone");
        expect(result.allowed).toBe(true);
        expect(result.matchSource).toBe("wildcard");
    });

    it("matches by ID (case-insensitive)", () => {
        const result = matchAllowlist(["USER123"], "user123");
        expect(result.allowed).toBe(true);
        expect(result.matchSource).toBe("id");
    });

    it("matches by name", () => {
        const result = matchAllowlist(["alice"], "user123", "Alice");
        expect(result.allowed).toBe(true);
        expect(result.matchSource).toBe("name");
    });

    it("returns false when no match", () => {
        expect(matchAllowlist(["bob"], "user123", "Alice").allowed).toBe(false);
    });
});

describe("checkDmPolicy", () => {
    it("allows when policy is open", () => {
        const config: Config = { ...baseConfig, dmPolicy: "open" };
        expect(checkDmPolicy(config, "anyone").allowed).toBe(true);
    });

    it("allows when policy is pairing (handled elsewhere)", () => {
        const config: Config = { ...baseConfig, dmPolicy: "pairing" };
        expect(checkDmPolicy(config, "anyone").allowed).toBe(true);
    });

    it("checks allowlist when policy is allowlist", () => {
        const config: Config = { ...baseConfig, dmPolicy: "allowlist", allowFrom: ["user123"] };
        expect(checkDmPolicy(config, "user123").allowed).toBe(true);
        expect(checkDmPolicy(config, "other").allowed).toBe(false);
    });

    it("denies when allowlist empty", () => {
        const config: Config = { ...baseConfig, dmPolicy: "allowlist", allowFrom: [] };
        expect(checkDmPolicy(config, "anyone").allowed).toBe(false);
    });
});

describe("checkGroupPolicy", () => {
    it("denies when policy is disabled", () => {
        const config: Config = { ...baseConfig, groupPolicy: "disabled" };
        expect(checkGroupPolicy(config, "oc_group", "user").allowed).toBe(false);
    });

    it("allows when policy is open", () => {
        const config: Config = { ...baseConfig, groupPolicy: "open" };
        expect(checkGroupPolicy(config, "oc_group", "anyone").allowed).toBe(true);
    });

    it("uses groupAllowFrom when groups config empty", () => {
        const config: Config = {
            ...baseConfig,
            groupPolicy: "allowlist",
            groupAllowFrom: ["user123"],
        };
        expect(checkGroupPolicy(config, "oc_group", "user123").allowed).toBe(true);
        expect(checkGroupPolicy(config, "oc_group", "other").allowed).toBe(false);
    });

    it("uses group-specific allowFrom", () => {
        const config: Config = {
            ...baseConfig,
            groupPolicy: "allowlist",
            groups: { oc_special: { allowFrom: ["vip"] } },
        };
        expect(checkGroupPolicy(config, "oc_special", "vip").allowed).toBe(true);
        expect(checkGroupPolicy(config, "oc_special", "normal").allowed).toBe(false);
    });
});

describe("resolveGroupConfig", () => {
    const config: Config = {
        ...baseConfig,
        groups: { "OC_Group1": { requireMention: false } },
    };

    it("matches exact key", () => {
        expect(resolveGroupConfig(config, "OC_Group1")).toBeDefined();
    });

    it("matches case-insensitive", () => {
        expect(resolveGroupConfig(config, "oc_group1")).toBeDefined();
    });

    it("returns undefined for no match", () => {
        expect(resolveGroupConfig(config, "oc_other")).toBeUndefined();
    });

    it("returns undefined for null/undefined", () => {
        expect(resolveGroupConfig(config, null)).toBeUndefined();
        expect(resolveGroupConfig(config, undefined)).toBeUndefined();
    });
});

describe("shouldRequireMention", () => {
    it("never requires mention for DMs", () => {
        expect(shouldRequireMention(baseConfig, "p2p")).toBe(false);
    });

    it("defaults to true for groups", () => {
        expect(shouldRequireMention(baseConfig, "group")).toBe(true);
    });

    it("respects global requireMention setting", () => {
        const config: Config = { ...baseConfig, requireMention: false };
        expect(shouldRequireMention(config, "group")).toBe(false);
    });

    it("respects group-specific requireMention", () => {
        const config: Config = {
            ...baseConfig,
            requireMention: true,
            groups: { oc_free: { requireMention: false } },
        };
        expect(shouldRequireMention(config, "group", "oc_free")).toBe(false);
        expect(shouldRequireMention(config, "group", "oc_other")).toBe(true);
    });
});
