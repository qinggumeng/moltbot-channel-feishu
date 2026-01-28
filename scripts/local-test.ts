/**
 * Local test script for Feishu plugin - Enhanced version with image support
 * Run: npm run dev:local
 * 
 * Commands:
 *   /test  - Send all message types including image
 *   /help  - Show help
 */

import * as lark from "@larksuiteoapi/node-sdk";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "node:fs";
import * as https from "node:https";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const appId = process.env.FEISHU_APP_ID;
const appSecret = process.env.FEISHU_APP_SECRET;

if (!appId || !appSecret) {
    console.error("❌ Missing FEISHU_APP_ID or FEISHU_APP_SECRET in .env.local");
    process.exit(1);
}

// Create API client
const client = new lark.Client({
    appId,
    appSecret,
    domain: lark.Domain.Feishu,
});

console.log("🚀 Starting Feishu WebSocket client...");
console.log(`   App ID: ${appId}`);

// ============================================================================
// Message Helpers
// ============================================================================

async function sendTextMessage(chatId: string, text: string) {
    return client.im.message.create({
        data: {
            receive_id: chatId,
            msg_type: "text",
            content: JSON.stringify({ text }),
        },
        params: { receive_id_type: "chat_id" },
    });
}

async function sendPostMessage(chatId: string, title: string, content: string) {
    const postContent = {
        zh_cn: {
            title,
            content: [
                [{ tag: "text", text: content }],
                [{ tag: "a", text: "Link", href: "https://www.feishu.cn" }],
            ],
        },
    };
    return client.im.message.create({
        data: {
            receive_id: chatId,
            msg_type: "post",
            content: JSON.stringify(postContent),
        },
        params: { receive_id_type: "chat_id" },
    });
}

async function sendInteractiveCard(chatId: string) {
    const card = {
        config: { wide_screen_mode: true },
        header: {
            title: { tag: "plain_text", content: "🧪 Message Type" },
            template: "blue",
        },
        elements: [
            {
                tag: "div",
                text: { tag: "lark_md", content: "**Interactive Card**\nSupports buttons and Markdown" },
            },
            { tag: "hr" },
            {
                tag: "action",
                actions: [
                    { tag: "button", text: { tag: "plain_text", content: "Button 1" }, type: "primary" },
                    { tag: "button", text: { tag: "plain_text", content: "Button 2" }, type: "default" },
                ],
            },
        ],
    };
    return client.im.message.create({
        data: {
            receive_id: chatId,
            msg_type: "interactive",
            content: JSON.stringify(card),
        },
        params: { receive_id_type: "chat_id" },
    });
}

// ============================================================================
// Image Support
// ============================================================================

/** Download image from URL to temp file */
async function downloadImage(url: string): Promise<string> {
    const tempPath = resolve(__dirname, "../tmp/test-image.png");

    // Ensure tmp directory exists
    const tmpDir = dirname(tempPath);
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tempPath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                resolve(tempPath);
            });
        }).on("error", (err) => {
            fs.unlink(tempPath, () => { });
            reject(err);
        });
    });
}

/** Upload image and get image_key */
async function uploadImage(imagePath: string): Promise<string> {
    const response = await client.im.image.create({
        data: {
            image_type: "message",
            image: fs.createReadStream(imagePath),
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resp = response as any;
    const imageKey = resp.image_key || resp.data?.image_key;

    if (!imageKey) {
        throw new Error(`Upload failed: no image_key in response`);
    }

    return imageKey;
}

/** Send image message */
async function sendImageMessage(chatId: string, imageKey: string) {
    return client.im.message.create({
        data: {
            receive_id: chatId,
            msg_type: "image",
            content: JSON.stringify({ image_key: imageKey }),
        },
        params: { receive_id_type: "chat_id" },
    });
}

/** Send test image from local assets */
async function sendTestImage(chatId: string) {
    try {
        // Use local test image
        const imagePath = resolve(__dirname, "assets/clawbot.jpeg");

        if (!fs.existsSync(imagePath)) {
            console.log("   ⚠️ Test image not found: scripts/assets/clawbot.jpeg");
            return;
        }

        const imageKey = await uploadImage(imagePath);
        await sendImageMessage(chatId, imageKey);
        console.log("   ✅ Image message sent!");
    } catch (err) {
        console.error("   ❌ Image send failed:", err);
    }
}

// ============================================================================
// All Message Types Test
// ============================================================================

async function sendAllMessageTypes(chatId: string) {
    console.log("\n📤 Sending all message types...\n");

    try {
        // 1. Text
        await sendTextMessage(chatId, "1️⃣ Text message (text)");
        console.log("   ✅ Text sent");

        // 2. Post (rich text)
        await sendPostMessage(chatId, "2️⃣ Rich text (post)", "Supports formatting and links");
        console.log("   ✅ Post sent");

        // 3. Interactive card
        await sendInteractiveCard(chatId);
        console.log("   ✅ Card sent");

        // 4. Image
        await sendTestImage(chatId);

        // 5. Markdown in text
        await sendTextMessage(chatId, "4️⃣ Markdown:\n\n**Bold** _Italic_ `Code`\n- List 1\n- List 2");
        console.log("   ✅ Markdown text sent");

        console.log("\n✅ All message types sent!\n");
    } catch (err) {
        console.error("❌ Error:", err);
    }
}

// ============================================================================
// WebSocket Client
// ============================================================================

const messageTypes: Record<string, string> = {
    text: "Text", post: "Rich Text", image: "Image", file: "File",
    audio: "Audio", media: "Video", sticker: "Sticker", interactive: "Card",
};

const wsClient = new lark.WSClient({
    appId,
    appSecret,
    domain: lark.Domain.Feishu,
    loggerLevel: lark.LoggerLevel.info,
});

wsClient.start({
    eventDispatcher: new lark.EventDispatcher({}).register({
        "im.message.receive_v1": async (data) => {
            const message = data.message;
            const typeDesc = messageTypes[message.message_type] || message.message_type;

            console.log("\n" + "=".repeat(50));
            console.log(`📨 Received [${typeDesc}] message`);
            console.log(`   Chat: ${message.chat_id}`);
            console.log(`   Content: ${message.content}`);
            console.log("=".repeat(50));

            let text = "";
            try {
                text = JSON.parse(message.content).text || "";
            } catch { text = ""; }

            if (text === "/test") {
                await sendAllMessageTypes(message.chat_id);
            } else if (text === "/help") {
                await sendTextMessage(message.chat_id, "🔧 Commands:\n/test - Send all message types\n/help - Help");
            } else {
                await sendTextMessage(message.chat_id, `Received [${typeDesc}]!\n\nSend "/test" to test all message types (including image)`);
            }
        },
    }),
});

console.log("✅ Ready. Send '/test' to test all message types including image.");
console.log("   Ctrl+C to stop.\n");
