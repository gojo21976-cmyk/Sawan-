import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  WorkoutPlan,
  DietPlan,
  WeightLog,
  PersonalRecord,
  CompletedWorkout,
  ChatMessage,
} from '../types/fitness';
import {
  DEFAULT_PROFILE,
  INITIAL_WORKOUTS,
  INITIAL_DIET_PLAN,
  INITIAL_WEIGHT_LOGS,
  INITIAL_PRS,
} from '../data/initialData';

interface FitnessContextType {
  userProfile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  workouts: WorkoutPlan[];
  activeWorkout: WorkoutPlan | null;
  setActiveWorkout: (workout: WorkoutPlan | null) => void;
  workoutHistory: CompletedWorkout[];
  logWorkout: (workout: CompletedWorkout) => void;
  dietPlan: DietPlan;
  setDietPlan: React.Dispatch<React.SetStateAction<DietPlan>>;
  toggleMealCompleted: (mealId: string) => void;
  waterCups: number;
  addWaterCup: () => void;
  removeWaterCup: () => void;
  weightLogs: WeightLog[];
  addWeightLog: (weight: number) => void;
  prs: PersonalRecord[];
  addOrUpdatePR: (pr: PersonalRecord) => void;
  isPremium: boolean;
  setIsPremium: (premium: boolean) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => Promise<void>;
  isChatLoading: boolean;
  generateAIWorkout: (focus: string, equipment?: string) => Promise<WorkoutPlan | null>;
  isGeneratingWorkout: boolean;
  generateAIDiet: () => Promise<DietPlan | null>;
  isGeneratingDiet: boolean;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isSubscriptionOpen: boolean;
  setIsSubscriptionOpen: (open: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  // Rest Timer State
  restTimerSeconds: number;
  isRestTimerActive: boolean;
  startRestTimer: (seconds: number) => void;
  cancelRestTimer: () => void;
  viewMode: 'mobile' | 'responsive';
  setViewMode: (mode: 'mobile' | 'responsive') => void;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'fitai_app_v1_';

export const FitnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or defaults
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}profile`);
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [workouts, setWorkouts] = useState<WorkoutPlan[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}workouts`);
    return saved ? JSON.parse(saved) : INITIAL_WORKOUTS;
  });

  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | null>(null);

  const [workoutHistory, setWorkoutHistory] = useState<CompletedWorkout[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}history`);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'h-10',
            name: 'Chest, Shoulders & Triceps (Push)',
            date: '2026-10-23T09:30:00.000Z',
            durationMinutes: 54,
            caloriesBurned: 430,
            totalVolumeKg: 6800,
            completedExercises: 5,
          },
          {
            id: 'h-9',
            name: 'Back, Rear Delts & Biceps (Pull)',
            date: '2026-10-22T10:15:00.000Z',
            durationMinutes: 48,
            caloriesBurned: 395,
            totalVolumeKg: 7200,
            completedExercises: 4,
          },
          {
            id: 'h-8',
            name: 'Quads, Hamstrings & Calves (Legs)',
            date: '2026-10-21T17:45:00.000Z',
            durationMinutes: 58,
            caloriesBurned: 490,
            totalVolumeKg: 8400,
            completedExercises: 4,
          },
          {
            id: 'h-7',
            name: 'Full Body Home Blast',
            date: '2026-10-20T18:00:00.000Z',
            durationMinutes: 42,
            caloriesBurned: 360,
            totalVolumeKg: 5100,
            completedExercises: 3,
          },
          {
            id: 'h-6',
            name: 'Chest & Shoulders Hypertrophy',
            date: '2026-10-19T09:00:00.000Z',
            durationMinutes: 50,
            caloriesBurned: 410,
            totalVolumeKg: 6300,
            completedExercises: 5,
          },
          {
            id: 'h-5',
            name: 'Legs Squats & Hamstrings',
            date: '2026-10-16T17:30:00.000Z',
            durationMinutes: 55,
            caloriesBurned: 460,
            totalVolumeKg: 8100,
            completedExercises: 4,
          },
          {
            id: 'h-4',
            name: 'Back & Arms Density',
            date: '2026-10-14T10:00:00.000Z',
            durationMinutes: 46,
            caloriesBurned: 380,
            totalVolumeKg: 6900,
            completedExercises: 4,
          },
          {
            id: 'h-3',
            name: 'Chest & Triceps Power',
            date: '2026-10-12T09:15:00.000Z',
            durationMinutes: 52,
            caloriesBurned: 420,
            totalVolumeKg: 6500,
            completedExercises: 5,
          },
          {
            id: 'h-2',
            name: 'Upper Body Blast',
            date: '2026-10-09T18:00:00.000Z',
            durationMinutes: 45,
            caloriesBurned: 370,
            totalVolumeKg: 5800,
            completedExercises: 4,
          },
          {
            id: 'h-1',
            name: 'Leg Hypertrophy',
            date: '2026-10-07T17:00:00.000Z',
            durationMinutes: 56,
            caloriesBurned: 470,
            totalVolumeKg: 7900,
            completedExercises: 4,
          },
          {
            id: 'h-0',
            name: 'Pull & Back Density',
            date: '2026-10-05T10:00:00.000Z',
            durationMinutes: 49,
            caloriesBurned: 400,
            totalVolumeKg: 7100,
            completedExercises: 4,
          },
        ];
  });

  const [dietPlan, setDietPlan] = useState<DietPlan>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}diet`);
    return saved ? JSON.parse(saved) : INITIAL_DIET_PLAN;
  });

  const [waterCups, setWaterCups] = useState<number>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}water`);
    return saved ? parseInt(saved, 10) : 6;
  });

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}weights`);
    return saved ? JSON.parse(saved) : INITIAL_WEIGHT_LOGS;
  });

  const [prs, setPrs] = useState<PersonalRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}prs`);
    return saved ? JSON.parse(saved) : INITIAL_PRS;
  });

  const [isPremium, setIsPremium] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}premium`);
    return saved ? JSON.parse(saved) : false;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'responsive'>('mobile');

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'c-1',
      sender: 'coach',
      text: "Hey Alex! I'm your FitAI Coach. I've tuned your program for Muscle Gain with high-intensity progressive overload and clean nutrition. What are we crushing today?",
      timestamp: 'Just now',
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState<boolean>(false);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}profile`, JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}workouts`, JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}history`, JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}diet`, JSON.stringify(dietPlan));
  }, [dietPlan]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}water`, waterCups.toString());
  }, [waterCups]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}weights`, JSON.stringify(weightLogs));
  }, [weightLogs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}prs`, JSON.stringify(prs));
  }, [prs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}premium`, JSON.stringify(isPremium));
  }, [isPremium]);

  // Rest timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isRestTimerActive && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsRestTimerActive(false);
            // Play gentle web audio beep when rest ends
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.35);
            } catch (e) {
              // ignore audio error
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRestTimerActive, restTimerSeconds]);

  const startRestTimer = (seconds: number) => {
    setRestTimerSeconds(seconds);
    setIsRestTimerActive(true);
  };

  const cancelRestTimer = () => {
    setIsRestTimerActive(false);
    setRestTimerSeconds(0);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updated }));
  };

  const logWorkout = (completed: CompletedWorkout) => {
    setWorkoutHistory((prev) => [completed, ...prev]);
  };

  const toggleMealCompleted = (mealId: string) => {
    setDietPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((m) =>
        m.id === mealId ? { ...m, completed: !m.completed } : m
      ),
    }));
  };

  const addWaterCup = () => {
    setWaterCups((prev) => Math.min(prev + 1, 20));
  };

  const removeWaterCup = () => {
    setWaterCups((prev) => Math.max(prev - 1, 0));
  };

  const addWeightLog = (weight: number) => {
    const today = new Date().toISOString().split('T')[0];
    setWeightLogs((prev) => {
      const filtered = prev.filter((w) => w.date !== today);
      return [...filtered, { date: today, weight }].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });
    setUserProfile((prev) => ({ ...prev, weight }));
  };

  const addOrUpdatePR = (pr: PersonalRecord) => {
    setPrs((prev) => {
      const filtered = prev.filter((p) => p.exercise.toLowerCase() !== pr.exercise.toLowerCase());
      return [pr, ...filtered];
    });
  };

  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          userProfile,
        }),
      });

      if (!response.ok) throw new Error('Network error');
      const data = await response.json();

      const coachMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'coach',
        text: data.reply || "Keep pushing strong! Consistency is your superpower.",
        timestamp: 'Just now',
      };

      setChatMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'coach',
        text: "I'm right here with you! To hit your goals with optimal progression, prioritize compound lifts (Bench, Squat, Row) for 3-4 sets in the 8-12 rep range, and ensure you're consuming at least 1.8g to 2.2g of protein per kg of bodyweight with high-quality sources like paneer, dal, eggs, and chicken.",
        timestamp: 'Just now',
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const generateAIWorkout = async (focus: string, equipment?: string): Promise<WorkoutPlan | null> => {
    setIsGeneratingWorkout(true);
    try {
      const response = await fetch('/api/ai/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          focusDay: focus,
          equipmentOverride: equipment,
        }),
      });

      if (!response.ok) throw new Error('Workout generation failed');
      const data = await response.json();
      if (data.workout) {
        const newPlan: WorkoutPlan = {
          ...data.workout,
          id: `plan-ai-${Date.now()}`,
          isCustom: true,
        };
        setWorkouts((prev) => [newPlan, ...prev]);
        return newPlan;
      }
      return null;
    } catch (error) {
      console.error('AI Workout Generation error:', error);
      return null;
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  const generateAIDiet = async (): Promise<DietPlan | null> => {
    setIsGeneratingDiet(true);
    try {
      const response = await fetch('/api/ai/generate-diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile }),
      });

      if (!response.ok) throw new Error('Diet generation failed');
      const data = await response.json();
      if (data.dietPlan) {
        setDietPlan(data.dietPlan);
        return data.dietPlan;
      }
      return null;
    } catch (error) {
      console.error('AI Diet Generation error:', error);
      return null;
    } finally {
      setIsGeneratingDiet(false);
    }
  };

  return (
    <FitnessContext.Provider
      value={{
        userProfile,
        updateProfile,
        workouts,
        activeWorkout,
        setActiveWorkout,
        workoutHistory,
        logWorkout,
        dietPlan,
        setDietPlan,
        toggleMealCompleted,
        waterCups,
        addWaterCup,
        removeWaterCup,
        weightLogs,
        addWeightLog,
        prs,
        addOrUpdatePR,
        isPremium,
        setIsPremium,
        chatMessages,
        sendChatMessage,
        isChatLoading,
        generateAIWorkout,
        isGeneratingWorkout,
        generateAIDiet,
        isGeneratingDiet,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isSubscriptionOpen,
        setIsSubscriptionOpen,
        isShareModalOpen,
        setIsShareModalOpen,
        restTimerSeconds,
        isRestTimerActive,
        startRestTimer,
        cancelRestTimer,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};
