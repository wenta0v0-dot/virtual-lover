import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

class LocalFileStorage {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || "./public/uploads";
    this.baseUrl = process.env.BASE_URL || "http://localhost:5000";
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.join(this.uploadDir, "avatars"), { recursive: true });
      console.log(`[Storage] 初始化完成，上传目录: ${this.uploadDir}`);
    } catch (error) {
      console.error("[Storage] 初始化目录失败:", error);
      throw error;
    }
  }

  async saveAvatar(
    userId: number,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    try {
      const ext = this.getExtension(mimeType, originalName);
      if (!ext) {
        return { success: false, error: "不支持的文件格式" };
      }

      const filename = this.generateFilename(userId, ext);
      // 使用正斜杠作为路径分隔符（URL标准）
      const relativePath = `avatars/${filename}`;
      const fullPath = path.join(this.uploadDir, "avatars", filename); // 文件系统路径可以保持系统默认

      await fs.writeFile(fullPath, fileBuffer);

      // 确保URL使用正斜杠
      const url = `${this.baseUrl}/uploads/${relativePath}`.replace(/\\/g, "/");

      console.log(`[Storage] 头像上传成功:`, {
        userId,
        filename,
        size: fileBuffer.length,
        url,
      });

      return {
        success: true,
        url,
        filename: relativePath,
      };
    } catch (error) {
      console.error("[Storage] 上传失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "上传失败",
      };
    }
  }

  async deleteAvatar(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
      console.log(`[Storage] 文件删除成功:`, filePath);
      return true;
    } catch (error) {
      console.error("[Storage] 删除失败:", error);
      return false;
    }
  }

  async getFileInfo(
    filePath: string,
  ): Promise<{ exists: boolean; size?: number }> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      const stats = await fs.stat(fullPath);
      return { exists: true, size: stats.size };
    } catch {
      return { exists: false };
    }
  }

  private generateFilename(userId: number, ext: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    return `${userId}_${timestamp}_${random}.${ext}`;
  }

  private getExtension(mimeType: string, originalName: string): string | null {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };

    if (mimeToExt[mimeType]) {
      return mimeToExt[mimeType];
    }

    const ext = path.extname(originalName).toLowerCase().slice(1);
    const allowedExts = ["jpg", "jpeg", "png", "gif", "webp"];

    return allowedExts.includes(ext) ? ext : null;
  }

  validateImage(
    buffer: Buffer,
    mimeType: string,
  ): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!allowedTypes.includes(mimeType)) {
      return { valid: false, error: `不支持的文件类型: ${mimeType}` };
    }

    if (buffer.length > maxSize) {
      return {
        valid: false,
        error: `文件过大 (${(buffer.length / 1024 / 1024).toFixed(2)}MB)，最大允许5MB`,
      };
    }

    return { valid: true };
  }
}

export const storage = new LocalFileStorage();
export default storage;
