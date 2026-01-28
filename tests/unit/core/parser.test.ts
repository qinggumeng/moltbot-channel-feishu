/**
 * Unit tests for core/parser.ts
 */

import { describe, it, expect } from "vitest";
import {
    parseMessageContent,
    isBotMentioned,
    stripMentions,
    parseMessageEvent,
} from "../../../dist/core/parser.js";
import type { MessageReceivedEvent, MessageMention } from "../../../dist/types/index.js";

describe("parseMessageContent", () => {
    it("extracts text from text message JSON", () => {
        const content = JSON.stringify({ text: "Hello world" });
        expect(parseMessageContent(content, "text")).toBe("Hello world");
    });

    it("returns raw content for non-text message types", () => {
        const content = JSON.stringify({ text: "Hello" });
        expect(parseMessageContent(content, "image")).toBe(content);
    });

    it("returns raw content if JSON parse fails", () => {
        const content = "not json";
        expect(parseMessageContent(content, "text")).toBe("not json");
    });

    it("returns raw content if text field missing", () => {
        const content = JSON.stringify({ other: "field" });
        expect(parseMessageContent(content, "text")).toBe(content);
    });
});

describe("isBotMentioned", () => {
    const mention: MessageMention = {
        key: "@_user_123",
        id: { open_id: "ou_bot123" },
        name: "TestBot",
    };

    it("returns false for empty mentions", () => {
        expect(isBotMentioned([], "ou_bot123")).toBe(false);
        expect(isBotMentioned(undefined, "ou_bot123")).toBe(false);
    });

    it("returns true when bot ID matches", () => {
        expect(isBotMentioned([mention], "ou_bot123")).toBe(true);
    });

    it("returns false when bot ID does not match", () => {
        expect(isBotMentioned([mention], "ou_other")).toBe(false);
    });

    it("returns true for any mention when botOpenId undefined", () => {
        expect(isBotMentioned([mention], undefined)).toBe(true);
    });
});

describe("stripMentions", () => {
    const mentions: MessageMention[] = [
        { key: "@_user_123", id: { open_id: "ou_123" }, name: "Alice" },
    ];

    it("removes @name from text", () => {
        expect(stripMentions("@Alice hello", mentions)).toBe("hello");
    });

    it("removes mention key from text", () => {
        expect(stripMentions("@_user_123 hello", mentions)).toBe("hello");
    });

    it("handles empty mentions", () => {
        expect(stripMentions("hello", [])).toBe("hello");
        expect(stripMentions("hello", undefined)).toBe("hello");
    });

    it("handles special regex characters in name", () => {
        const specialMentions: MessageMention[] = [
            { key: "@_key", id: { open_id: "ou_x" }, name: "Bot.v2" },
        ];
        expect(stripMentions("@Bot.v2 test", specialMentions)).toBe("test");
    });
});

describe("parseMessageEvent", () => {
    const baseEvent: MessageReceivedEvent = {
        sender: {
            sender_id: { open_id: "ou_sender", user_id: "u_sender" },
            sender_type: "user",
        },
        message: {
            message_id: "msg_123",
            chat_id: "oc_chat",
            chat_type: "group",
            message_type: "text",
            content: JSON.stringify({ text: "@Bot hello" }),
            mentions: [{ key: "@_bot", id: { open_id: "ou_bot" }, name: "Bot" }],
        },
    };

    it("parses event into ParsedMessage", () => {
        const result = parseMessageEvent(baseEvent, "ou_bot");
        expect(result.chatId).toBe("oc_chat");
        expect(result.messageId).toBe("msg_123");
        expect(result.senderId).toBe("u_sender");
        expect(result.senderOpenId).toBe("ou_sender");
        expect(result.chatType).toBe("group");
        expect(result.mentionedBot).toBe(true);
        expect(result.content).toBe("hello");
    });

    it("sets mentionedBot false when bot not mentioned", () => {
        const result = parseMessageEvent(baseEvent, "ou_other");
        expect(result.mentionedBot).toBe(false);
    });
});
