/**
 * Message-related types for API operations.
 */

/** Target ID type for message sending */
export type ReceiveIdType = "open_id" | "user_id" | "union_id" | "chat_id";

/** Domain selection */
export type FeishuDomain = "feishu" | "lark";

/** Connection mode */
export type ConnectionMode = "websocket" | "webhook";

/** DM access policy */
export type DmPolicy = "open" | "pairing" | "allowlist";

/** Group access policy */
export type GroupPolicy = "open" | "allowlist" | "disabled";

/** Chat type */
export type ChatType = "p2p" | "group";

/** Parameters for sending a text message */
export interface SendTextParams {
  to: string;
  text: string;
  replyToMessageId?: string;
}

/** Parameters for sending an interactive card */
export interface SendCardParams {
  to: string;
  card: Record<string, unknown>;
  replyToMessageId?: string;
}

/** Parameters for editing a message */
export interface EditMessageParams {
  messageId: string;
  text: string;
}

/** Result of sending a message */
export interface SendResult {
  messageId: string;
  chatId: string;
}

/** Retrieved message information */
export interface MessageInfo {
  messageId: string;
  chatId: string;
  senderId?: string;
  senderOpenId?: string;
  content: string;
  contentType: string;
  createTime?: number;
}

/** Parsed message context for internal processing */
export interface ParsedMessage {
  chatId: string;
  messageId: string;
  senderId: string;
  senderOpenId: string;
  senderName?: string;
  chatType: ChatType;
  mentionedBot: boolean;
  rootId?: string;
  parentId?: string;
  content: string;
  contentType: string;
}

/** Parameters for uploading an image */
export interface UploadImageParams {
  image: Buffer | string;
  imageType?: "message" | "avatar";
}

/** Result of image upload */
export interface ImageUploadResult {
  imageKey: string;
}

/** File type for upload */
export type FileType = "opus" | "mp4" | "pdf" | "doc" | "xls" | "ppt" | "stream";

/** Parameters for uploading a file */
export interface UploadFileParams {
  file: Buffer | string;
  fileName: string;
  fileType: FileType;
  duration?: number;
}

/** Result of file upload */
export interface FileUploadResult {
  fileKey: string;
}

/** Parameters for sending media */
export interface SendMediaParams {
  to: string;
  mediaUrl?: string;
  mediaBuffer?: Buffer;
  fileName?: string;
  replyToMessageId?: string;
}

/** Reaction information */
export interface Reaction {
  reactionId: string;
  emojiType: string;
  operatorType: "app" | "user";
  operatorId: string;
}

/** Parameters for adding a reaction */
export interface AddReactionParams {
  messageId: string;
  emojiType: string;
}

/** Parameters for removing a reaction */
export interface RemoveReactionParams {
  messageId: string;
  reactionId: string;
}

/** User from directory */
export interface DirectoryUser {
  kind: "user";
  id: string;
  name?: string;
}

/** Group from directory */
export interface DirectoryGroup {
  kind: "group";
  id: string;
  name?: string;
}

/** Parameters for directory listing */
export interface ListDirectoryParams {
  query?: string;
  limit?: number;
}

/** Probe result for connection testing */
export interface ProbeResult {
  ok: boolean;
  error?: string;
  appId?: string;
  botName?: string;
  botOpenId?: string;
}
