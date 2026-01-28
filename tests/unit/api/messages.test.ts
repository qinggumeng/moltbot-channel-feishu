/**
 * Unit tests for api/messages.ts
 */

import { describe, it, expect } from "vitest";
import {
    normalizeTarget,
    resolveReceiveIdType,
    isValidId,
} from "../../../dist/api/messages.js";

describe("normalizeTarget", () => {
    it("returns null for empty string", () => {
        expect(normalizeTarget("")).toBeNull();
        expect(normalizeTarget("   ")).toBeNull();
    });

    it("strips user: prefix", () => {
        expect(normalizeTarget("user:ou_123")).toBe("ou_123");
    });

    it("strips chat: prefix", () => {
        expect(normalizeTarget("chat:oc_456")).toBe("oc_456");
    });

    it("returns trimmed value when no prefix", () => {
        expect(normalizeTarget("  ou_789  ")).toBe("ou_789");
    });

    it("returns null if only prefix without ID", () => {
        expect(normalizeTarget("user:")).toBeNull();
        expect(normalizeTarget("chat:   ")).toBeNull();
    });
});

describe("resolveReceiveIdType", () => {
    it("detects chat_id from oc_ prefix", () => {
        expect(resolveReceiveIdType("oc_abc")).toBe("chat_id");
    });

    it("detects open_id from ou_ prefix", () => {
        expect(resolveReceiveIdType("ou_xyz")).toBe("open_id");
    });

    it("detects union_id from on_ prefix", () => {
        expect(resolveReceiveIdType("on_123")).toBe("union_id");
    });

    it("defaults to open_id for unknown prefix", () => {
        expect(resolveReceiveIdType("unknown_id")).toBe("open_id");
    });
});

describe("isValidId", () => {
    it("accepts valid prefixed IDs", () => {
        expect(isValidId("oc_chat123")).toBe(true);
        expect(isValidId("ou_user456")).toBe(true);
        expect(isValidId("on_union789")).toBe(true);
        expect(isValidId("u_legacy")).toBe(true);
    });

    it("accepts long strings as valid", () => {
        expect(isValidId("verylongstringid")).toBe(true);
    });

    it("rejects short unknown strings", () => {
        expect(isValidId("short")).toBe(false);
    });
});
