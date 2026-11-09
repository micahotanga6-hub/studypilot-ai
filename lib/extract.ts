import "server-only";
import { ApiError } from "@/lib/http";

export type UploadKind = "pdf" | "docx" | "txt";

export function detectUpload(filename: string, bytes: Uint8Array): UploadKind {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (ext === "doc") {
    throw new ApiError(400, "Older .doc files are not supported. Save the file as .docx and upload that.");
  }
  if (ext === "pdf") {
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf8");
    if (!header.startsWith("%PDF")) {
      throw new ApiError(400, "This file does not look like a PDF. Check that it is a real PDF and try again.");
    }
    return "pdf";
  }
  if (ext === "docx") {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new ApiError(400, "This file does not look like a DOCX document. Export it as .docx and try again.");
    }
    return "docx";
  }
  if (ext === "txt") {
    const sample = bytes.slice(0, 4000);
    let nuls = 0;
    for (const byte of sample) if (byte === 0) nuls += 1;
    if (nuls > 0) {
      throw new ApiError(400, "This TXT file looks like binary data, so the text could not be read.");
    }
    return "txt";
  }
  throw new ApiError(400, "Upload a PDF, DOCX, or TXT file.");
}

export async function extractUpload(kind: UploadKind, bytes: Uint8Array): Promise<string> {
  try {
    if (kind === "txt") {
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    }
    if (kind === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      return result.value || "";
    }
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(extracted.text) ? extracted.text : [extracted.text];
    return pages.map((page) => page.trim()).filter(Boolean).join("\n\n");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (kind === "pdf" && /password/i.test(message)) {
      throw new ApiError(400, "This PDF is password-protected. Remove the password and upload it again.");
    }
    if (kind === "pdf") {
      throw new ApiError(
        400,
        "This PDF could not be read. It may be damaged, password-protected, or a scan without selectable text.",
      );
    }
    if (kind === "docx") {
      throw new ApiError(400, "This DOCX file could not be read. It may be damaged or not a real Word document.");
    }
    throw new ApiError(400, "The file text could not be read.");
  }
}

export function assertReadableText(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length < 40) {
    throw new ApiError(
      400,
      "Almost no text was found. If this is a scanned PDF or a photo, paste the text instead. StudyPilot cannot read images of pages.",
    );
  }
}
