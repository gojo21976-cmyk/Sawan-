import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { WorkoutPlan, Exercise } from '../types/fitness';
import { ExerciseVideoModal } from '../components/ExerciseVideoModal';
import { WorkoutCalendar } from '../components/WorkoutCalendar';
import {
  Sparkles,
  Dumbbell,
  Play,
  Clock,
  Flame,
  Info,
  History,
  X,
  Plus,
  Trophy,
  Video,
  Calendar,
} from 'lucide-react';

export const WorkoutsScreen: React.FC = () => {
  const {
    workouts,
    setActiveWorkout,
    generateAIWorkout,
    isGeneratingWorkout,
    workoutHistory,
    userProfile,
  } = useFitness();

  const [activeTab, setActiveTab] = useState<'plans' | 'calendar' | 'history'>('plans');
  const [filterSplit, setFilterSplit] = useState<string>('All');
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<WorkoutPlan | null>(null);
  const [selectedExerciseForTips, setSelectedExerciseForTips] = useState<Exercise | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [customFocusInput, setCustomFocusInput] = useState<string>('Push Hypertrophy: Upper Chest & Shoulders');
  const [customEquipment, setCustomEquipment] = useState<string>('Full Gym Equipment');

  const filteredWorkouts = workouts.filter((w) => {
    if (filterSplit === 'All') return true;
    return w.name.toLowerCase().includes(filterSplit.toLowerCase()) || w.focus.toLowerCase().includes(filterSplit.toLowerCase());
  });

  const handleCreateAIWorkout = async () => {
    const newPlan = await generateAIWorkout(customFocusInput, customEquipment);
    if (newPlan) {
      setIsAIModalOpen(false);
      setSelectedPlanDetail(newPlan);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header & AI Generate Trigger */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-heading text-white">Workouts</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Personalized training routines tailored for {userProfile.goal}
          </p>
        </div>

        <button
          onClick={() => setIsAIModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0 min-h-[40px]"
        >
          <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
          <span>Generate AI Split</span>
        </button>
      </div>

      {/* Segmented Control: Plans vs Calendar & Streaks vs History */}
      <div className="grid grid-cols-3 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('plans')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'plans'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Routines</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Logs ({workoutHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: WORKOUT PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Split Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['All', 'Push', 'Pull', 'Legs', 'Home'].map((split) => (
              <button
                key={split}
                onClick={() => setFilterSplit(split)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                  filterSplit === split
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {split}
              </button>
            ))}
          </div>

          {/* Workout Cards Grid */}
          <div className="space-y-3.5">
            {filteredWorkouts.map((plan) => (
              <div
                key={plan.id}
                className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/90 transition-all shadow-md group relative"
              >
                {plan.isCustom && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Custom
                  </span>
                )}

                <div className="space-y-2 pr-16">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    {plan.focus}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-1">
                    {plan.exercises.map((e) => e.name).join(' · ')}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 text-xs text-zinc-400 border-t border-zinc-800/80 mt-3">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {plan.durationMinutes} min
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    {plan.estimatedCalories} kcal
                  </span>
                  <span>·</span>
                  <span className="text-zinc-300 font-medium">{plan.difficulty}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3">
                  <button
                    onClick={() => {
                      if (plan.exercises.length > 0) {
                        setSelectedExerciseForTips(plan.exercises[0]);
                      }
                    }}
                    className="py-2.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1 transition-colors min-h-[44px]"
                    title="Watch AI generated video demo for movements in this routine"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="truncate">AI Videos</span>
                  </button>

                  <button
                    onClick={() => setSelectedPlanDetail(plan)}
                    className="py-2.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1 transition-colors min-h-[44px]"
                  >
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">Exercises</span>
                  </button>

                  <button
                    onClick={() => setActiveWorkout(plan)}
                    className="py-2.5 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-xs font-bold text-zinc-950 flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 transition-all min-h-[44px]"
                  >
                    <Play className="w-3.5 h-3.5 fill-zinc-950" />
                    <span className="truncate">Start</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY CALENDAR & STREAKS */}
      {activeTab === 'calendar' && (
        <WorkoutCalendar
          onStartTodayWorkout={() => {
            if (workouts.length > 0) setActiveWorkout(workouts[0]);
          }}
        />
      )}

      {/* TAB 3: WORKOUT HISTORY & VOLUME STATS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {workoutHistory.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
              <Dumbbell className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="text-sm font-semibold text-zinc-300">No completed workouts yet</div>
              <p className="text-xs text-zinc-500">Finish your first training session to see your tonnage and personal records here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workoutHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Completed Session
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">{item.name}</h4>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                        {item.totalVolumeKg} kg
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Total Volume</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {item.durationMinutes} mins
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      {item.caloriesBurned} kcal
                    </span>
                    <span>·</span>
                    <span>{item.completedExercises} Exercises logged</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: AI Custom Workout Generator */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsAIModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Generate AI Routine</h3>
                <p className="text-xs text-zinc-400">Powered by Gemini 3.8 Flash</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Workout Focus / Muscle Group
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    'Push (Chest & Triceps)',
                    'Pull (Back & Biceps)',
                    'Legs (Quads & Glutes)',
                    'Upper Body Power',
                    'Core & HIIT Burner',
                    'Arm Farm Hypertrophy',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomFocusInput(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        customFocusInput === preset
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customFocusInput}
                  onChange={(e) => setCustomFocusInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                  placeholder="Or enter custom focus (e.g. Posterior chain & Hamstrings)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Equipment Available
                </label>
                <select
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                >
                  <option value="Full Gym Equipment">Full Commercial Gym (Barbell, Cables, Machines)</option>
                  <option value="Dumbbells and Bench">Home: Dumbbells & Adjustable Bench</option>
                  <option value="Bodyweight & Resistance Bands">Calisthenics: Bodyweight & Bands Only</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateAIWorkout}
              disabled={isGeneratingWorkout}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              {isGeneratingWorkout ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Designing Custom Biomechanics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Build Program with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Workout Plan Detail */}
      {selectedPlanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  {selectedPlanDetail.focus}
                </span>
                <h3 className="text-lg font-bold font-heading text-white mt-0.5">
                  {selectedPlanDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center gap-4 text-xs text-zinc-300 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span>⏱ {selectedPlanDetail.durationMinutes} mins</span>
                <span>·</span>
                <span>🔥 {selectedPlanDetail.estimatedCalories} kcal</span>
                <span>·</span>
                <span className="text-emerald-400 font-semibold">{selectedPlanDetail.difficulty}</span>
              </div>

              {selectedPlanDetail.coachTip && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
                  <strong className="text-emerald-400">Coach Guidance: </strong>
                  {selectedPlanDetail.coachTip}
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Exercise Breakdown ({selectedPlanDetail.exercises.length} movements)
                </div>

                {selectedPlanDetail.exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">
                          {idx + 1}. {ex.name}
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          {ex.targetMuscle} · {ex.sets} sets × {ex.reps} reps
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedExerciseForTips(ex)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5 transition-colors min-h-[32px]"
                          title="Watch AI-generated video demonstration"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Video</span>
                        </button>
                        <span className="text-xs font-mono font-semibold text-zinc-400">
                          {ex.suggestedWeightKg} kg
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 space-y-0.5">
                      {ex.formCues.map((cue, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                          <span>{cue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
              <button
                onClick={() => {
                  setActiveWorkout(selectedPlanDetail);
                  setSelectedPlanDetail(null);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Start This Workout Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Exercise Form Video Demonstration */}
      <ExerciseVideoModal
        exercise={selectedExerciseForTips}
        onClose={() => setSelectedExerciseForTips(null)}
      />
    </div>
  );
};
