import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Shared Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Database for persistent cloud sync across the app session
interface UserData {
  profile: any;
  workoutHistory: any[];
  dietPlan: any;
  customWorkouts: any[];
  weightLogs: any[];
  prs: any[];
  waterIntake: { date: string; cups: number; target: number };
  activePlanId?: string;
  isPremium?: boolean;
}

const mockDatabase = new Map<string, UserData>();

// Seed default demo user
const demoUserEmail = 'athlete@fitai.app';
mockDatabase.set(demoUserEmail, {
  profile: {
    name: 'Alex Vance',
    age: 26,
    gender: 'Male',
    height: 178,
    weight: 74.5,
    targetWeight: 78,
    experience: 'Intermediate',
    goal: 'Muscle Gain',
    location: 'Gym',
    daysPerWeek: 5,
    equipment: ['Barbell', 'Dumbbells', 'Cables', 'Squat Rack', 'Pull-up Bar', 'Bench'],
    dietPreference: 'Non-Vegetarian',
    allergies: ['Peanuts'],
    fitnessLevelScore: 78,
  },
  workoutHistory: [
    {
      id: 'w-prev-1',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      name: 'Push Hypertrophy',
      durationMinutes: 52,
      caloriesBurned: 420,
      completedExercises: 5,
      totalVolumeKg: 6450,
    },
    {
      id: 'w-prev-2',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      name: 'Pull & Back Density',
      durationMinutes: 48,
      caloriesBurned: 390,
      completedExercises: 5,
      totalVolumeKg: 7120,
    },
  ],
  dietPlan: null,
  customWorkouts: [],
  weightLogs: [
    { date: '2026-10-01', weight: 73.2 },
    { date: '2026-10-08', weight: 73.8 },
    { date: '2026-10-15', weight: 74.1 },
    { date: '2026-10-22', weight: 74.5 },
  ],
  prs: [
    { exercise: 'Barbell Bench Press', weight: 95, reps: 5, date: '2026-10-12' },
    { exercise: 'Barbell Back Squat', weight: 130, reps: 4, date: '2026-10-14' },
    { exercise: 'Conventional Deadlift', weight: 160, reps: 3, date: '2026-10-19' },
    { exercise: 'Overhead Press', weight: 62.5, reps: 6, date: '2026-10-09' },
  ],
  waterIntake: {
    date: new Date().toISOString().split('T')[0],
    cups: 6,
    target: 10,
  },
  isPremium: false,
});

// Auth Routes
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let data = mockDatabase.get(email.toLowerCase().trim());
  if (!data) {
    // Auto-create or return default
    data = {
      profile: {
        name: email.split('@')[0],
        age: 25,
        gender: 'Not specified',
        height: 175,
        weight: 70,
        targetWeight: 72,
        experience: 'Beginner',
        goal: 'Muscle Gain',
        location: 'Gym',
        daysPerWeek: 4,
        equipment: ['Dumbbells', 'Bodyweight'],
        dietPreference: 'Vegetarian',
        allergies: [],
      },
      workoutHistory: [],
      dietPlan: null,
      customWorkouts: [],
      weightLogs: [{ date: new Date().toISOString().split('T')[0], weight: 70 }],
      prs: [],
      waterIntake: { date: new Date().toISOString().split('T')[0], cups: 4, target: 8 },
      isPremium: false,
    };
    mockDatabase.set(email.toLowerCase().trim(), data);
  }

  res.json({
    user: { email: email.toLowerCase().trim(), name: data.profile.name },
    data,
    token: `fitai-jwt-${Date.now()}`,
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, name, profile } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const newUserData: UserData = {
    profile: profile || {
      name: name || cleanEmail.split('@')[0],
      age: 25,
      gender: 'Male',
      height: 175,
      weight: 70,
      targetWeight: 75,
      experience: 'Intermediate',
      goal: 'Muscle Gain',
      location: 'Gym',
      daysPerWeek: 4,
      equipment: ['Barbell', 'Dumbbells', 'Bench'],
      dietPreference: 'Vegetarian',
      allergies: [],
    },
    workoutHistory: [],
    dietPlan: null,
    customWorkouts: [],
    weightLogs: [{ date: new Date().toISOString().split('T')[0], weight: profile?.weight || 70 }],
    prs: [],
    waterIntake: { date: new Date().toISOString().split('T')[0], cups: 0, target: 8 },
    isPremium: false,
  };

  mockDatabase.set(cleanEmail, newUserData);

  res.json({
    user: { email: cleanEmail, name: newUserData.profile.name },
    data: newUserData,
    token: `fitai-jwt-${Date.now()}`,
  });
});

// Sync User Data
app.get('/api/user/data', (req: Request, res: Response) => {
  const email = (req.query.email as string) || demoUserEmail;
  const data = mockDatabase.get(email.toLowerCase().trim()) || mockDatabase.get(demoUserEmail);
  res.json({ data });
});

app.post('/api/user/sync', (req: Request, res: Response) => {
  const { email, data } = req.body;
  if (!email || !data) {
    return res.status(400).json({ error: 'Email and data required' });
  }
  const cleanEmail = email.toLowerCase().trim();
  const existing = mockDatabase.get(cleanEmail) || {} as UserData;
  const updated = { ...existing, ...data };
  mockDatabase.set(cleanEmail, updated);
  res.json({ success: true, data: updated });
});

