import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { APP_IMAGES } from '../data/initialData';
import {
  User,
  Settings,
  Trophy,
  Scale,
  TrendingUp,
  Flame,
  Zap,
  Edit3,
  Plus,
  X,
  ShieldCheck,
  Check,
  Calendar,
  LogOut,
  Sparkles,
  Share2,
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const {
    userProfile,
    updateProfile,
    weightLogs,
    addWeightLog,
    prs,
    addOrUpdatePR,
    workoutHistory,
    isPremium,
    setIsSubscriptionOpen,
    setIsOnboardingOpen,
    setIsShareModalOpen,
  } = useFitness();

  const [isWeightModalOpen, setIsWeightModalOpen] = useState<boolean>(false);
  const [newWeightInput, setNewWeightInput] = useState<string>(userProfile.weight.toString());
  const [isPRModalOpen, setIsPRModalOpen] = useState<boolean>(false);
  const [newPRExercise, setNewPRExercise] = useState<string>('Barbell Bench Press');
  const [newPRWeight, setNewPRWeight] = useState<string>('100');
  const [newPRReps, setNewPRReps] = useState<string>('5');

  // Measurements state
  const [measurements, setMeasurements] = useState<{ [key: string]: number }>({
    Chest: 104,
    Arms: 38.5,
    Waist: 81,
    Thighs: 59,
  });

  const handleSaveWeight = () => {
    const val = parseFloat(newWeightInput);
    if (val > 30 && val < 300) {
      addWeightLog(val);
      setIsWeightModalOpen(false);
    }
  };

  const handleSavePR = () => {
    const w = parseFloat(newPRWeight);
    const r = parseInt(newPRReps, 10);
    if (newPRExercise && w > 0 && r > 0) {
      addOrUpdatePR({
        exercise: newPRExercise,
        weight: w,
        reps: r,
        date: new Date().toISOString().split('T')[0],
      });
      setIsPRModalOpen(false);
    }
  };

  const totalVolumeLifted = workoutHistory.reduce((acc, w) => acc + w.totalVolumeKg, 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/40 relative shadow-md shrink-0">
              <img
                src={APP_IMAGES.trainerAvatar}
                alt={userProfile.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-white">{userProfile.name}</h2>
                {isPremium && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    PRO
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {userProfile.age} yrs · {userProfile.experience} · {userProfile.gender}
              </div>
              <div className="text-xs text-emerald-400 font-medium mt-1">
                Goal: {userProfile.goal}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
              title="Share athlete milestone to social media"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Edit fitness profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2.5 pt-5 mt-5 border-t border-zinc-800/80">
          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center">
            <div className="text-[10px] uppercase font-bold text-zinc-500">Weight</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {userProfile.weight} <span className="text-xs font-normal text-zinc-400">kg</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Target: {userProfile.targetWeight}kg</div>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center">
            <div className="text-[10px] uppercase font-bold text-zinc-500">Height</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {userProfile.height} <span className="text-xs font-normal text-zinc-400">cm</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{(userProfile.height / 30.48).toFixed(1)} ft</div>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center">
            <div className="text-[10px] uppercase font-bold text-zinc-500">Workouts</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {workoutHistory.length}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Completed</div>
          </div>
        </div>
      </div>

      {/* Subscription Banner / Status */}
      {!isPremium ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" /> FitAI Pro Membership
            </div>
            <div className="text-xs text-zinc-300 mt-0.5">
              Unlock unlimited AI workout plans, video form cues & Indian diet formulas.
            </div>
          </div>
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shrink-0 min-h-[40px]"
          >
            Upgrade
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>FitAI Pro Active · All features unlocked</span>
          </div>
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Manage
          </button>
        </div>
      )}

      {/* Weight History Tracker */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" /> Body Weight Progress
            </h3>
            <div className="text-xs text-zinc-400 mt-0.5">
              Logged {weightLogs.length} weigh-ins over recent weeks
            </div>
          </div>

          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold flex items-center gap-1 transition-colors min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Weight</span>
          </button>
        </div>

        {/* Weight Log entries */}
        <div className="space-y-2">
          {weightLogs.slice(-4).reverse().map((entry, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                <span>{entry.date}</span>
              </div>
              <div className="font-mono font-bold text-white tabular-nums">
                {entry.weight} kg
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Records (PRs) Board */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Personal Records (PRs)
            </h3>
            <div className="text-xs text-zinc-400 mt-0.5">
              Maximum weight lifted across core compound exercises
            </div>
          </div>

          <button
            onClick={() => setIsPRModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold flex items-center gap-1 transition-colors min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add PR</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {prs.map((pr, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1"
            >
              <div className="text-xs font-bold text-white truncate">{pr.exercise}</div>
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {pr.weight} <span className="text-xs font-normal text-zinc-400">kg × {pr.reps} reps</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">{pr.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body Circumference Measurements */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
        <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Body Circumference (cm)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {Object.entries(measurements).map(([part, val]) => (
            <div key={part} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
              <div className="text-[11px] font-semibold text-zinc-400">{part}</div>
              <div className="text-base font-bold font-mono text-white mt-0.5">{val} cm</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences & Privacy */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Account & Preferences</div>
        <div className="divide-y divide-zinc-800/80 text-xs text-zinc-300">
          <div className="py-2.5 flex items-center justify-between">
            <span>Location & Equipment Setup</span>
            <span className="text-emerald-400 font-medium">{userProfile.location} ({userProfile.equipment.length} items)</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span>Dietary Preference</span>
            <span className="text-emerald-400 font-medium">{userProfile.dietPreference}</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span>Allergies Registered</span>
            <span className="text-zinc-400 font-mono">
              {userProfile.allergies.length > 0 ? userProfile.allergies.join(', ') : 'None'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="w-full mt-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
        >
          Re-calibrate Profile & Goals
        </button>
      </div>

      {/* Modal: Log Weight */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsWeightModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-heading text-white">Log Today's Weight</h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Weight in Kilograms (kg)</label>
              <input
                type="number"
                step="0.1"
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-lg font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveWeight}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-zinc-950 text-xs tracking-wide transition-colors"
            >
              Save Weigh-in
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add PR */}
      {isPRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsPRModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-heading text-white">Log Personal Record</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Exercise</label>
                <input
                  type="text"
                  value={newPRExercise}
                  onChange={(e) => setNewPRExercise(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPRWeight}
                    onChange={(e) => setNewPRWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Reps</label>
                  <input
                    type="number"
                    value={newPRReps}
                    onChange={(e) => setNewPRReps(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePR}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-zinc-950 text-xs tracking-wide transition-colors"
            >
              Save Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
