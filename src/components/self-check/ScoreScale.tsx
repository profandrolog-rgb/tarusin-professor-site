import { motion } from "framer-motion";
import type { ChecklistResultRule } from "@/data/checklists/types";
import { levelInfo } from "@/data/checklists/levels";

/** Цветная шкала: слева зелёный (0%), справа красный (100%), стрелка указывает балл. */
export default function ScoreScale({ rules, score }: { rules: ChecklistResultRule[]; score: number }) {
  if (!rules.length) return null;
  // Направление: если у «лёгких» уровней баллы выше, чем у тяжёлых — разворачиваем.
  const bySeverity = [...rules].sort((a, b) => levelInfo(a.level).severity - levelInfo(b.level).severity);
  const inverted = bySeverity[0].minScore > bySeverity[bySeverity.length - 1].minScore;
  const ordered = [...rules].sort((a, b) => (inverted ? b.minScore - a.minScore : a.minScore - b.minScore));
  const lens = ordered.map(r => Math.max(1, r.maxScore - r.minScore + 1));
  const total = lens.reduce((s, x) => s + x, 0);
  let acc = 0;
  const zones = ordered.map((r, i) => {
    const from = (acc / total) * 100;
    acc += lens[i];
    return { r, from, width: (lens[i] / total) * 100 };
  });
  const z = zones.find(x => score >= x.r.minScore && score <= x.r.maxScore) ?? (score < Math.min(...rules.map(r => r.minScore)) ? (inverted ? zones[zones.length - 1] : zones[0]) : (inverted ? zones[0] : zones[zones.length - 1]));
  const len = Math.max(1, z.r.maxScore - z.r.minScore + 1);
  const offset = Math.min(len - 0.5, Math.max(0.5, (inverted ? z.r.maxScore - score : score - z.r.minScore) + 0.5));
  const arrow = z.from + (offset / len) * z.width;

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
