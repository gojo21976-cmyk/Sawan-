import React, { useState, useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import { Exercise, SetLog } from '../types/fitness';
import { ExerciseVideoModal } from './ExerciseVideoModal';
import { VoiceQuickLogModal } from './VoiceQuickLogModal';
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Timer,
  Info,
  Dumbbell,
  Sparkles,
  Trophy,
  Video,
  Share2,
  Mic,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WorkoutPlayerModal: React.FC = () => {
  const {
    activeWorkout,
    setActiveWorkout,
    logWorkout,
    startRestTimer,
    addOrUpdatePR,
    setIsShareModalOpen,
  } = useFitness();
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [exerciseLogs, setExerciseLogs] = useState<{ [exId: string]: SetLog[] }>({});
  const [activeFormCueId, setActiveFormCueId] = useState<string | null>(null);
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<Exercise | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [workoutStats, setWorkoutStats] = useState<{ volume: number; duration: number; calories: number } | null>(null);
  const [isVoiceLogOpen, setIsVoiceLogOpen] = useState<boolean>(false);
  const [voiceLogExercise, setVoiceLogExercise] = useState<Exercise | null>(null);
  const [voiceLogSetNumber, setVoiceLogSetNumber] = useState<number>(1);

  // Initialize sets for exercises
  useEffect(() => {
    if (activeWorkout) {
      const initial: { [exId: string]: SetLog[] } = {};
      activeWorkout.exercises.forEach((ex) => {
        initial[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
          setNumber: i + 1,
          weightKg: ex.suggestedWeightKg,
          reps: parseInt(ex.reps.split('-')[0], 10) || 10,
          completed: false,
        }));
      });
      setExerciseLogs(initial);
      setSecondsElapsed(0);
      setIsPaused(false);
      setIsSummaryOpen(false);
    }
  }, [activeWorkout]);

  // Workout duration timer
  useEffect(() => {
    let timer: any = null;
    if (activeWorkout && !isPaused && !isSummaryOpen) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeWorkout, isPaused, isSummaryOpen]);

  if (!activeWorkout) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleSetComplete = (exId: string, setIndex: number, restSeconds: number) => {
    setExerciseLogs((prev) => {
      const sets = [...(prev[exId] || [])];
      const isNowCompleted = !sets[setIndex].completed;
      sets[setIndex] = {
        ...sets[setIndex],
        completed: isNowCompleted,
      };

      // If marked complete, trigger rest timer
      if (isNowCompleted) {
        startRestTimer(restSeconds || 90);
      }

      return { ...prev, [exId]: sets };
    });
  };

  const updateSetWeight = (exId: string, setIndex: number, val: number) => {
    setExerciseLogs((prev) => {
      const sets = [...(prev[exId] || [])];
      sets[setIndex] = { ...sets[setIndex], weightKg: val };
      return { ...prev, [exId]: sets };
    });
  };

  const updateSetReps = (exId: string, setIndex: number, val: number) => {
    setExerciseLogs((prev) => {
      const sets = [...(prev[exId] || [])];
      sets[setIndex] = { ...sets[setIndex], reps: val };
      return { ...prev, [exId]: sets };
    });
  };

  const openVoiceLogForExercise = (exercise?: Exercise) => {
    const targetEx = exercise || activeWorkout.exercises[0];
    setVoiceLogExercise(targetEx);

    // Determine target set number (first uncompleted set)
    const sets = exerciseLogs[targetEx.id] || [];
    const firstIncompleteIdx = sets.findIndex((s) => !s.completed);
    const targetSetNum = firstIncompleteIdx >= 0 ? firstIncompleteIdx + 1 : Math.max(1, sets.length);
    setVoiceLogSetNumber(targetSetNum);
    setIsVoiceLogOpen(true);
  };

  const handleApplyVoiceLog = (
    exId: string,
    setIndex: number,
    weightKg: number,
    reps: number,
    markCompleted: boolean
  ) => {
    const exercise = activeWorkout.exercises.find((e) => e.id === exId);
    setExerciseLogs((prev) => {
      const currentSets = prev[exId] ? [...prev[exId]] : [];
      while (currentSets.length <= setIndex) {
        currentSets.push({
          setNumber: currentSets.length + 1,
          weightKg: exercise?.suggestedWeightKg || 60,
          reps: 10,
          completed: false,
        });
      }

      currentSets[setIndex] = {
        ...currentSets[setIndex],
        weightKg,
        reps,
        completed: markCompleted ? true : currentSets[setIndex].completed,
      };

      if (markCompleted && exercise) {
        startRestTimer(exercise.restSeconds || 90);
        if (weightKg > 0) {
          addOrUpdatePR({
            exercise: exercise.name,
            weight: weightKg,
            reps: reps,
            date: new Date().toISOString().split('T')[0],
          });
        }
      }

      return {
        ...prev,
        [exId]: currentSets,
      };
    });
  };

  const handleFinishWorkout = () => {
    // Calculate volume
    let totalVolume = 0;
    let completedSetsCount = 0;
    let completedExercisesCount = 0;

    Object.entries(exerciseLogs).forEach(([exId, sets]) => {
      const ex = activeWorkout.exercises.find((e) => e.id === exId);
      let exHasCompletedSet = false;
      sets.forEach((s) => {
        if (s.completed) {
          totalVolume += s.weightKg * s.reps;
          completedSetsCount++;
          exHasCompletedSet = true;

          // Check for PR
          if (ex && s.weightKg > 0) {
            addOrUpdatePR({
              exercise: ex.name,
              weight: s.weightKg,
              reps: s.reps,
              date: new Date().toISOString().split('T')[0],
            });
          }
        }
      });
      if (exHasCompletedSet) completedExercisesCount++;
    });

    const durationMins = Math.max(1, Math.round(secondsElapsed / 60));
    const estimatedCalories = Math.round(durationMins * 7.8);

    const stats = {
      volume: totalVolume,
      duration: durationMins,
      calories: estimatedCalories,
    };

    setWorkoutStats(stats);
    setIsSummaryOpen(true);

    // Save to history
    logWorkout({
      id: `h-${Date.now()}`,
      planId: activeWorkout.id,
      name: activeWorkout.name,
      date: new Date().toISOString(),
      durationMinutes: durationMins,
      caloriesBurned: estimatedCalories,
      totalVolumeKg: totalVolume,
      completedExercises: completedExercisesCount || activeWorkout.exercises.length,
    });

    // Confetti celebration
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });
  };

  const handleClose = () => {
    setActiveWorkout(null);
    setIsSummaryOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl h-[92vh] max-h-[850px] overflow-hidden shadow-2xl flex flex-col relative">
        {/* Top Workout Status Bar */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-heading text-white truncate max-w-[180px] sm:max-w-xs">
                {activeWorkout.name}
              </h2>
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <span>{activeWorkout.focus}</span>
                <span>·</span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">
                  {formatTime(secondsElapsed)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Quit workout"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workout Content / Exercises */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-6">
          {/* Coach Tactical Tip */}
          {activeWorkout.coachTip && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-400 font-semibold">Coach Tip: </strong>
                {activeWorkout.coachTip}
              </div>
            </div>
          )}

          {/* Exercise List */}
          <div className="space-y-4">
            {activeWorkout.exercises.map((exercise, exIdx) => {
              const sets = exerciseLogs[exercise.id] || [];
              const isCueOpen = activeFormCueId === exercise.id;

              return (
                <div
                  key={exercise.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        Exercise {exIdx + 1} · {exercise.targetMuscle}
                      </div>
                      <h4 className="text-base font-bold text-white mt-0.5">{exercise.name}</h4>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Suggested: {exercise.sets} sets × {exercise.reps} reps · {exercise.suggestedWeightKg} kg
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => openVoiceLogForExercise(exercise)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-all min-h-[36px]"
                        title="Voice Quick Log set"
                      >
                        <Mic className="w-3.5 h-3.5 animate-pulse" />
                        <span>Quick Log</span>
                      </button>
                      <button
                        onClick={() => setSelectedVideoExercise(exercise)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[36px]"
                        title="Watch AI-generated biomechanical video demonstration"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-emerald-400/20" />
                        <span>AI Video</span>
                      </button>
                      <button
                        onClick={() => setActiveFormCueId(isCueOpen ? null : exercise.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors min-h-[36px]"
                      >
                        <Info className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Tips</span>
                      </button>
                    </div>
                  </div>

                  {/* Form Cues Expansion */}
                  {isCueOpen && (
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-2 text-zinc-300">
                      <div className="font-semibold text-emerald-400">Biomechanical Form Cues:</div>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        {exercise.formCues.map((cue, cIdx) => (
                          <li key={cIdx}>{cue}</li>
                        ))}
                      </ul>
                      {exercise.tempo && (
                        <div className="text-zinc-400 pt-1">
                          Tempo: <span className="font-mono text-white">{exercise.tempo}</span> (Eccentric - Pause - Concentric - Reset)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sets Table */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-zinc-500 px-2">
                      <div className="col-span-2">Set</div>
                      <div className="col-span-4">Weight (kg)</div>
                      <div className="col-span-3">Reps</div>
                      <div className="col-span-3 text-right">Done</div>
                    </div>

                    {sets.map((set, sIdx) => (
                      <div
                        key={sIdx}
                        className={`grid grid-cols-12 items-center p-2 rounded-xl transition-all ${
                          set.completed
                            ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                            : 'bg-zinc-900/80 border border-zinc-800/60 text-zinc-300'
                        }`}
                      >
                        <div className="col-span-2 font-mono font-bold text-xs">{set.setNumber}</div>
                        <div className="col-span-4 pr-2">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weightKg}
                            onChange={(e) => updateSetWeight(exercise.id, sIdx, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-semibold text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-3 pr-2">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSetReps(exercise.id, sIdx, parseInt(e.target.value, 10) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-semibold text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleSetComplete(exercise.id, sIdx, exercise.restSeconds)}
                            className={`p-1.5 rounded-lg flex items-center justify-center transition-colors min-h-[36px] min-w-[36px] ${
                              set.completed
                                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                            title={set.completed ? 'Mark incomplete' : 'Complete set'}
                          >
                            {set.completed ? (
                              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => startRestTimer(90)}
            className="px-3 sm:px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[48px] shrink-0"
          >
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className="hidden xs:inline">Rest</span> 90s
          </button>

          {/* Quick Voice Log Central CTA */}
          <button
            type="button"
            onClick={() => openVoiceLogForExercise()}
            className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/20 hover:from-emerald-500/30 hover:to-emerald-500/30 active:scale-[0.98] border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md min-h-[48px]"
            title="Log set via microphone voice command"
          >
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Quick Log</span>
          </button>

          <button
            onClick={handleFinishWorkout}
            className="px-4 sm:px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all min-h-[48px] shrink-0"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Complete</span> Finish
          </button>
        </div>

        {/* Completion Celebration Overlay */}
        {isSummaryOpen && workoutStats && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold font-heading text-white">Workout Crushed!</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Outstanding effort, champion. Your training session has been saved to your log.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Duration</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">{workoutStats.duration} min</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Volume</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{workoutStats.volume} kg</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Burned</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">{workoutStats.calories} kcal</div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Workout to Story</span>
                </button>

                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs tracking-wide transition-all min-h-[44px]"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Video Form Demo Modal */}
      <ExerciseVideoModal
        exercise={selectedVideoExercise}
        onClose={() => setSelectedVideoExercise(null)}
      />

      {/* Voice Quick Log Modal */}
      <VoiceQuickLogModal
        isOpen={isVoiceLogOpen}
        onClose={() => setIsVoiceLogOpen(false)}
        currentExercise={voiceLogExercise}
        workoutExercises={activeWorkout.exercises}
        defaultSetNumber={voiceLogSetNumber}
        initialWeight={voiceLogExercise?.suggestedWeightKg || 60}
        initialReps={voiceLogExercise ? (parseInt(voiceLogExercise.reps.split('-')[0], 10) || 10) : 10}
        onApplyLog={handleApplyVoiceLog}
      />
    </div>
  );
};
