import React from 'react';
import { useFitness } from '../context/FitnessContext';
import { Timer, X, Plus } from 'lucide-react';

export const RestTimerModal: React.FC = () => {
  const { isRestTimerActive, restTimerSeconds, startRestTimer, cancelRestTimer } = useFitness();

  if (!isRestTimerActive || restTimerSeconds <= 0) return null;

  const minutes = Math.floor(restTimerSeconds / 60);
  const seconds = restTimerSeconds % 60;
  const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl shadow-emerald-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Timer className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Rest Timer</div>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatted}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => startRestTimer(restTimerSeconds + 30)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1 transition-colors min-h-[36px]"
            title="Add 30 seconds"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+30s</span>
          </button>
          <button
            onClick={cancelRestTimer}
            className="w-9 h-9 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors min-h-[36px]"
            title="Dismiss timer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
