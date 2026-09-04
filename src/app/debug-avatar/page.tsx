"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function DebugAvatarPage() {
  const { user } = useAuth(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserInfo() {
      if (!user) {
        console.log("[Debug] 等待用户登录...");
        return;
      }

      console.log("[Debug] 当前用户:", user);
      console.log("[Debug] 用户ID:", user.id);

      try {
        const response = await fetch("/api/user-settings", {
          credentials: "include",
        });

        console.log("[Debug] API响应状态:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("[Debug] 完整API返回:", JSON.stringify(data, null, 2));
          setUserInfo(data);

          if (data.user?.avatar) {
            console.log("[Debug] ✅ 头像URL:", data.user.avatar);
            console.log(
              "[Debug] 头像是否以/uploads/开头:",
              data.user.avatar.startsWith("/uploads/"),
            );
          } else {
            console.log("[Debug] ⚠️ 没有找到avatar字段");
          }
        } else {
          const errorText = await response.text();
          console.error("[Debug] ❌ API错误:", errorText);
        }
      } catch (error) {
        console.error("[Debug] 请求失败:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在调试头像问题...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          🔍 头像调试工具
        </h1>

        {/* 用户信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            📋 当前登录用户
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* API返回信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            🌐 API返回的用户设置
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        </div>

        {/* 头像显示测试 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            🖼️ 头像显示测试
          </h2>

          {userInfo?.user?.avatar ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 font-medium">✅ 找到头像URL</p>
                <p className="text-green-600 text-sm mt-1 break-all">
                  {userInfo.user.avatar}
                </p>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded">
                <div>
                  <p className="text-sm text-gray-600 mb-2">实际显示效果：</p>
                  <img
                    src={userInfo.user.avatar}
                    alt="测试头像"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                    onError={(e) => {
                      console.error("[Debug] 图片加载失败");
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    onLoad={() => {
                      console.log("[Debug] ✅ 图片加载成功！");
                    }}
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    检查项：
                  </p>
                  <ul className="text-sm space-y-1">
                    <li
                      className={
                        userInfo.user.avatar.startsWith("/uploads/")
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      • URL格式正确（/uploads/开头）:{" "}
                      {userInfo.user.avatar.startsWith("/uploads/")
                        ? "✅"
                        : "❌"}
                    </li>
                    <li
                      className={
                        userInfo.user.avatar.includes(".")
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      • 包含文件扩展名:{" "}
                      {userInfo.user.avatar.includes(".") ? "✅" : "❌"}
                    </li>
                    <li className="text-blue-600">
                      • 文件路径:{" "}
                      <code className="bg-gray-100 px-1 rounded">{`public${userInfo.user.avatar}`}</code>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 font-medium mb-2">
                  🔗 直接访问链接测试：
                </p>
                <a
                  href={userInfo.user.avatar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  {userInfo.user.avatar}
                </a>
                <p className="text-yellow-600 text-xs mt-2">
                  点击此链接查看图片是否能正常访问
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">❌ 未找到头像</p>
              <p className="text-red-600 text-sm mt-1">
                请先在个人中心上传头像
              </p>
              <a
                href="/profile"
                className="mt-3 inline-block px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                前往个人中心 →
              </a>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔄 刷新页面
          </button>
          <a
            href="/profile"
            className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors inline-block"
          >
            👤 前往个人中心
          </a>
          <a
            href="/chat/demo-character"
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors inline-block"
          >
            💬 测试聊天界面
          </a>
        </div>

        {/* 说明 */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📝 使用说明</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>查看上方"API返回的用户设置"中的 avatar 字段</li>
            <li>确认 avatar 是否有值（应该类似 /uploads/avatars/1_xxx.jpg）</li>
            <li>查看图片是否能正常显示</li>
            <li>如果图片不显示，点击直接访问链接测试</li>
            <li>打开浏览器控制台（F12）查看详细日志</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
