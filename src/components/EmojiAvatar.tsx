"use client";

import { useMemo } from "react";

interface EmojiAvatarProps {
  name: string;
  gender: "male" | "female";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// 根据名字生成稳定的emoji头像
const getEmojiForName = (name: string, gender: "male" | "female"): string => {
  const femaleEmojis = [
    "👩",
    "👧",
    "👸",
    "🧝‍♀️",
    "🧚‍♀️",
    "🧙‍♀️",
    "👩‍🎨",
    "👩‍🚀",
    "👩‍⚕️",
    "👩‍🏫",
  ];
  const maleEmojis = [
    "👨",
    "👦",
    "🤴",
    "🧝‍♂️",
    "🧚‍♂️",
    "🧙‍♂️",
    "👨‍🎨",
    "👨‍🚀",
    "👨‍⚕️",
    "👨‍🏫",
  ];

  const emojis = gender === "female" ? femaleEmojis : maleEmojis;

  // 使用名字的第一个字符的charCode来选择一个稳定的emoji
  const charCode = name.charCodeAt(0) || 0;
  return emojis[charCode % emojis.length];
};

// 生成渐变背景色
const getGradientForName = (name: string): string => {
  const gradients = [
    "from-[#FFB6C1] to-[#FF69B4]",
    "from-[#A8D8EA] to-[#87CEEB]",
    "from-[#C8E6C9] to-[#90EE90]",
    "from-[#FFD580] to-[#FFA500]",
    "from-[#D8BFD8] to-[#DA70D6]",
    "from-[#FFE4B5] to-[#F0E68C]",
    "from-[#F8C8D4] to-[#FFB6C1]",
    "from-[#B8C8D8] to-[#A8D8EA]",
  ];

  const charCode = name.charCodeAt(0) || 0;
  return gradients[charCode % gradients.length];
};

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-xl",
  lg: "w-16 h-16 text-2xl",
  xl: "w-20 h-20 text-3xl",
};

export default function EmojiAvatar({
  name,
  gender,
  size = "md",
  className = "",
}: EmojiAvatarProps) {
  const emoji = useMemo(() => getEmojiForName(name, gender), [name, gender]);
  const gradient = useMemo(() => getGradientForName(name), [name]);

  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm ${sizeClasses[size]} ${className}`}
    >
      <span className="drop-shadow-sm">{emoji}</span>
    </div>
  );
}