// AI Chatbot Route
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, userProfile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!aiClient) {
      return res.json({
        reply: "Coach FitAI here! I'm currently running in local offline mode. To activate live ultra-intelligent real-time Gemini reasoning, ensure GEMINI_API_KEY is configured in your project settings. In the meantime, I recommend focusing on progressive overload: increase your barbell weight by 1.25kg to 2.5kg once you hit the top of your rep bracket, and aim for 1.8g to 2.2g of protein per kg of bodyweight daily!",
        isMock: true,
      });
    }

    const systemPrompt = `You are FitAI Coach, an elite certified strength & conditioning specialist (CSCS) and sports nutritionist.
You speak directly, warmly, and motivatingly with science-backed, practical advice.
User Profile:
- Name: ${userProfile?.name || 'Athlete'}
- Age: ${userProfile?.age || '25'}
- Height: ${userProfile?.height || '175'} cm
- Current Weight: ${userProfile?.weight || '72'} kg (Goal: ${userProfile?.targetWeight || '75'} kg)
- Goal: ${userProfile?.goal || 'Muscle Gain'}
- Experience: ${userProfile?.experience || 'Intermediate'}
- Workout Location: ${userProfile?.location || 'Gym'}
- Days Per Week: ${userProfile?.daysPerWeek || 4}
- Equipment: ${Array.isArray(userProfile?.equipment) ? userProfile.equipment.join(', ') : 'Standard Gym'}
- Diet Preference: ${userProfile?.dietPreference || 'Vegetarian / High Protein'}
- Allergies / Restrictions: ${Array.isArray(userProfile?.allergies) ? userProfile.allergies.join(', ') : 'None'}

Key Instructions:
1. Provide concise, high-impact fitness and nutrition answers tailored specifically to their goal and equipment.
2. Incorporate Indian foods (e.g. roti, paneer, dal, curd/dahi, eggs, chicken, rice) when discussing nutrition if relevant.
3. Keep workout form cues vivid and biomechanically accurate (e.g. "retract scapulae", "brace core like preparing for a punch").
4. Always provide safe general fitness guidance and remind users to seek medical consultation for acute pain or injuries.
5. Format key points with clean bold markers and bullet points for effortless mobile scanning.`;

    const chatHistory = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatHistory,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Let's push your limits today! What exercise or meal can I guide you on?";
    res.json({ reply, isMock: false });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: 'Failed to generate AI response',
      details: error?.message || 'Server error',
    });
  }
});

