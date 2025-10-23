// src/components/dashboard/Podium.jsx
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Medal, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";
import { ShineBorder } from "../ui/ShineBorder.jsx";

const medalStyles = {
  1: { bg: "from-yellow-400 to-amber-500", ring: "ring-amber-300/50" },
  2: { bg: "from-slate-300 to-slate-400", ring: "ring-slate-300/50" },
  3: { bg: "from-orange-400 to-amber-600", ring: "ring-amber-400/50" },
};

function MedalBadge({ place }) {
  const { bg } = medalStyles[place];
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-black/80", "bg-gradient-to-b", bg)}>
      <Medal className="h-3.5 w-3.5" />
      {place === 1 ? "Ouro" : place === 2 ? "Prata" : "Bronze"}
    </div>
  );
}

function Avatar({ name }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
  return (
    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80 grid place-items-center ring-2 ring-slate-300 dark:ring-white/10">
      <span className="text-sm font-bold">{initials || "?"}</span>
    </div>
  );
}

// MUDANÇA AQUI: O componente agora aceita "rankingSelector" como uma propriedade
export function Podium({ title = "Ranking", periodLabel, data, loading = false, rankingSelector = null }) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data]);
  const top3 = sorted.slice(0, 3);
  const formatCount = (n) => `${n}`;

  return (
    <div className="relative w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
            <Trophy className="h-5 w-5 text-violet-500" /> {title}
          </h2>
          {periodLabel && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{periodLabel}</p>}
        </div>
        {/* Renderiza o seletor (dropdown) aqui se ele for passado */}
        {rankingSelector}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-slate-100/50 dark:bg-white/5 p-5 relative overflow-hidden">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6">Pódio Top 3</h3>
          {loading ? (
            <div className="h-[260px] animate-pulse grid grid-cols-3 gap-4 items-end"><div className="rounded-xl h-2/3 bg-slate-200 dark:bg-white/10" /><div className="rounded-xl h-full bg-slate-200 dark:bg-white/10" /><div className="rounded-xl h-1/2 bg-slate-200 dark:bg-white/10" /></div>
          ) : (
            <div className="h-[260px] grid grid-cols-3 items-end gap-4">
              {[1, 0, 2].map((dataIndex) => {
                const e = top3[dataIndex];
                const place = dataIndex + 1;
                const style = medalStyles[place];
                return (
                  <div key={place} className="relative grid place-items-end h-full">
                    <AnimatePresence>
                      <motion.div
                        initial={{ height: 56, opacity: 0.7 }} animate={{ height: e ? [240, 180, 120][place-1] : 56, opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                        className={cn("w-full rounded-2xl ring-1 backdrop-blur-sm cursor-default", "bg-gradient-to-b from-white/70 to-white/40 dark:from-white/10 dark:to-white/5", e ? style.ring : "ring-slate-200 dark:ring-white/10")}>
                        <div className="p-3 flex items-center justify-between"><MedalBadge place={place} />{e && <span className="text-xs text-slate-500 dark:text-slate-300">{formatCount(e.count)}</span>}</div>
                        <div className={cn("mx-3 mb-3 rounded-xl h-3 bg-gradient-to-r", e ? style.bg : "from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800")} />
                        <div className="px-3 pb-3 flex items-center gap-2"><Avatar name={e?.name || "-"} />
                          <div className="min-w-0"><div className="text-sm font-semibold truncate">{e?.name || "-"}</div><div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{e ? formatCount(e.count) : "0"}</div></div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-slate-100/50 dark:bg-white/5 p-5">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">Ranking Geral</h3>
          <ol className="space-y-2">
            {sorted.length > 0 ? sorted.map((e, i) => (
              <li key={e.id}>
                <div className={cn("w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 ring-1", i === 0 ? "bg-yellow-500/10 ring-yellow-400/30" : "bg-white dark:bg-white/5 ring-slate-200 dark:ring-white/10")}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("h-7 w-7 shrink-0 grid place-items-center rounded-lg text-[11px] font-bold", i === 0 ? "bg-yellow-600/30 text-yellow-100" : "bg-slate-200 dark:bg-slate-700/40 text-slate-600 dark:text-slate-200")}>{i + 1}</div>
                    <span className="truncate">{e.name}</span>
                  </div>
                  <span className={cn("text-sm tabular-nums", i === 0 ? "text-yellow-300" : "text-slate-600 dark:text-slate-300")}>{e.count}</span>
                </div>
              </li>
            )) : <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Sem dados de ranking.</p>}
          </ol>
        </div>
      </div>
      <ShineBorder shineColor="#6464FF" />
    </div>
  );
}