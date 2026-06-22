import { Sparkles } from 'lucide-react';

export default function Logo({ showText = true, size = 36, light = false }: { showText?: boolean; size?: number; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow" style={{ width: size, height: size }}>
        <Sparkles style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
      {showText && <span className={`font-display text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink-900'}`}>WhatsMoney</span>}
    </span>
  );
}