// AI Workout Generator Route
app.post('/api/ai/generate-workout', async (req: Request, res: Response) => {
  try {
    const { userProfile, focusDay, equipmentOverride } = req.body;

    if (!aiClient) {
      return res.json({
        workout: getFallbackWorkout(focusDay || 'Push'),
        isMock: true,
      });
    }

    const prompt = `Create a custom, high-impact workout routine for an athlete with the following specifications:
- Focus: ${focusDay || 'Full Body Hypertrophy'}
- Goal: ${userProfile?.goal || 'Muscle Gain'}
- Experience: ${userProfile?.experience || 'Intermediate'}
- Location: ${userProfile?.location || 'Gym'}
- Equipment: ${equipmentOverride || (Array.isArray(userProfile?.equipment) ? userProfile.equipment.join(', ') : 'Gym Equipment')}

Respond with a strictly valid JSON object matching this schema:
{
  "name": "string (e.g. Push Hypertrophy: Chest & Triceps)",
  "focus": "string (e.g. Upper Body Push)",
  "durationMinutes": number,
  "estimatedCalories": number,
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "coachTip": "string (1-2 sentences of tactical advice)",
  "exercises": [
    {
      "id": "string",
      "name": "string",
      "targetMuscle": "string",
      "sets": number,
      "reps": "string (e.g. '8-10' or '12-15')",
      "suggestedWeightKg": number,
      "restSeconds": number,
      "tempo": "string (e.g. '3-0-1-0')",
      "formCues": ["string", "string"],
      "illustrationType": "barbell" | "dumbbell" | "cable" | "bodyweight" | "machine"
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are FitAI Coach. Generate safe, high-performance training regimens formatted strictly in JSON.',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ workout: parsed, isMock: false });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-workout:', error);
    res.json({
      workout: getFallbackWorkout('Push'),
      isMock: true,
      fallbackReason: error?.message,
    });
  }
});

// AI Diet Planner Route
app.post('/api/ai/generate-diet', async (req: Request, res: Response) => {
  try {
    const { userProfile } = req.body;

    if (!aiClient) {
      return res.json({
        dietPlan: getFallbackDietPlan(userProfile?.dietPreference || 'Vegetarian'),
        isMock: true,
      });
    }

    const prompt = `Create an authentic, practical, nutrient-dense daily meal plan designed for an Indian / global fitness lifestyle:
- User Weight: ${userProfile?.weight || 72} kg
- Goal: ${userProfile?.goal || 'Muscle Gain'}
- Preference: ${userProfile?.dietPreference || 'Vegetarian'} (include authentic foods like paneer, roti, dal, rice, curd, oats, eggs, chicken depending on preference)
- Allergies: ${Array.isArray(userProfile?.allergies) ? userProfile.allergies.join(', ') : 'None'}

Return a strictly valid JSON object with:
{
  "totalCalories": number,
  "macros": {
    "proteinGrams": number,
    "carbsGrams": number,
    "fatsGrams": number
  },
  "waterTargetLiters": number,
  "nutritionHighlights": ["string", "string", "string"],
  "meals": [
    {
      "id": "meal-1",
      "name": "Breakfast",
      "time": "8:30 AM",
      "calories": number,
      "proteinGrams": number,
      "items": [
        { "name": "string (e.g. 3 Whole Eggs Scramble or Paneer Bhurji 150g)", "quantity": "string", "protein": number, "calories": number }
      ],
      "coachTip": "string"
    },
    {
      "id": "meal-2",
      "name": "Lunch",
      "time": "1:30 PM",
      "calories": number,
      "proteinGrams": number,
      "items": [
        { "name": "string (e.g. 2 Whole Wheat Rotis + Dal Tadka + Chicken Curry/Paneer Tikka)", "quantity": "string", "protein": number, "calories": number }
      ],
      "coachTip": "string"
    },
    {
      "id": "meal-3",
      "name": "Evening Pre/Post-Workout Snack",
      "time": "5:30 PM",
      "calories": number,
      "proteinGrams": number,
      "items": [
        { "name": "string", "quantity": "string", "protein": number, "calories": number }
      ],
      "coachTip": "string"
    },
    {
      "id": "meal-4",
      "name": "Dinner",
      "time": "8:45 PM",
      "calories": number,
      "proteinGrams": number,
      "items": [
        { "name": "string", "quantity": "string", "protein": number, "calories": number }
      ],
      "coachTip": "string"
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are FitAI Coach, an elite sports dietician. Always include clear portion sizes and macro counts.',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ dietPlan: parsed, isMock: false });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-diet:', error);
    res.json({
      dietPlan: getFallbackDietPlan('Vegetarian'),
      isMock: true,
      fallbackReason: error?.message,
    });
  }
});

// AI Exercise Analysis & Form Tips
app.post('/api/ai/exercise-guidance', async (req: Request, res: Response) => {
  try {
    const { exerciseName } = req.body;
    if (!aiClient || !exerciseName) {
      return res.json({
        tips: {
          exercise: exerciseName || 'Barbell Squat',
          setup: 'Keep feet shoulder-width apart, screw feet into the floor to activate glutes.',
          execution: 'Descend under control with chest up, knees tracking over toes.',
          mistakes: ['Knees collapsing inward', 'Rounding the lower back in the hole'],
          breathing: 'Inhale and brace core into abdominal belt before descent, exhale through sticking point.',
        },
      });
    }

    const prompt = `Provide biomechanical form breakdown for ${exerciseName}.
Return valid JSON:
{
  "exercise": "${exerciseName}",
  "setup": "string",
  "execution": "string",
  "mistakes": ["string", "string"],
  "breathing": "string",
  "safetyNote": "string"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json({ tips: JSON.parse(response.text || '{}') });
  } catch (error) {
    res.json({
      tips: {
        exercise: req.body?.exerciseName || 'Exercise',
        setup: 'Position your body with joints stacked and core braced.',
        execution: 'Execute with strict tempo and full active range of motion.',
        mistakes: ['Using momentum instead of controlled muscle tension'],
        breathing: 'Brace on eccentric phase, exhale on concentric contraction.',
      },
    });
  }
});

// AI Voice Command Parser for Workout Quick Log
app.post('/api/ai/parse-voice-log', async (req: Request, res: Response) => {
  try {
    const { transcript, currentExerciseName, currentSetNumber } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript required' });
    }

    if (!aiClient) {
      return res.json({ parsed: regexParseVoiceLog(transcript, currentSetNumber), isAI: false });
    }

    const prompt = `You are a fitness voice parser. A user working out in gym spoke this voice command to log their set:
"${transcript}"
Current exercise context: ${currentExerciseName || 'Current Exercise'}
Current target set number: ${currentSetNumber || 1}

Extract the training values. Return JSON matching:
{
  "weightKg": number or null (e.g. 80, 22.5. If user says bodyweight, return 0),
  "reps": number or null (e.g. 8, 10, 12),
  "setNumber": number or null (e.g. 1, 2, 3),
  "completed": boolean (true if user completed/hit the set),
  "feedback": "short summary e.g. '80 kg for 8 reps'"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'Extract numerical fitness set metrics from spoken voice commands accurately.',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ parsed, isAI: true });
  } catch (error: any) {
    console.error('Error in /api/ai/parse-voice-log:', error);
    res.json({
      parsed: regexParseVoiceLog(req.body?.transcript, req.body?.currentSetNumber),
      isAI: false,
    });
  }
});

function regexParseVoiceLog(transcript: string = '', defaultSetNumber: number = 1) {
  const text = transcript.toLowerCase();
  let weightKg: number | null = null;
  let reps: number | null = null;
  let setNumber: number | null = defaultSetNumber;
  let completed = true;

  // Set number: e.g. "set 2", "set two", "second set"
  const setMatch = text.match(/set\s*(?:number\s*)?(\d+)/i);
  if (setMatch) {
    setNumber = parseInt(setMatch[1], 10);
  } else if (text.includes('first set') || text.includes('set one')) setNumber = 1;
  else if (text.includes('second set') || text.includes('set two')) setNumber = 2;
  else if (text.includes('third set') || text.includes('set three')) setNumber = 3;
  else if (text.includes('fourth set') || text.includes('set four')) setNumber = 4;
  else if (text.includes('fifth set') || text.includes('set five')) setNumber = 5;

  // Weight: e.g. "80 kg", "80 kilos", "80 kilograms"
  const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos|kilograms|kilo)\b/i);
  if (weightMatch) {
    weightKg = parseFloat(weightMatch[1]);
  } else if (text.includes('bodyweight') || text.includes('body weight')) {
    weightKg = 0;
  }

  // Reps: e.g. "8 reps", "8 rep", "8 repetitions"
  const repsMatch = text.match(/(\d+)\s*(?:reps|rep|repetitions|times)\b/i);
  if (repsMatch) {
    reps = parseInt(repsMatch[1], 10);
  }

  // Shorthand "80 for 10" or "80 by 10" or "80 x 10"
  if (weightKg === null || reps === null) {
    const shorthandMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:for|by|x|\*)\s*(\d+)/i);
    if (shorthandMatch) {
      if (weightKg === null) weightKg = parseFloat(shorthandMatch[1]);
      if (reps === null) reps = parseInt(shorthandMatch[2], 10);
    }
  }

  // If numbers without units: e.g. "did 10 reps at 80"
  if (weightKg === null && reps !== null) {
    const atMatch = text.match(/(?:at|with|weight)\s*(\d+(?:\.\d+)?)/i);
    if (atMatch) weightKg = parseFloat(atMatch[1]);
  }

  return {
    weightKg,
    reps,
    setNumber,
    completed,
    feedback: `${weightKg !== null ? `${weightKg}kg` : ''} ${reps !== null ? `× ${reps} reps` : ''}`.trim() || 'Logged via voice',
  };
}

