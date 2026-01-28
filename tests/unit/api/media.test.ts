/**
 * Unit tests for api/media.ts
 */

import { describe, it, expect } from "vitest";
import { detectFileType } from "../../../dist/api/media.js";

describe("detectFileType", () => {
    it("detects opus audio", () => {
        expect(detectFileType("audio.opus")).toBe("opus");
        expect(detectFileType("voice.ogg")).toBe("opus");
    });

    it("detects video formats", () => {
        expect(detectFileType("video.mp4")).toBe("mp4");
        expect(detectFileType("movie.mov")).toBe("mp4");
        expect(detectFileType("clip.avi")).toBe("mp4");
    });

    it("detects document formats", () => {
        expect(detectFileType("doc.pdf")).toBe("pdf");
        expect(detectFileType("doc.doc")).toBe("doc");
        expect(detectFileType("doc.docx")).toBe("doc");
        expect(detectFileType("sheet.xls")).toBe("xls");
        expect(detectFileType("sheet.xlsx")).toBe("xls");
        expect(detectFileType("slides.ppt")).toBe("ppt");
        expect(detectFileType("slides.pptx")).toBe("ppt");
    });

    it("defaults to stream for unknown types", () => {
        expect(detectFileType("file.txt")).toBe("stream");
        expect(detectFileType("data.json")).toBe("stream");
        expect(detectFileType("noextension")).toBe("stream");
    });

    it("handles case-insensitive extensions", () => {
        expect(detectFileType("FILE.PDF")).toBe("pdf");
        expect(detectFileType("Video.MP4")).toBe("mp4");
    });
});
