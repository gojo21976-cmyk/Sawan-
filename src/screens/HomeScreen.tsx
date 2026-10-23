import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { APP_IMAGES } from '../data/initialData';
import { Exercise } from '../types/fitness';
import { ExerciseVideoModal } from '../components/ExerciseVideoModal';
import {
  Play,
  Flame,
  Droplets,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Share2,
  Video,
} from 'lucide-react';

interface HomeScreenProps {
  onNavigateTab: (tab: 'workouts' | 'coach' | 'diet' | 'profile') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateTab }) => {
  const [selectedPreviewExercise, setSelectedPreviewExercise] = useState<Exercise | null>(null);
  const {
    userProfile,
    workouts,
    setActiveWorkout,
    dietPlan,
    waterCups,
    addWaterCup,
    removeWaterCup,
    workoutHistory,
    setIsShareModalOpen,
  } = useFitness();

  const todayWorkout = workouts[0] || null;

  // Calculate calories and macros consumed today from checked meals
  const completedMeals = dietPlan.meals.filter((m) => m.completed);
  const consumedCalories = completedMeals.reduce((acc, m) => acc + m.calories, 0);
  const consumedProtein = completedMeals.reduce((acc, m) => acc + m.proteinGrams, 0);
  const consumedCarbs = completedMeals.reduce((acc, m) => acc + (m.carbsGrams ?? Math.round((m.calories * 0.45) / 4)), 0);
  const consumedFats = completedMeals.reduce((acc, m) => acc + (m.fatsGrams ?? Math.round((m.calories * 0.25) / 9)), 0);

  const calPercent = Math.min(100, Math.round((consumedCalories / dietPlan.totalCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((consumedProtein / dietPlan.macros.proteinGrams) * 100));
  const carbsPercent = Math.min(100, Math.round((consumedCarbs / dietPlan.macros.carbsGrams) * 100));
  const fatsPercent = Math.min(100, Math.round((consumedFats / dietPlan.macros.fatsGrams) * 100));

  // Week days status for streak
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 fill-emerald-400" />
            <span>5-Day Active Streak</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-white mt-0.5">
            Ready to train, {userProfile.name}?
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {userProfile.goal} · Day 3 of 5 scheduled sessions
          </p>
        </div>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-850 text-emerald-400 transition-all flex items-center gap-1.5 shadow-sm min-h-[44px] shrink-0"
          title="Share weekly milestone to social media"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-xs font-bold hidden sm:inline">Share Progress</span>
        </button>
      </div>

      {/* Week Calendar Streak Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-bold text-zinc-300">Weekly Consistency</span>
          <button
            onClick={() => onNavigateTab('workouts')}
            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Monthly Calendar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div
          onClick={() => onNavigateTab('workouts')}
          className="p-3.5 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 rounded-2xl flex items-center justify-between cursor-pointer transition-colors"
        >
        {daysOfWeek.map((day, idx) => {
          const isDone = idx < todayIndex;
          const isToday = idx === todayIndex;

          return (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">{day}</span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  isToday
                    ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/20'
                    : isDone
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800/80 text-zinc-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <span>{19 + idx}</span>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Today's Workout Hero Card */}
      {todayWorkout && (
        <div className="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-xl group">
          {/* Background Image with Measured Contrast Scrim */}
          <div className="absolute inset-0">
            <img
              src={APP_IMAGES.heroWorkout}
              alt="Today Workout"
              className="w-full h-full object-cover brightness-[0.75] group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/80 to-transparent" />
          </div>

          <div className="relative p-6 space-y-4 pt-28">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold tracking-wide border border-emerald-500/30">
                <Dumbbell className="w-3.5 h-3.5" /> TODAY'S PROGRAM
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
                {todayWorkout.name}
              </h3>
              <p className="text-xs text-zinc-300 line-clamp-1">
                {todayWorkout.focus} · {todayWorkout.exercises.length} Exercises · {todayWorkout.durationMinutes} mins
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs text-zinc-300">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono tabular-nums font-semibold">{todayWorkout.estimatedCalories}</span> kcal
              </span>
              <span>·</span>
              <span className="font-medium text-emerald-400">{todayWorkout.difficulty}</span>
              <span>·</span>
              <span>{todayWorkout.exercises.length} movements</span>
            </div>

            {/* Start and AI Video Preview Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  if (todayWorkout.exercises.length > 0) {
                    setSelectedPreviewExercise(todayWorkout.exercises[0]);
                  }
                }}
                className="py-3.5 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[48px]"
                title="Watch AI generated video form demonstration"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Video Demos</span>
              </button>

              <button
                onClick={() => setActiveWorkout(todayWorkout)}
                className="sm:col-span-2 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Start Workout Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Coach Tactical Recommendation */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/60 border border-zinc-800 flex items-start gap-3.5 shadow-md">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0">
          <img
            src={APP_IMAGES.trainerAvatar}
            alt="AI Coach"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Coach Insight
            </span>
            <button
              onClick={() => onNavigateTab('coach')}
              className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center gap-0.5 transition-colors"
            >
              <span>Ask Coach</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
            "Remember to take your 90s rest periods on compound sets. Complete ATP recovery between heavy barbell efforts produces up to 35% higher muscle hypertrophy."
          </p>
        </div>
      </div>

      {/* Nutrition & Water Tracker 2-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily Macros Card */}
        <div
          onClick={() => onNavigateTab('diet')}
          className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Daily Nutrition
            </span>
            <span className="text-xs text-zinc-400 hover:text-white flex items-center">
              View Meals <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Calories Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Calories</span>
              <span className="font-mono text-white tabular-nums font-semibold">
                {consumedCalories} / {dietPlan.totalCalories} kcal
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${calPercent}%` }}
              />
            </div>
          </div>

          {/* Macro Mini Grid (P / C / F) */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-zinc-950/80 border border-emerald-500/20">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">Protein</div>
              <div className="text-xs font-mono font-bold text-white mt-0.5">{consumedProtein}g</div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-emerald-500" style={{ width: `${proteinPercent}%` }} />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-zinc-950/80 border border-amber-500/20">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Carbs</div>
              <div className="text-xs font-mono font-bold text-white mt-0.5">{consumedCarbs}g</div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-amber-400" style={{ width: `${carbsPercent}%` }} />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-zinc-950/80 border border-cyan-500/20">
              <div className="text-[10px] font-bold text-cyan-400 uppercase">Fats</div>
              <div className="text-xs font-mono font-bold text-white mt-0.5">{consumedFats}g</div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-cyan-400" style={{ width: `${fatsPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Water Intake Tracker */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-400" /> Water Intake
            </span>
            <span className="text-xs font-mono text-blue-400 tabular-nums font-bold">
              {(waterCups * 0.25).toFixed(1)} / {dietPlan.waterTargetLiters} L
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-1 flex-wrap max-w-[170px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-5 rounded-sm transition-all ${
                    i < waterCups
                      ? 'bg-blue-500 shadow-[0_0_6px_#3b82f6]'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={removeWaterCup}
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors min-h-[36px] min-w-[36px]"
                title="Subtract 1 glass"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={addWaterCup}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md transition-colors min-h-[36px] min-w-[36px]"
                title="Add 1 glass (250ml)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400">
            {waterCups >= 10 ? 'Hydration target reached! 💧' : 'Stay hydrated to prevent muscle cramps and boost strength.'}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" /> Recent Completed Workouts
          </h3>
          <button
            onClick={() => onNavigateTab('workouts')}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            All Workouts
          </button>
        </div>

        <div className="space-y-2">
          {workoutHistory.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <div className="text-[11px] text-zinc-400">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {item.durationMinutes} mins · {item.caloriesBurned} kcal
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                  {item.totalVolumeKg} kg
                </div>
                <div className="text-[10px] text-zinc-500 uppercase">Volume</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Video Modal for AI Form Demonstrations */}
      <ExerciseVideoModal
        exercise={selectedPreviewExercise}
        onClose={() => setSelectedPreviewExercise(null)}
      />
    </div>
  );
};