// AI Exercise Video Biomechanical Simulation Generator
app.post('/api/ai/generate-exercise-video-simulation', async (req: Request, res: Response) => {
  try {
    const { exerciseName, targetMuscle, variation, bodyType, customNotes } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ error: 'Exercise name is required' });
    }

    if (!aiClient) {
      const fallback = getFallbackExerciseSimulation(exerciseName, targetMuscle, variation);
      return res.json({ simulation: fallback, isAI: false });
    }

    const systemPrompt = `You are an elite Biomechanical Analysis AI and Olympic strength coach.
Generate precise 3D kinematic trajectory coordinates, joint angles, muscle recruitment ratios, and real-time coaching checkpoints for an AI-generated exercise demonstration video simulation.

Exercise: ${exerciseName}
Target Muscle: ${targetMuscle || 'General'}
User Lever/Morphology: ${bodyType || 'Standard proportions'}
Variation / Request: ${variation || 'Standard competition execution'}
Notes: ${customNotes || 'None'}

Return a strict JSON object with:
- movementPattern: one of ['bench_press', 'incline_press', 'overhead_press', 'lateral_raise', 'tricep_extension', 'deadlift', 'lat_pulldown', 'row', 'bicep_curl', 'squat', 'lunge', 'general_compound', 'general_isolation']
- jointAngles: { peakFlexion: number (degrees), lockoutAngle: number (degrees), elbowFlareDeg: number (0-90), spinalAngleDeg: number (0 = vertical, 90 = horizontal), kneeAngleDeg: number (degrees at bottom) }
- musclesActivated: array of 3-5 items { name: string, percentage: number (0-100), role: 'agonist' | 'synergist' | 'stabilizer' }
- barPathType: 'vertical' | 'slight_j_curve' | 'arc' | 'fixed'
- phaseTimings: { eccentricSec: number (e.g. 2.5), pauseSec: number (e.g. 0.5), concentricSec: number (e.g. 1.2), lockoutSec: number (e.g. 0.8) }
- aiCoachingFeedback: 2-3 sentence coaching explanation of how the user's morphology or variation changes the bar path and joint loading.
- biomechanicalCheckpoints: 3-4 specific kinetic checkpoints (e.g. "Maintain 15° forward torso tilt at deepest depth", "Drive knees out in line with 2nd toe").
- riskMitigations: 2 key injury risk points to monitor.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate biomechanical simulation data for exercise: "${exerciseName}" with variation "${variation || 'Standard'}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ simulation: parsed, isAI: true });
  } catch (error: any) {
    console.error('Error generating exercise video simulation:', error);
    const fallback = getFallbackExerciseSimulation(req.body?.exerciseName || 'Exercise', req.body?.targetMuscle, req.body?.variation);
    res.json({ simulation: fallback, isAI: false });
  }
});

function getFallbackExerciseSimulation(name: string, muscle?: string, variation?: string) {
  const lower = (name || '').toLowerCase();
  
  if (lower.includes('bench') || lower.includes('chest press')) {
    return {
      movementPattern: 'bench_press',
      jointAngles: { peakFlexion: 90, lockoutAngle: 180, elbowFlareDeg: 45, spinalAngleDeg: 10, kneeAngleDeg: 90 },
      musclesActivated: [
        { name: 'Pectoralis Major (Mid/Lower)', percentage: 95, role: 'agonist' },
        { name: 'Anterior Deltoids', percentage: 78, role: 'synergist' },
        { name: 'Triceps Brachii', percentage: 72, role: 'synergist' },
        { name: 'Latissimus Dorsi (Scapular Base)', percentage: 55, role: 'stabilizer' },
      ],
      barPathType: 'slight_j_curve',
      phaseTimings: { eccentricSec: 2.5, pauseSec: 0.5, concentricSec: 1.2, lockoutSec: 0.8 },
      aiCoachingFeedback: 'The AI simulation demonstrates optimal 45° elbow tuck and scapular retraction, producing a natural slight J-curve path touching the lower sternum and locking out vertically over the shoulder joints.',
      biomechanicalCheckpoints: [
        'Retract and depress scapulae into the bench padding before unrack',
        'Elbows tucked at ~45° to safeguard the subacromial space',
        'Drive through heels without allowing the glutes to lift off the bench',
        'Accelerate bar smoothly upward and slightly backward towards eye-line',
      ],
      riskMitigations: [
        'Avoid flaring elbows perpendicular (90°) to protect the anterior rotator cuff',
        'Do not bounce the barbell off the sternum; control the eccentric turnaround',
      ],
    };
  }

  if (lower.includes('squat')) {
    return {
      movementPattern: 'squat',
      jointAngles: { peakFlexion: 120, lockoutAngle: 180, elbowFlareDeg: 30, spinalAngleDeg: 35, kneeAngleDeg: 115 },
      musclesActivated: [
        { name: 'Quadriceps (Vastus Medialis/Lateralis)', percentage: 96, role: 'agonist' },
        { name: 'Gluteus Maximus', percentage: 92, role: 'agonist' },
        { name: 'Adductor Magnus', percentage: 70, role: 'synergist' },
        { name: 'Erector Spinae & Core', percentage: 85, role: 'stabilizer' },
      ],
      barPathType: 'vertical',
      phaseTimings: { eccentricSec: 3.0, pauseSec: 0.3, concentricSec: 1.5, lockoutSec: 0.8 },
      aiCoachingFeedback: 'The AI kinematic model illustrates a pure vertical bar path aligned over mid-foot throughout the entire 115° knee flexion depth, maintaining a neutral lumbar spine under high intra-abdominal bracing.',
      biomechanicalCheckpoints: [
        'Brace 360° intra-abdominal pressure into the weight belt before descent',
        'Break at hips and knees simultaneously; track patellas over 2nd & 3rd toes',
        'Reach crease of hip below parallel while keeping chest proud',
        'Drive floor away symmetrically through tripod foot distribution',
      ],
      riskMitigations: [
        'Prevent dynamic knee valgus (knees caving inward) during concentric turnaround',
        'Avoid excessive forward spine pitching; adjust stance width if ankle dorsiflexion is limited',
      ],
    };
  }

  if (lower.includes('deadlift')) {
    return {
      movementPattern: 'deadlift',
      jointAngles: { peakFlexion: 110, lockoutAngle: 180, elbowFlareDeg: 0, spinalAngleDeg: 55, kneeAngleDeg: 80 },
      musclesActivated: [
        { name: 'Gluteus Maximus & Hamstrings', percentage: 97, role: 'agonist' },
        { name: 'Erector Spinae & Spinal Stabilizers', percentage: 94, role: 'agonist' },
        { name: 'Latissimus Dorsi & Upper Traps', percentage: 82, role: 'synergist' },
        { name: 'Quadriceps (Off-the-floor drive)', percentage: 65, role: 'synergist' },
      ],
      barPathType: 'vertical',
      phaseTimings: { eccentricSec: 2.0, pauseSec: 0.5, concentricSec: 1.2, lockoutSec: 1.0 },
      aiCoachingFeedback: 'Notice the vertical bar path staying flush against the shins. The hips and shoulders rise at the identical rate until the bar clears knee level, followed by an explosive hip hinge extension.',
      biomechanicalCheckpoints: [
        'Pull all mechanical slack out of the barbell until plates click',
        'Engage lats by picturing squeezing an orange in each armpit',
        'Push the floor away like a leg press until knees clear the bar',
        'Lock out by squeezing glutes forward into the bar; do not hyperextend lumbar',
      ],
      riskMitigations: [
        'Never allow lumbar flexion under maximal load',
        'Do not hitch the bar up the thighs or yank the bar off the floor with slack',
      ],
    };
  }

  if (lower.includes('overhead') || lower.includes('press') || lower.includes('ohp')) {
    return {
      movementPattern: 'overhead_press',
      jointAngles: { peakFlexion: 80, lockoutAngle: 180, elbowFlareDeg: 35, spinalAngleDeg: 5, kneeAngleDeg: 180 },
      musclesActivated: [
        { name: 'Anterior & Lateral Deltoids', percentage: 94, role: 'agonist' },
        { name: 'Triceps Brachii', percentage: 84, role: 'synergist' },
        { name: 'Upper Trapezius & Serratus', percentage: 76, role: 'synergist' },
        { name: 'Core & Glutes (Anti-extension)', percentage: 80, role: 'stabilizer' },
      ],
      barPathType: 'slight_j_curve',
      phaseTimings: { eccentricSec: 2.5, pauseSec: 0.3, concentricSec: 1.2, lockoutSec: 0.8 },
      aiCoachingFeedback: 'The head subtly tilts back to allow the barbell to clear the chin in a straight vertical vector, then moves forward through the "window" created by the arms at top lockout.',
      biomechanicalCheckpoints: [
        'Squeeze glutes and quads rock solid to prevent lumbar arching',
        'Forearms remain perpendicular to the floor directly under the bar',
        'Push your head through the arms at the apex to lock out over scapular base',
        'Shrug slightly at top to engage serratus anterior and create subacromial clearance',
      ],
      riskMitigations: [
        'Avoid leaning backward significantly to turn the press into an incline bench',
        'Keep wrists straight with knuckles facing upward',
      ],
    };
  }

  if (lower.includes('lat') || lower.includes('pulldown') || lower.includes('pull-up')) {
    return {
      movementPattern: 'lat_pulldown',
      jointAngles: { peakFlexion: 75, lockoutAngle: 175, elbowFlareDeg: 60, spinalAngleDeg: 12, kneeAngleDeg: 90 },
      musclesActivated: [
        { name: 'Latissimus Dorsi', percentage: 96, role: 'agonist' },
        { name: 'Teres Major & Minor', percentage: 85, role: 'synergist' },
        { name: 'Biceps Brachii & Brachialis', percentage: 70, role: 'synergist' },
        { name: 'Lower Trapezius & Rhomboids', percentage: 75, role: 'synergist' },
      ],
      barPathType: 'vertical',
      phaseTimings: { eccentricSec: 3.0, pauseSec: 0.8, concentricSec: 1.2, lockoutSec: 0.5 },
      aiCoachingFeedback: 'AI biomechanics highlight driving the elbows down and back into your back pockets rather than yanking with forearm flexors, ensuring peak Latissimus Dorsi recruitment.',
      biomechanicalCheckpoints: [
        'Depress shoulders before initiating arm bend',
        'Drive elbows straight down towards the waistline',
        'Pull bar down to upper sternum while maintaining slight 10-15° thoracic extension',
        'Allow full controlled stretch on the eccentric without losing shoulder control',
      ],
      riskMitigations: [
        'Do not rock backwards aggressively using torso momentum',
        'Never pull behind the neck to protect the cervical spine and rotator cuff',
      ],
    };
  }

  if (lower.includes('row')) {
    return {
      movementPattern: 'row',
      jointAngles: { peakFlexion: 80, lockoutAngle: 170, elbowFlareDeg: 45, spinalAngleDeg: 45, kneeAngleDeg: 140 },
      musclesActivated: [
        { name: 'Rhomboids & Middle Trapezius', percentage: 95, role: 'agonist' },
        { name: 'Latissimus Dorsi', percentage: 88, role: 'synergist' },
        { name: 'Rear Deltoids', percentage: 80, role: 'synergist' },
        { name: 'Biceps & Brachioradialis', percentage: 68, role: 'synergist' },
      ],
      barPathType: 'arc',
      phaseTimings: { eccentricSec: 2.2, pauseSec: 0.8, concentricSec: 1.0, lockoutSec: 0.5 },
      aiCoachingFeedback: 'The AI simulation traces an inward arc towards the hip crease, maximizing scapular retraction and lat contraction without overloading the lumbar spine.',
      biomechanicalCheckpoints: [
        'Maintain fixed hinge angle with locked core',
        'Pull elbows past the ribcage and squeeze shoulder blades together',
        'Pause at peak contraction for 1 second of static hypertrophy hold',
      ],
      riskMitigations: [
        'Avoid shrugging shoulders up towards the ears during the pull',
        'Do not jerk the weights using lower back extension',
      ],
    };
  }

  if (lower.includes('lateral raise')) {
    return {
      movementPattern: 'lateral_raise',
      jointAngles: { peakFlexion: 15, lockoutAngle: 90, elbowFlareDeg: 75, spinalAngleDeg: 5, kneeAngleDeg: 175 },
      musclesActivated: [
        { name: 'Lateral Deltoids', percentage: 98, role: 'agonist' },
        { name: 'Anterior Deltoids & Supraspinatus', percentage: 65, role: 'synergist' },
        { name: 'Upper Trapezius', percentage: 40, role: 'stabilizer' },
      ],
      barPathType: 'arc',
      phaseTimings: { eccentricSec: 2.5, pauseSec: 0.5, concentricSec: 1.0, lockoutSec: 0.5 },
      aiCoachingFeedback: 'The arms travel in the "scapular plane" ~15° in front of the coronal plane, leading with the elbows to isolate the lateral deltoid heads completely.',
      biomechanicalCheckpoints: [
        'Maintain a soft 15° bend at the elbows throughout',
        'Lead the movement with the elbows, not the wrists or hands',
        'Stop at parallel (shoulder height) to prevent unwanted upper trap takeover',
      ],
      riskMitigations: [
        'Avoid swinging the torso or bouncing at the knees',
        'Do not internally rotate thumbs downward at top (pour the pitcher) as this impinges the shoulder',
      ],
    };
  }

  if (lower.includes('curl')) {
    return {
      movementPattern: 'bicep_curl',
      jointAngles: { peakFlexion: 40, lockoutAngle: 170, elbowFlareDeg: 15, spinalAngleDeg: 0, kneeAngleDeg: 180 },
      musclesActivated: [
        { name: 'Biceps Brachii (Short & Long Head)', percentage: 97, role: 'agonist' },
        { name: 'Brachialis & Brachioradialis', percentage: 82, role: 'synergist' },
        { name: 'Wrist Flexors', percentage: 50, role: 'stabilizer' },
      ],
      barPathType: 'arc',
      phaseTimings: { eccentricSec: 2.5, pauseSec: 0.5, concentricSec: 1.0, lockoutSec: 0.4 },
      aiCoachingFeedback: 'Elbows remain locked into the ribcage while the forearms supinate smoothly towards the ceiling, generating intense peak tension on the bicep belly.',
      biomechanicalCheckpoints: [
        'Keep elbows pinned directly under the shoulders',
        'Supinate palms fully (turn pinkies up) as elbows reach 90°',
        'Lower with a strict 2.5-second eccentric to maximize micro-tear stimulus',
      ],
      riskMitigations: [
        'Avoid leaning back or swinging hips to kickstart the curl',
        'Do not let elbows drift forward more than 2 inches during the lift',
      ],
    };
  }

  // Default compound / isolation model
  return {
    movementPattern: 'general_compound',
    jointAngles: { peakFlexion: 90, lockoutAngle: 175, elbowFlareDeg: 45, spinalAngleDeg: 15, kneeAngleDeg: 90 },
    musclesActivated: [
      { name: muscle || 'Primary Target Muscle', percentage: 95, role: 'agonist' },
      { name: 'Secondary Synergist', percentage: 70, role: 'synergist' },
      { name: 'Core Stabilizer', percentage: 60, role: 'stabilizer' },
    ],
    barPathType: 'vertical',
    phaseTimings: { eccentricSec: 2.5, pauseSec: 0.5, concentricSec: 1.2, lockoutSec: 0.6 },
    aiCoachingFeedback: `AI kinetic model tracks optimal mechanical path for ${name}, targeting ${muscle || 'the primary motor units'} with continuous tension throughout the full range of motion.`,
    biomechanicalCheckpoints: [
      'Maintain stable core bracing throughout all repetitions',
      'Control the eccentric lowering phase to maximize hypertrophic stimulus',
      'Lock out with controlled contraction without joint hyperextension',
    ],
    riskMitigations: [
      'Avoid ballistic sudden stops at joint endpoints',
      'Maintain neutral joint alignment at all times',
    ],
  };
}


// Helper Fallbacks
function getFallbackWorkout(focus: string) {
  return {
    name: `${focus} Hypertrophy & Power`,
    focus: focus,
    durationMinutes: 50,
    estimatedCalories: 410,
    difficulty: 'Intermediate',
    coachTip: 'Focus on 3-second eccentric descents on compound movements for maximum mechanical tension.',
    exercises: [
      {
        id: 'ex-1',
        name: focus.toLowerCase().includes('pull') ? 'Barbell Bent-Over Row' : 'Barbell Bench Press',
        targetMuscle: focus.toLowerCase().includes('pull') ? 'Lats & Rhomboids' : 'Chest & Anterior Deltoid',
        sets: 4,
        reps: '8-10',
        suggestedWeightKg: 65,
        restSeconds: 90,
        tempo: '3-0-1-0',
        formCues: ['Retract shoulder blades fully', 'Drive through elbows with controlled descent'],
        illustrationType: 'barbell',
      },
      {
        id: 'ex-2',
        name: focus.toLowerCase().includes('pull') ? 'Lat Pulldowns' : 'Incline Dumbbell Press',
        targetMuscle: focus.toLowerCase().includes('pull') ? 'Upper Lats' : 'Upper Pectorals',
        sets: 3,
        reps: '10-12',
        suggestedWeightKg: 24,
        restSeconds: 75,
        tempo: '2-1-1-0',
        formCues: ['30-degree bench angle', 'Full stretch at bottom without shoulder flare'],
        illustrationType: 'dumbbell',
      },
      {
        id: 'ex-3',
        name: focus.toLowerCase().includes('pull') ? 'Seated Cable Row' : 'Cable Chest Flyes',
        targetMuscle: focus.toLowerCase().includes('pull') ? 'Mid Back' : 'Sternal Pectoralis',
        sets: 3,
        reps: '12-15',
        suggestedWeightKg: 18,
        restSeconds: 60,
        tempo: '2-1-2-0',
        formCues: ['Keep slight bend in elbows', 'Squeeze at peak contraction for 1 full second'],
        illustrationType: 'cable',
      },
      {
        id: 'ex-4',
        name: focus.toLowerCase().includes('pull') ? 'Incline Dumbbell Bicep Curls' : 'Overhead Tricep Rope Extension',
        targetMuscle: focus.toLowerCase().includes('pull') ? 'Biceps Brachii' : 'Triceps Long Head',
        sets: 3,
        reps: '12-15',
        suggestedWeightKg: 14,
        restSeconds: 60,
        tempo: '2-0-1-1',
        formCues: ['Pin elbows in place', 'Lock out triceps with wrist flare'],
        illustrationType: 'cable',
      },
    ],
  };
}

function getFallbackDietPlan(preference: string) {
  const isVeg = preference.toLowerCase().includes('veg') && !preference.toLowerCase().includes('non');
  return {
    totalCalories: isVeg ? 2450 : 2550,
    macros: {
      proteinGrams: isVeg ? 145 : 170,
      carbsGrams: 280,
      fatsGrams: 65,
    },
    waterTargetLiters: 3.5,
    nutritionHighlights: [
      'High leucine threshold per meal for maximum MPS (Muscle Protein Synthesis)',
      'Rich in complex carbohydrates from whole grains & pulses',
      'Balanced healthy fats supporting natural hormone production',
    ],
    meals: [
      {
        id: 'm-1',
        name: 'Power Breakfast',
        time: '8:30 AM',
        calories: 580,
        proteinGrams: 36,
        items: isVeg
          ? [
              { name: 'Oats with Almond Milk & Chia Seeds', quantity: '70g dry oats', protein: 12, calories: 310 },
              { name: 'Low-Fat Paneer Bhurji / Soy Milk', quantity: '120g paneer', protein: 22, calories: 230 },
              { name: 'Banana & Mixed Berries', quantity: '1 medium', protein: 2, calories: 105 },
            ]
          : [
              { name: 'Whole Eggs & Egg Whites Scramble', quantity: '3 whole + 2 whites', protein: 28, calories: 310 },
              { name: 'Whole Wheat Toast with Peanut Butter', quantity: '2 slices', protein: 10, calories: 240 },
              { name: 'Fresh Orange or Kiwi', quantity: '1 fruit', protein: 1, calories: 70 },
            ],
        coachTip: 'Have 500ml water immediately on waking up before your breakfast.',
      },
      {
        id: 'm-2',
        name: 'Anabolic Lunch',
        time: '1:30 PM',
        calories: 720,
        proteinGrams: isVeg ? 45 : 55,
        items: isVeg
          ? [
              { name: 'Tandoori Spiced Paneer Tikka', quantity: '160g', protein: 30, calories: 340 },
              { name: 'Yellow Moong Dal / Rajma Tadka', quantity: '1 large bowl', protein: 12, calories: 190 },
              { name: 'Brown Rice or 2 Multi-grain Rotis', quantity: '1.5 cups / 2 rotis', protein: 7, calories: 220 },
              { name: 'Cucumber & Tomato Kachumber Salad', quantity: '1 bowl', protein: 2, calories: 45 },
            ]
          : [
              { name: 'Grilled Herb Chicken Breast', quantity: '180g', protein: 42, calories: 290 },
              { name: 'Dal Tadka / Black Lentils', quantity: '1 bowl', protein: 10, calories: 160 },
              { name: 'Steamed Basmati Rice & 1 Roti', quantity: '1 cup rice', protein: 6, calories: 240 },
              { name: 'Greek Curd / Dahi', quantity: '100g', protein: 6, calories: 65 },
            ],
        coachTip: 'Chew slowly and pair with digestive mint or green salad for gut microbiome health.',
      },
      {
        id: 'm-3',
        name: 'Pre-Workout Ignition Snack',
        time: '5:15 PM',
        calories: 380,
        proteinGrams: 28,
        items: [
          { name: 'Greek Yogurt / Thick Curd with Honey & Almonds', quantity: '200g curd', protein: 18, calories: 195 },
          { name: 'Roasted Chana / Boiled Sprouts Chaat', quantity: '50g', protein: 10, calories: 160 },
          { name: 'Black Coffee or Green Tea', quantity: '1 cup', protein: 0, calories: 5 },
        ],
        coachTip: 'Consume this snack 60–75 minutes prior to training for sustained glycogen release.',
      },
      {
        id: 'm-4',
        name: 'Recovery Dinner',
        time: '8:45 PM',
        calories: 650,
        proteinGrams: isVeg ? 38 : 48,
        items: isVeg
          ? [
              { name: 'Palak Paneer with Tofu blend', quantity: '150g', protein: 25, calories: 280 },
              { name: '3 Bajra / Whole Wheat Rotis', quantity: '3 rotis', protein: 9, calories: 260 },
              { name: 'Steamed Mixed Vegetables (Broccoli, Carrots, Beans)', quantity: '1 plate', protein: 4, calories: 85 },
            ]
          : [
              { name: 'Tandoori Fish / Chicken Tikka Curry', quantity: '160g', protein: 36, calories: 250 },
              { name: '2 Whole Wheat Phulkas + 1/2 cup Rice', quantity: '2 rotis', protein: 7, calories: 240 },
              { name: 'Fresh Green Salad with Lemon Dressing', quantity: '1 bowl', protein: 2, calories: 45 },
            ],
        coachTip: 'Keep dinner at least 2 hours before bed for optimal deep sleep and growth hormone release.',
      },
    ],
  };
}

// Vite middleware mounting in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitAI Coach server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
