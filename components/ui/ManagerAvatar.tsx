"use client";

import { useState } from "react";

interface ManagerAvatarProps {
  img?: string;
  emoji: string;
  color: string;
  size?: number;
}

/** آواتارِ مدیر: تصویر اگر بود، وگرنه ایموجیِ fallback */
export function ManagerAvatar({ img, emoji, color, size = 52 }: ManagerAvatarProps) {
  const [err, setErr] = useState(false);
  const box = { width: size, height: size };

  if (img && !err) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={img}
        alt=""
        onError={() => setErr(true)}
        className="rounded-full object-cover ring-2"
        style={{ ...box, boxShadow: `0 0 0 2px ${color}` }}
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-full"
      style={{
        ...box,
        background: `color-mix(in srgb, ${color} 30%, #0f2018)`,
        boxShadow: `0 0 0 2px ${color}`,
        fontSize: size * 0.5,
      }}
    >
      {emoji}
    </div>
  );
}
