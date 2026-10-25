import { motion } from "framer-motion";
import type { ChecklistResultRule } from "@/data/checklists/types";
import { levelInfo } from "@/data/checklists/levels";

/** Цветная шкала: слева зелёный (0%), справа красный (100%), стрелка указывает балл. */
export default function ScoreScale({ rules, score }: { rules: ChecklistResultRule[]; score: number }) {
  if (!rules.length) return null;
  const min = Math.min(...rules.map(r => r.minScore));
  const max = Math.max(...rules.map(r => r.maxScore));
  const span = Math.max(1, max - min);
  // Направление: если у «лёгких» уровней баллы выше, чем у тяжёлых — разворачиваем.
  const sorted = [...rules].sort((a, b) => levelInfo(a.level).severity - levelInfo(b.level).severity);
  const inverted = sorted[0].minScore > sorted[sorted.length - 1].minScore;
  const pos = (v: number) => {
    const p = ((v - min) / span) * 100;
    return Math.min(100, Math.max(0, inverted ? 100 - p : p));
  };
  const zones = [...rules]
    .map(r => {
      const a = pos(r.minScore), b = pos(r.maxScore);
      return { r, from: Math.min(a, b), to: Math.max(a, b) };
    })
    .sort((x, y) => x.from - y.from);
  const arrow = pos(score);

  return (
    <div className="pt-10 pb-2">
      <div className="relative">
        <motion.div
          className="absolute -top-10 flex flex-col items-center -translate-x-1/2"
          initial={{ left: "0%" }}
          animate={{ left: `${arrow}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <span className="px-2 py-0.5 rounded-md bg-foreground text-background text-xs font-semibold whitespace-nowrap">
            {score} балл.
          </span>
          <span className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[9px] border-l-transparent border-r-transparent border-t-foreground" />
        </motion.div>
        <div className="relative h-4 rounded-full overflow-hidden flex">
          {zones.map((z, i) => (
            <div key={i} style={{ width: `${Math.max(z.to - z.from, 2)}%`, background: levelInfo(z.r.level).color }} className="h-full border-r border-background/60 last:border-r-0" />
          ))}
        </div>
        <div className="flex mt-1">
          {zones.map((z, i) => (
            <div key={i} style={{ width: `${Math.max(z.to - z.from, 2)}%` }} className="text-[10px] leading-tight text-muted-foreground text-center px-0.5">
              {z.r.minScore}–{z.r.maxScore}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
          <span>Всё отлично</span><span>Тяжёлое состояние</span>
        </div>
      </div>
    </div>
  );
}
