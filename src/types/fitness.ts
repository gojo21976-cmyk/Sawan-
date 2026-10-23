export type FitnessGoal = 'Muscle Gain' | 'Fat Loss' | 'Weight Gain' | 'General Fitness';
export type FitnessExperience = 'Beginner' | 'Intermediate' | 'Advanced';
export type WorkoutLocation = 'Home' | 'Gym' | 'Both';
export type DietPreference = 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian';

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number; // in cm
  weight: number; // in kg
  targetWeight: number; // in kg
  experience: FitnessExperience;
  goal: FitnessGoal;
  location: WorkoutLocation;
  daysPerWeek: number;
  equipment: string[];
  dietPreference: DietPreference;
  allergies: string[];
  fitnessLevelScore?: number;
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string;
  suggestedWeightKg: number;
  restSeconds: number;
  tempo?: string;
  formCues: string[];
  illustrationType: 'barbell' | 'dumbbell' | 'cable' | 'bodyweight' | 'machine';
}

export interface WorkoutPlan {
  id: string;
  name: string;
  focus: string;
  durationMinutes: number;
  estimatedCalories: number;
  difficulty: FitnessExperience;
  coachTip: string;
  exercises: Exercise[];
  isCustom?: boolean;
}

export interface SetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
}

export interface CompletedWorkout {
  id: string;
  planId?: string;
  name: string;
  date: string;
  durationMinutes: number;
  caloriesBurned: number;
  totalVolumeKg: number;
  completedExercises: number;
  notes?: string;
}

export interface MealItem {
  name: string;
  quantity: string;
  protein: number;
  carbs?: number;
  fats?: number;
  calories: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  proteinGrams: number;
  carbsGrams?: number;
  fatsGrams?: number;
  items: MealItem[];
  coachTip?: string;
  completed?: boolean;
}

export interface DietPlan {
  totalCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  };
  waterTargetLiters: number;
  nutritionHighlights: string[];
  meals: Meal[];
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface PersonalRecord {
  exercise: string;
  weight: number;
  reps: number;
  date: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export type MovementPattern =
  | 'bench_press'
  | 'incline_press'
  | 'overhead_press'
  | 'lateral_raise'
  | 'tricep_extension'
  | 'deadlift'
  | 'lat_pulldown'
  | 'row'
  | 'bicep_curl'
  | 'squat'
  | 'lunge'
  | 'general_compound'
  | 'general_isolation';

export interface AIVideoSimulationConfig {
  movementPattern: MovementPattern;
  jointAngles: {
    peakFlexion: number;
    lockoutAngle: number;
    elbowFlareDeg?: number;
    spinalAngleDeg?: number;
    kneeAngleDeg?: number;
  };
  musclesActivated: Array<{
    name: string;
    percentage: number;
    role: 'agonist' | 'synergist' | 'stabilizer';
  }>;
  barPathType: 'vertical' | 'slight_j_curve' | 'arc' | 'fixed';
  phaseTimings: {
    eccentricSec: number;
    pauseSec: number;
    concentricSec: number;
    lockoutSec: number;
  };
  aiCoachingFeedback: string;
  biomechanicalCheckpoints: string[];
  riskMitigations: string[];
}

