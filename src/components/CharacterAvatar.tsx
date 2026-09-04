interface CharacterAvatarProps {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showRing?: boolean;
  interactive?: boolean;
}

const sizeMap = {
  sm: { container: "w-10 h-10", text: "text-lg", ring: "ring-2" },
  md: { container: "w-12 h-12", text: "text-xl", ring: "ring-2" },
  lg: { container: "w-16 h-16", text: "text-2xl", ring: "ring-3" },
  xl: { container: "w-24 h-24", text: "text-4xl", ring: "ring-4" },
};

function generateColorPalette(name: string) {
  const colors = [
    { from: "#F8C8D4", to: "#F8B8C4", accent: "#E898A8" },
    { from: "#C8D4F8", to: "#B8C8F8", accent: "#98A8E8" },
    { from: "#D4F8C8", to: "#C8F8B8", accent: "#A8E898" },
    { from: "#F8D4C8", to: "#F8C8B8", accent: "#E8B898" },
    { from: "#E8C8F8", to: "#D8B8F8", accent: "#C898E8" },
    { from: "#C8F8F0", to: "#B8F8E0", accent: "#98E8D8" },
    { from: "#F8E8C8", to: "#F8D8B8", accent: "#E8C898" },
    { from: "#F8C8E8", to: "#F8B8D8", accent: "#E898C8" },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return name.charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

function getPatternStyle(name: string): string {
  const patterns = [
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)",
    "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)",
    "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
    "radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, transparent 70%)",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return patterns[Math.abs(hash) % patterns.length];
}

export default function CharacterAvatar({
  name,
  avatar,
  size = "md",
  className = "",
  showRing = true,
  interactive = false,
}: CharacterAvatarProps) {
  const config = sizeMap[size];
  const palette = generateColorPalette(name);
  const initials = getInitials(name);
  const pattern = getPatternStyle(name);

  // 智能判断是否为有效图片路径（以 / 开头或 http 开头，且包含图片扩展名或 /characters/ 路径）
  const isValidImagePath = (path: string | null | undefined): boolean => {
    if (!path || path === "") return false;

    // 以 http/https 开头的远程图片
    if (path.startsWith("http")) return true;

    // 本地图片路径（以 / 开头）
    if (path.startsWith("/")) {
      // 检查是否是常见的图片路径模式
      const imagePatterns = [
        /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i, // 有图片扩展名
        /\/characters\//i, // 角色图片目录
        /\/avatars\//i, // 头像目录
        /\/images\//i, // 图片目录
        /\/img\//i, // img目录
      ];

      return imagePatterns.some((pattern) => pattern.test(path));
    }

    return false;
  };

  const hasImage = isValidImagePath(avatar);

  return (
    <div
      className={`
        relative ${config.container} rounded-2xl overflow-hidden
        ${showRing ? config.ring : ""}
        ${showRing ? "ring-white/50" : ""}
        ${interactive ? "cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg" : ""}
        ${className}
      `}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br`}
        style={{
          background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
        }}
      />

      <div
        className="absolute inset-0 opacity-60"
        style={{ background: pattern }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {hasImage ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover relative z-10"
            onError={(e) => {
              // 图片加载失败时隐藏图片，显示首字母
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span
              className={`${config.text} font-bold text-white drop-shadow-sm`}
              style={{
                textShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {initials}
            </span>
            {size === "xl" && (
              <span className="text-xs text-white/90 mt-1 font-medium drop-shadow-sm max-w-[80px] truncate text-center">
                {name}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-white/20 rounded-bl-full blur-xl" />

      {interactive && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 rounded-2xl" />
      )}
    </div>
  );
}
