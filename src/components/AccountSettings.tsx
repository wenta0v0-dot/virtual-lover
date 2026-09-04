"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UserSettings {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
}

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdate?: (settings: UserSettings) => void;
}

export default function AccountSettings({
  isOpen,
  onClose,
  onSettingsUpdate,
}: AccountSettingsProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !settings) {
      fetchUserSettings();
    }
  }, [isOpen]);

  async function fetchUserSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/user-settings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setPreviewAvatar(data.avatar);
      }
    } catch (error) {
      console.error("获取用户设置失败:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("图片大小不能超过5MB");
        return;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("avatar", file);

        console.log("[AccountSettings] 开始上传头像...");

        const response = await fetch("/api/upload/avatar", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log("[AccountSettings] 上传成功:", result.url);
          setPreviewAvatar(result.url);
          setUploadedAvatarUrl(result.url);
          alert("✅ 头像上传成功！");
        } else {
          console.error("[AccountSettings] 上传失败:", result.error);
          alert(`上传失败: ${result.error || "未知错误"}`);
        }
      } catch (error) {
        console.error("[AccountSettings] 上传异常:", error);
        alert("上传失败，请检查网络连接");
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    try {
      const updateData: Record<string, string | null> = {};

      if (previewAvatar !== settings.avatar) {
        updateData.avatar = previewAvatar;
      }

      updateData.name = settings.name || "";

      const res = await fetch("/api/user-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.user);
        onSettingsUpdate?.(data.user);
        onClose();
        alert("✨ 设置已更新！");
      } else {
        const error = await res.json();
        alert(`更新失败: ${error.error}`);
      }
    } catch (error) {
      console.error("保存设置失败:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  function handleResetAvatar() {
    setPreviewAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#F8C8D4]/20 to-[#C8D4F8]/20 backdrop-blur-sm border-b border-white/50 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#9B8A8E]"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-[#3D2C2E]">⚙️ 账户设置</h2>
          <p className="text-sm text-[#9B8A8E] mt-1">个性化你的心灵空间</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F8C8D4]" />
            </div>
          ) : settings ? (
            <>
              {/* Avatar Section */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#3D2C2E] flex items-center gap-2">
                  <span>🖼️</span> 头像
                </label>

                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div
                      className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#F8C8D4]/30 to-[#C8D4F8]/30 border-2 border-dashed border-[#E0D5D0] hover:border-[#F8C8D4] transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewAvatar ? (
                        <img
                          src={previewAvatar}
                          alt="头像预览"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          👤
                        </div>
                      )}
                    </div>

                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-[#9B8A8E]">
                      点击上传头像
                      <br />
                      支持 JPG、PNG，最大 5MB
                    </p>

                    {previewAvatar && (
                      <button
                        onClick={handleResetAvatar}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        重置为默认
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Section */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#3D2C2E] flex items-center gap-2">
                  <span>✏️</span> 昵称
                </label>

                <input
                  type="text"
                  value={settings.name || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, name: e.target.value })
                  }
                  placeholder="给自己起个名字吧..."
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-white/60 border border-[#E0D5D0] focus:border-[#F8C8D4] focus:ring-2 focus:ring-[#F8C8D4]/20 outline-none transition-all text-[#3D2C2E] placeholder:text-[#C0B5AF]"
                />

                <p className="text-xs text-[#9B8A8E] text-right">
                  {settings.name?.length || 0}/100
                </p>
              </div>

              {/* Email Display */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#3D2C2E] flex items-center gap-2">
                  <span>📧</span> 邮箱
                </label>

                <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[#9B8A8E]">
                  {settings.email}
                </div>

                <p className="text-xs text-[#9B8A8E]">
                  邮箱用于登录和找回密码，不可修改
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-[#E0D5D0]/30 p-6 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              saving
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#F8C8D4] to-[#F8B8C4] text-white hover:shadow-lg hover:scale-[1.02]"
            }`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                保存中...
              </span>
            ) : (
              "💾 保存设置"
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium bg-gray-100 text-[#9B8A8E] hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
