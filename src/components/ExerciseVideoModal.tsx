import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Exercise, AIVideoSimulationConfig, MovementPattern } from '../types/fitness';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sliders,
  Layers,
  Activity,
  Cpu,
  RefreshCw,
  Camera,
  Compass,
  Gauge,
  Film,
  Info,
} from 'lucide-react';

interface ExerciseVideoModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

// Curated library of video demonstrations
const EXERCISE_VIDEO_SOURCES: { [name: string]: string } = {
  'Barbell Bench Press': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'Incline Dumbbell Press': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'Overhead Barbell Press (OHP)': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'Cable Lateral Raise': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'Rope Tricep Extension': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'Conventional Barbell Deadlift': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'Wide-Grip Lat Pulldown': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'Dumbbell Chest-Supported Row': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'Incline Dumbbell Bicep Curl': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'Barbell Back Squat': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'Romanian Deadlift': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'Bulgarian Split Squat': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
};

const DEFAULT_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

// Helper to determine movement pattern from exercise name
function inferMovementPattern(name: string): MovementPattern {
  const n = (name || '').toLowerCase();
  if (n.includes('incline') && n.includes('press')) return 'incline_press';
  if (n.includes('bench') || n.includes('chest press') || n.includes('push-up')) return 'bench_press';
  if (n.includes('overhead') || n.includes('ohp') || n.includes('military')) return 'overhead_press';
  if (n.includes('lateral raise') || n.includes('side raise')) return 'lateral_raise';
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('extension') || n.includes('dip')) return 'tricep_extension';
  if (n.includes('deadlift') || n.includes('rdl') || n.includes('good morning')) return 'deadlift';
  if (n.includes('lat pulldown') || n.includes('pull-up') || n.includes('chin-up')) return 'lat_pulldown';
  if (n.includes('row')) return 'row';
  if (n.includes('curl')) return 'bicep_curl';
  if (n.includes('squat') || n.includes('leg press')) return 'squat';
  if (n.includes('lunge') || n.includes('split squat')) return 'lunge';
  return 'general_compound';
}

export const ExerciseVideoModal: React.FC<ExerciseVideoModalProps> = ({ exercise, onClose }) => {
  // Navigation & mode
  const [activeTab, setActiveTab] = useState<'ai_simulation' | 'reference_video' | 'ai_studio'>('ai_simulation');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [cameraAngle, setCameraAngle] = useState<'Sagittal (Side)' | 'Coronal (Front)' | 'Isometric 3D'>('Sagittal (Side)');
  const [showMusclesHeatmap, setShowMusclesHeatmap] = useState<boolean>(true);
  const [showBarPath, setShowBarPath] = useState<boolean>(true);

  // Simulation timeline & phase
  const [timelineProgress, setTimelineProgress] = useState<number>(0); // 0 to 1
  const [repCount, setRepCount] = useState<number>(1);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // AI Studio Custom Generator Form
  const [bodyType, setBodyType] = useState<string>('Standard Proportions');
  const [stanceVariation, setStanceVariation] = useState<string>('Standard / Shoulder Width');
  const [tempoVariation, setTempoVariation] = useState<string>('Hypertrophy (3-1-1-0)');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [customSimulationConfig, setCustomSimulationConfig] = useState<AIVideoSimulationConfig | null>(null);

  // Video element ref for reference video
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Determine current active simulation data
  const movementPattern = useMemo(() => {
    if (customSimulationConfig) return customSimulationConfig.movementPattern;
    return exercise ? inferMovementPattern(exercise.name) : 'squat';
  }, [exercise, customSimulationConfig]);

  // Video sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeTab]);

  // Reset state when exercise changes
  useEffect(() => {
    setTimelineProgress(0);
    setRepCount(1);
    setCustomSimulationConfig(null);
    setIsPlaying(true);
  }, [exercise?.id]);

  // Phase calculation from timelineProgress (0 to 1)
  const currentPhaseInfo = useMemo(() => {
    // 0 -> 0.45: Eccentric (Descent/Extension)
    // 0.45 -> 0.55: Pause / Stretch
    // 0.55 -> 0.90: Concentric (Drive/Contraction)
    // 0.90 -> 1.00: Lockout / Reset
    if (timelineProgress < 0.45) {
      const p = timelineProgress / 0.45;
      return {
        name: 'Eccentric (Lengthening)',
        sub: 'Control & Tension',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        factor: p,
      };
    } else if (timelineProgress < 0.55) {
      return {
        name: 'Bottom Stretch / Turnaround',
        sub: 'Stretch Reflex Control',
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        factor: 1,
      };
    } else if (timelineProgress < 0.90) {
      const p = 1 - (timelineProgress - 0.55) / 0.35;
      return {
        name: 'Concentric (Power Drive)',
        sub: 'Peak Motor Unit Recruitment',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        factor: p,
      };
    } else {
      return {
        name: 'Top Lockout & Squeeze',
        sub: 'Full Joint Extension',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        factor: 0,
      };
    }
  }, [timelineProgress]);

  // 60 FPS Biomechanical Kinematics Simulation Animation Loop
  useEffect(() => {
    if (activeTab !== 'ai_simulation') return;

    let localProgress = timelineProgress;

    const render = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isPlaying && !isScrubbing) {
        // Base rep duration is approx 4 seconds * playback speed
        const cycleDuration = 4.0 / playbackSpeed;
        localProgress = (localProgress + dt / cycleDuration) % 1;
        setTimelineProgress(localProgress);

        // When crossing 0, increment rep count up to 10
        if (localProgress < 0.02 && Math.random() < 0.1) {
          setRepCount((prev) => (prev % 10) + 1);
        }
      }

      // Draw canvas
      drawBiomechanicalSimulation(localProgress);

      animFrameRef.current = requestAnimationFrame(render);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTab, isPlaying, isScrubbing, playbackSpeed, cameraAngle, showMusclesHeatmap, showBarPath, movementPattern]);

  // Canvas Drawer Function
  const drawBiomechanicalSimulation = (progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background with high tech cyber-biomechanical gradient
    ctx.clearRect(0, 0, width, height);
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0a0d14');
    bgGradient.addColorStop(0.5, '#07090e');
    bgGradient.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Biomechanical Coordinate Perspective Grid Floor
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    const gridSpacing = 30;
    const floorY = height * 0.82;

    // Floor lines
    for (let x = -width; x <= width * 2; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + (x - width / 2) * 0.5, height);
      ctx.stroke();
    }
    for (let y = floorY; y <= height; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Calculate motion depth factor (0 = top/lockout, 1 = bottom depth)
    let depth = 0;
    if (progress <= 0.45) {
      depth = Math.sin((progress / 0.45) * (Math.PI / 2));
    } else if (progress <= 0.55) {
      depth = 1.0;
    } else if (progress <= 0.90) {
      depth = Math.cos(((progress - 0.55) / 0.35) * (Math.PI / 2));
    } else {
      depth = 0;
    }

    const centerX = width / 2;
    const isSide = cameraAngle === 'Sagittal (Side)';
    const isFront = cameraAngle === 'Coronal (Front)';
    const isIso = cameraAngle === 'Isometric 3D';

    // Muscle Heatmap Colors
    const muscleIntensity = Math.min(1, 0.35 + depth * 0.65);
    const primaryMuscleColor = `rgba(239, 68, 68, ${0.4 + muscleIntensity * 0.55})`; // Deep Red/Coral
    const synergistColor = `rgba(245, 158, 11, ${0.35 + muscleIntensity * 0.45})`; // Amber
    const skeletonColor = '#34d399'; // Emerald joint lines
    const jointGlowColor = '#10b981'; // Cyan-emerald

    // Render by Movement Pattern
    if (movementPattern === 'squat') {
      renderSquatBiomechanics(ctx, centerX, floorY, depth, isSide, isFront, isIso, muscleIntensity, primaryMuscleColor, synergistColor, skeletonColor, jointGlowColor);
    } else if (movementPattern === 'bench_press' || movementPattern === 'incline_press') {
      renderBenchPressBiomechanics(ctx, centerX, floorY, depth, isSide, isFront, isIso, muscleIntensity, primaryMuscleColor, synergistColor, skeletonColor, jointGlowColor, movementPattern === 'incline_press');
    } else if (movementPattern === 'deadlift') {
      renderDeadliftBiomechanics(ctx, centerX, floorY, depth, isSide, isFront, isIso, muscleIntensity, primaryMuscleColor, synergistColor, skeletonColor, jointGlowColor);
    } else if (movementPattern === 'overhead_press') {
      renderOverheadPressBiomechanics(ctx, centerX, floorY, depth, isSide, isFront, isIso, muscleIntensity, primaryMuscleColor, synergistColor, skeletonColor, jointGlowColor);
    } else if (movementPattern === 'lat_pulldown') {
      renderLatPulldownBiomechanics(ctx, centerX, floorY, depth, isSide, isFront, isIso, muscleIntensity, primaryMuscleColor, synergistColor, skeletonColor, jointGlowColor);
    } else if (movementPattern === 'bicep_curl') {
      renderBicepCurlBiomechanics(ctx, centerX, floorY, depth, isSide, isFront, isIso, muscleIntensity, primaryMuscleColor, synergistColor, skeletonColor, jointGlowColor);
    } else if (movementPattern === 'lateral_raise') {
      renderLateralRaiseBiomechanics(ctx, centerX, floorY, depth, isSide, isFront, isIso, muscleIntensity, primaryMuscleColor, synergistColor, skeletonColor, jointGlowColor);
    } else {
      // General Compound / Row / Extension
      renderGeneralCompoundBiomechanics(ctx, centerX, floorY, depth, isSide, isFront, isIso, muscleIntensity, primaryMuscleColor, synergistColor, skeletonColor, jointGlowColor);
    }

    // Draw Bar Path Tracer Line (Vertical or Curve HUD)
    if (showBarPath) {
      drawBarPathOverlay(ctx, centerX, floorY, depth, isSide);
    }
  };

  // --- Biomechanical Kinematics Sub-Renderers ---

  function renderSquatBiomechanics(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    depth: number,
    isSide: boolean,
    isFront: boolean,
    isIso: boolean,
    intensity: number,
    primaryColor: string,
    synergistColor: string,
    boneColor: string,
    jointColor: string
  ) {
    const scale = 1.35;
    const hipDrop = depth * 75 * scale;
    const kneeForward = depth * 32 * scale;
    const torsoTilt = depth * 28 * scale;

    const feetY = baseY;
    const ankleY = feetY - 12;
    const kneeY = ankleY - (80 - depth * 18) * scale;
    const hipY = kneeY - (80 - hipDrop);

    const shoulderY = hipY - 75 * scale;
    const headY = shoulderY - 26 * scale;

    if (isSide) {
      const footX = cx - 20;
      const ankleX = cx - 18;
      const kneeX = cx - 18 + kneeForward;
      const hipX = cx - 18 - depth * 40 * scale;
      const shoulderX = hipX + torsoTilt + 28 * scale;
      const headX = shoulderX + 8;
      const barX = shoulderX;
      const barY = shoulderY + 4;

      // Muscle Heatmaps: Quads, Glutes
      if (showMusclesHeatmap) {
        ctx.save();
        // Quads
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse((hipX + kneeX) / 2, (hipY + kneeY) / 2, 14 * scale, 34 * scale, 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Gluteus
        ctx.fillStyle = synergistColor;
        ctx.beginPath();
        ctx.ellipse(hipX - 10, hipY - 8, 16 * scale, 20 * scale, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Skeletal Bones
      drawBone(ctx, ankleX, ankleY, kneeX, kneeY, boneColor);
      drawBone(ctx, kneeX, kneeY, hipX, hipY, boneColor);
      drawBone(ctx, hipX, hipY, shoulderX, shoulderY, boneColor);
      drawBone(ctx, shoulderX, shoulderY, headX, headY, boneColor);

      // Arms gripping bar
      const elbowX = shoulderX - 18;
      const elbowY = shoulderY + 28;
      drawBone(ctx, shoulderX, shoulderY, elbowX, elbowY, boneColor);
      drawBone(ctx, elbowX, elbowY, barX, barY, boneColor);

      // Barbell & weight plate side profile
      drawBarbellSide(ctx, barX, barY, 44 * scale);

      // Joints
      drawJoint(ctx, ankleX, ankleY, jointColor, 5);
      drawJoint(ctx, kneeX, kneeY, jointColor, 6);
      drawJoint(ctx, hipX, hipY, jointColor, 6);
      drawJoint(ctx, shoulderX, shoulderY, jointColor, 6);
      drawHead(ctx, headX, headY, 15 * scale);

      // Angle readout label
      drawAngleArc(ctx, kneeX, kneeY, 70 + Math.round((1 - depth) * 45), 'Knee: ' + Math.round(115 - (1 - depth) * 40) + '°');
    } else {
      // Front View or Isometric View
      const stanceWidth = (isIso ? 60 : 75) * scale;
      const leftFootX = cx - stanceWidth;
      const rightFootX = cx + stanceWidth;
      const midHipY = hipY;
      const midShoulderY = shoulderY;

      // Skeletal lines front
      drawBone(ctx, leftFootX, ankleY, cx - stanceWidth * 0.85 + (isIso ? 10 : 0), kneeY, boneColor);
      drawBone(ctx, rightFootX, ankleY, cx + stanceWidth * 0.85 + (isIso ? 10 : 0), kneeY, boneColor);
      drawBone(ctx, cx - stanceWidth * 0.85, kneeY, cx - 18, midHipY, boneColor);
      drawBone(ctx, cx + stanceWidth * 0.85, kneeY, cx + 18, midHipY, boneColor);
      drawBone(ctx, cx, midHipY, cx, midShoulderY, boneColor);

      // Front Barbell
      drawBarbellFront(ctx, cx, midShoulderY + 4, 180 * scale);

      // Head
      drawHead(ctx, cx, midShoulderY - 26, 16);

      // Front heatmaps
      if (showMusclesHeatmap) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse(cx - stanceWidth * 0.45, (kneeY + midHipY) / 2, 12, 30, -0.15, 0, Math.PI * 2);
        ctx.ellipse(cx + stanceWidth * 0.45, (kneeY + midHipY) / 2, 12, 30, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function renderBenchPressBiomechanics(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    depth: number,
    isSide: boolean,
    isFront: boolean,
    isIso: boolean,
    intensity: number,
    primaryColor: string,
    synergistColor: string,
    boneColor: string,
    jointColor: string,
    isIncline: boolean
  ) {
    const scale = 1.3;
    const benchY = baseY - 60;
    const barTravel = depth * 65 * scale;
    const benchAngle = isIncline ? -0.45 : 0;

    if (isSide) {
      // Bench Pad
      ctx.save();
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 100, benchY);
      ctx.lineTo(cx + 80, benchY + Math.tan(benchAngle) * 180);
      ctx.stroke();
      ctx.restore();

      // Athlete lying on bench
      const headX = cx - 65;
      const headY = benchY - 14;
      const shoulderX = cx - 35;
      const shoulderY = benchY - 14;
      const hipX = cx + 45;
      const hipY = benchY - 12;
      const footX = cx + 75;
      const footY = baseY;

      // Leg support
      drawBone(ctx, hipX, hipY, cx + 55, baseY - 35, boneColor);
      drawBone(ctx, cx + 55, baseY - 35, footX, footY, boneColor);
      drawBone(ctx, shoulderX, shoulderY, hipX, hipY, boneColor);

      // Barbell & Arms: Lockout is high, depth touches chest
      const chestTouchX = shoulderX + 22;
      const chestTouchY = shoulderY - 18;
      const lockoutX = shoulderX + 8;
      const lockoutY = shoulderY - 85 * scale;

      const barX = lockoutX + (chestTouchX - lockoutX) * depth;
      const barY = lockoutY + barTravel;

      // Elbow kinematics
      const elbowX = shoulderX + (depth * 25);
      const elbowY = shoulderY + (depth * 18);
      drawBone(ctx, shoulderX, shoulderY, elbowX, elbowY, boneColor);
      drawBone(ctx, elbowX, elbowY, barX, barY, boneColor);

      // Barbell
      drawBarbellSide(ctx, barX, barY, 40 * scale);
      drawHead(ctx, headX, headY, 14 * scale);

      // Chest muscle activation heatmap
      if (showMusclesHeatmap) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse(shoulderX + 16, shoulderY - 12, 18 * scale, 12 * scale, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Triceps
        ctx.fillStyle = synergistColor;
        ctx.beginPath();
        ctx.ellipse(elbowX - 6, elbowY - 6, 8 * scale, 16 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      drawAngleArc(ctx, elbowX, elbowY, 45, 'Elbow Tuck: 45°');
    } else {
      // Front View
      const benchWidth = 70;
      ctx.fillStyle = '#27272a';
      ctx.fillRect(cx - benchWidth / 2, benchY - 15, benchWidth, 75);

      const barY = benchY - 100 * scale + barTravel;
      drawBarbellFront(ctx, cx, barY, 190 * scale);

      // Hands and elbows flaring smoothly
      const gripSpan = 90;
      const elbowSpan = gripSpan + (1 - depth) * 25;
      drawBone(ctx, cx - gripSpan, barY, cx - elbowSpan, barY + 35, boneColor);
      drawBone(ctx, cx - elbowSpan, barY + 35, cx - 25, benchY - 10, boneColor);
      drawBone(ctx, cx + gripSpan, barY, cx + elbowSpan, barY + 35, boneColor);
      drawBone(ctx, cx + elbowSpan, barY + 35, cx + 25, benchY - 10, boneColor);

      if (showMusclesHeatmap) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse(cx - 20, benchY - 10, 16, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 20, benchY - 10, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function renderDeadliftBiomechanics(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    depth: number,
    isSide: boolean,
    isFront: boolean,
    isIso: boolean,
    intensity: number,
    primaryColor: string,
    synergistColor: string,
    boneColor: string,
    jointColor: string
  ) {
    const scale = 1.35;
    // In deadlift, depth = 1 is on floor, depth = 0 is full lockout standing!
    const liftProgress = 1 - depth;
    const barY = baseY - 28 - (liftProgress * 80 * scale);
    const hipHingeX = cx - (depth * 45 * scale);
    const hipHingeY = baseY - 130 + (depth * 40 * scale);
    const shoulderX = cx + (depth * 5 * scale);
    const shoulderY = hipHingeY - 70 * scale + (depth * 25 * scale);

    if (isSide) {
      const ankleX = cx - 5;
      const ankleY = baseY - 12;
      const kneeX = cx - 5 - (depth * 18 * scale);
      const kneeY = ankleY - 60 * scale;

      // Hamstrings / Glutes heatmap
      if (showMusclesHeatmap) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse((hipHingeX + kneeX) / 2, (hipHingeY + kneeY) / 2, 14 * scale, 32 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Erector Spinae
        ctx.fillStyle = synergistColor;
        ctx.beginPath();
        ctx.ellipse((hipHingeX + shoulderX) / 2 - 8, (hipHingeY + shoulderY) / 2, 10 * scale, 35 * scale, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Skeleton
      drawBone(ctx, ankleX, ankleY, kneeX, kneeY, boneColor);
      drawBone(ctx, kneeX, kneeY, hipHingeX, hipHingeY, boneColor);
      drawBone(ctx, hipHingeX, hipHingeY, shoulderX, shoulderY, boneColor);
      drawBone(ctx, shoulderX, shoulderY, cx + 8, barY, boneColor);

      // Barbell flush against shins
      drawBarbellSide(ctx, cx + 8, barY, 46 * scale);
      drawHead(ctx, shoulderX + 12, shoulderY - 22, 15 * scale);

      drawAngleArc(ctx, hipHingeX, hipHingeY, Math.round(80 + liftProgress * 85), 'Hip Hinge: ' + Math.round(75 + liftProgress * 95) + '°');
    } else {
      drawBarbellFront(ctx, cx, barY, 190 * scale);
      drawHead(ctx, cx, shoulderY - 25, 16);
      drawBone(ctx, cx - 25, hipHingeY, cx - 45, baseY - 10, boneColor);
      drawBone(ctx, cx + 25, hipHingeY, cx + 45, baseY - 10, boneColor);
      drawBone(ctx, cx - 45, barY, cx - 25, shoulderY, boneColor);
      drawBone(ctx, cx + 45, barY, cx + 25, shoulderY, boneColor);
    }
  }

  function renderOverheadPressBiomechanics(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    depth: number,
    isSide: boolean,
    isFront: boolean,
    isIso: boolean,
    intensity: number,
    primaryColor: string,
    synergistColor: string,
    boneColor: string,
    jointColor: string
  ) {
    const scale = 1.35;
    // depth 1 = chin level, depth 0 = locked out overhead
    const pressProgress = 1 - depth;
    const barY = baseY - 170 - (pressProgress * 75 * scale);
    const shoulderY = baseY - 150;
    const headTilt = (depth > 0.4 && depth < 0.8) ? -12 : 0; // head tilts back to clear bar

    if (isSide) {
      const hipX = cx - 10;
      const shoulderX = cx - 5;
      const headX = cx - 2 + headTilt;
      const barX = cx + (depth > 0.2 ? 14 : 0);

      // Delts / Triceps Heatmap
      if (showMusclesHeatmap) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse(shoulderX, shoulderY - 10, 14 * scale, 14 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Torso & legs
      drawBone(ctx, cx - 12, baseY - 12, cx - 10, baseY - 75, boneColor);
      drawBone(ctx, cx - 10, baseY - 75, hipX, baseY - 110, boneColor);
      drawBone(ctx, hipX, baseY - 110, shoulderX, shoulderY, boneColor);

      // Arms to bar
      const elbowX = shoulderX + (depth * 15);
      const elbowY = shoulderY + (depth * 32);
      drawBone(ctx, shoulderX, shoulderY, elbowX, elbowY, boneColor);
      drawBone(ctx, elbowX, elbowY, barX, barY, boneColor);

      drawBarbellSide(ctx, barX, barY, 38 * scale);
      drawHead(ctx, headX, shoulderY - 26, 15 * scale);
      drawAngleArc(ctx, shoulderX, shoulderY, 180, 'Vertical Vector');
    } else {
      drawBarbellFront(ctx, cx, barY, 180 * scale);
      drawHead(ctx, cx, shoulderY - 26, 16);
      drawBone(ctx, cx - 45, barY, cx - 35, shoulderY, boneColor);
      drawBone(ctx, cx + 45, barY, cx + 35, shoulderY, boneColor);
    }
  }

  function renderLatPulldownBiomechanics(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    depth: number,
    isSide: boolean,
    isFront: boolean,
    isIso: boolean,
    intensity: number,
    primaryColor: string,
    synergistColor: string,
    boneColor: string,
    jointColor: string
  ) {
    const scale = 1.3;
    // depth 1 = pulled to collarbone, depth 0 = fully stretched overhead
    const pullY = baseY - 240 + (depth * 95 * scale);
    const shoulderY = baseY - 130;

    // Cable Pulley at top
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, 40);
    ctx.lineTo(cx, pullY);
    ctx.stroke();

    if (isSide) {
      const torsoAngle = 0.2;
      const hipX = cx - 25;
      const hipY = baseY - 70;
      const shoulderX = hipX - Math.sin(torsoAngle) * 70;

      // Lats Heatmap
      if (showMusclesHeatmap) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse(shoulderX + 5, shoulderY + 20, 16 * scale, 30 * scale, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      drawBone(ctx, hipX, hipY, shoulderX, shoulderY, boneColor);
      const elbowX = shoulderX - 20 + depth * 15;
      const elbowY = shoulderY + depth * 35;
      drawBone(ctx, shoulderX, shoulderY, elbowX, elbowY, boneColor);
      drawBone(ctx, elbowX, elbowY, cx + 10, pullY, boneColor);

      drawBarbellSide(ctx, cx + 10, pullY, 32);
      drawHead(ctx, shoulderX + 10, shoulderY - 24, 15);
      drawAngleArc(ctx, shoulderX, shoulderY, 15, 'Thoracic Tilt: 15°');
    } else {
      drawBarbellFront(ctx, cx, pullY, 200 * scale);
      drawHead(ctx, cx, shoulderY - 24, 16);
      const elbowSpread = 50 + (1 - depth) * 35;
      drawBone(ctx, cx - 80, pullY, cx - elbowSpread, shoulderY + 20, boneColor);
      drawBone(ctx, cx + 80, pullY, cx + elbowSpread, shoulderY + 20, boneColor);
      drawBone(ctx, cx - elbowSpread, shoulderY + 20, cx - 20, shoulderY, boneColor);
      drawBone(ctx, cx + elbowSpread, shoulderY + 20, cx + 20, shoulderY, boneColor);
    }
  }

  function renderBicepCurlBiomechanics(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    depth: number,
    isSide: boolean,
    isFront: boolean,
    isIso: boolean,
    intensity: number,
    primaryColor: string,
    synergistColor: string,
    boneColor: string,
    jointColor: string
  ) {
    const scale = 1.35;
    // depth 1 = peak curl contraction, depth 0 = bottom extended
    const elbowY = baseY - 100;
    const shoulderY = baseY - 150;
    const curlAngle = 0.2 + depth * 2.2;
    const handX = cx + 8 + Math.sin(curlAngle) * 55 * scale;
    const handY = elbowY - Math.cos(curlAngle) * 55 * scale;

    if (showMusclesHeatmap) {
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.ellipse(cx + 8, (shoulderY + elbowY) / 2, 14 * scale, 22 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBone(ctx, cx, baseY - 12, cx, elbowY, boneColor);
    drawBone(ctx, cx, elbowY, cx, shoulderY, boneColor);
    drawBone(ctx, cx, elbowY, handX, handY, boneColor);
    drawBarbellSide(ctx, handX, handY, 26);
    drawHead(ctx, cx, shoulderY - 24, 15);
    drawAngleArc(ctx, cx, elbowY, Math.round(160 - depth * 115), 'Elbow: ' + Math.round(160 - depth * 115) + '°');
  }

  function renderLateralRaiseBiomechanics(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    depth: number,
    isSide: boolean,
    isFront: boolean,
    isIso: boolean,
    intensity: number,
    primaryColor: string,
    synergistColor: string,
    boneColor: string,
    jointColor: string
  ) {
    const scale = 1.35;
    // depth 1 = arms at parallel 90°, depth 0 = arms at sides
    const shoulderY = baseY - 145;
    const armAngle = (depth * 80 * Math.PI) / 180;
    const armLength = 70 * scale;

    const leftHandX = cx - Math.sin(armAngle) * armLength;
    const leftHandY = shoulderY + Math.cos(armAngle) * armLength;
    const rightHandX = cx + Math.sin(armAngle) * armLength;
    const rightHandY = shoulderY + Math.cos(armAngle) * armLength;

    if (showMusclesHeatmap) {
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.ellipse(cx - 30, shoulderY, 15, 12, -0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + 30, shoulderY, 15, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBone(ctx, cx, baseY - 10, cx, shoulderY, boneColor);
    drawBone(ctx, cx - 25, shoulderY, leftHandX, leftHandY, boneColor);
    drawBone(ctx, cx + 25, shoulderY, rightHandX, rightHandY, boneColor);
    drawBarbellSide(ctx, leftHandX, leftHandY, 20);
    drawBarbellSide(ctx, rightHandX, rightHandY, 20);
    drawHead(ctx, cx, shoulderY - 24, 16);
  }

  function renderGeneralCompoundBiomechanics(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    depth: number,
    isSide: boolean,
    isFront: boolean,
    isIso: boolean,
    intensity: number,
    primaryColor: string,
    synergistColor: string,
    boneColor: string,
    jointColor: string
  ) {
    // Default ergonomic movement
    const travel = depth * 60;
    const shoulderY = baseY - 140;
    drawBone(ctx, cx, baseY - 10, cx, shoulderY, boneColor);
    drawBone(ctx, cx, shoulderY, cx + 30, shoulderY + 30 - travel, boneColor);
    drawHead(ctx, cx, shoulderY - 24, 16);
    drawBarbellSide(ctx, cx + 30, shoulderY + 30 - travel, 30);
  }

  // --- Drawing Primitive Utilities ---

  function drawBone(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawJoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius = 5) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, radius = 15) {
    ctx.save();
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Visor HUD line
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius - 4, -0.4, 0.4);
    ctx.stroke();
    ctx.restore();
  }

  function drawBarbellSide(ctx: CanvasRenderingContext2D, x: number, y: number, plateDiameter = 44) {
    ctx.save();
    // Plate outer rim
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, plateDiameter / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Plate inner ring
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, plateDiameter / 4, 0, Math.PI * 2);
    ctx.stroke();

    // Center sleeve pin
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBarbellFront(ctx: CanvasRenderingContext2D, cx: number, y: number, barLength = 180) {
    ctx.save();
    // Bar shaft
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(cx - barLength / 2, y);
    ctx.lineTo(cx + barLength / 2, y);
    ctx.stroke();

    // Left and Right 450mm Olympic Plates
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    const plateWidth = 10;
    const plateHeight = 55;
    ctx.fillRect(cx - barLength / 2, y - plateHeight / 2, plateWidth, plateHeight);
    ctx.strokeRect(cx - barLength / 2, y - plateHeight / 2, plateWidth, plateHeight);
    ctx.fillRect(cx + barLength / 2 - plateWidth, y - plateHeight / 2, plateWidth, plateHeight);
    ctx.strokeRect(cx + barLength / 2 - plateWidth, y - plateHeight / 2, plateWidth, plateHeight);
    ctx.restore();
  }

  function drawAngleArc(ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, label: string) {
    ctx.save();
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillStyle = '#6ee7b7';
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 22, -0.5, 0.5);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.fillText(label, x + 26, y + 4);
    ctx.restore();
  }

  function drawBarPathOverlay(ctx: CanvasRenderingContext2D, cx: number, baseY: number, depth: number, isSide: boolean) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    const pathX = isSide ? cx - 18 : cx;
    ctx.beginPath();
    ctx.moveTo(pathX, baseY - 220);
    ctx.lineTo(pathX, baseY - 50);
    ctx.stroke();

    // Laser cursor target
    const currentY = baseY - 200 + depth * 110;
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pathX, currentY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('BAR PATH: 0.2cm DEV', pathX + 8, currentY - 4);
    ctx.restore();
  }

  // AI Generation Trigger
  const handleGenerateCustomAISimulation = async () => {
    if (!exercise) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-exercise-video-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: exercise.name,
          targetMuscle: exercise.targetMuscle,
          variation: `${stanceVariation} · ${tempoVariation}`,
          bodyType,
          customNotes: customPrompt,
        }),
      });
      const data = await res.json();
      if (data?.simulation) {
        setCustomSimulationConfig(data.simulation);
        setActiveTab('ai_simulation');
      }
    } catch (err) {
      console.error('Error generating AI video simulation:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header with AI Badge */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span>AI-Generated Biomechanical Video</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-zinc-400">60 FPS KINEMATICS</span>
              </div>
              <h3 className="text-base font-bold font-heading text-white">{exercise.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-zinc-950 border-b border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ai_simulation')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ai_simulation'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">AI Video (3D)</span>
          </button>

          <button
            onClick={() => setActiveTab('reference_video')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'reference_video'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">Coach Video</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_studio')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ai_studio'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">AI Studio Form</span>
          </button>
        </div>

        {/* TAB 1: AI BIOMECHANICAL 3D VIDEO SIMULATION */}
        {activeTab === 'ai_simulation' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Visual Canvas Display Area */}
            <div className="relative bg-zinc-950 aspect-video sm:aspect-16/10 flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={560}
                height={350}
                className="w-full h-full object-contain"
              />

              {/* Top HUD Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                  {cameraAngle}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
                  Target: <strong className="text-emerald-400">{exercise.targetMuscle}</strong>
                </span>
              </div>

              {/* Rep Count & Velocity HUD */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300 font-bold">
                  REP {repCount} / 8
                </span>
              </div>

              {/* Bottom Current Phase HUD */}
              <div className="absolute bottom-3 left-3">
                <div className={`px-2.5 py-1 rounded-lg backdrop-blur-md border text-[11px] font-mono flex items-center gap-2 ${currentPhaseInfo.badgeBg}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{currentPhaseInfo.name}</span>
                </div>
              </div>

              {/* Speed Multiplier Quick Buttons */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-zinc-700 p-1 rounded-xl">
                {[0.5, 1.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                      playbackSpeed === spd ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scrubber Timeline & Play/Pause Bar */}
            <div className="p-3 bg-zinc-950 border-b border-zinc-800 space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center shrink-0"
                  title={isPlaying ? 'Pause simulation' : 'Play simulation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-emerald-400" /> : <Play className="w-4 h-4 fill-emerald-400 ml-0.5" />}
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={timelineProgress}
                    onMouseDown={() => setIsScrubbing(true)}
                    onMouseUp={() => setIsScrubbing(false)}
                    onTouchStart={() => setIsScrubbing(true)}
                    onTouchEnd={() => setIsScrubbing(false)}
                    onChange={(e) => setTimelineProgress(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 tabular-nums shrink-0">
                    {Math.round(timelineProgress * 100)}%
                  </span>
                </div>

                <button
                  onClick={() => {
                    setTimelineProgress(0);
                    setIsPlaying(true);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Reset to start of rep"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Multi-Camera Angle Selector & HUD Layer Toggles */}
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase flex items-center gap-1">
                    <Camera className="w-3 h-3" /> Camera:
                  </span>
                  {(['Sagittal (Side)', 'Coronal (Front)', 'Isometric 3D'] as const).map((cam) => (
                    <button
                      key={cam}
                      onClick={() => setCameraAngle(cam)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        cameraAngle === cam
                          ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {cam.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMusclesHeatmap(!showMusclesHeatmap)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                      showMusclesHeatmap
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    Heatmap {showMusclesHeatmap ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setShowBarPath(!showBarPath)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                      showBarPath
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    Bar Path
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Biomechanical Form Checkpoints & AI Guidance */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {customSimulationConfig?.aiCoachingFeedback ? (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Custom Biomechanics Feedback
                  </div>
                  <p className="leading-relaxed">{customSimulationConfig.aiCoachingFeedback}</p>
                </div>
              ) : null}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Kinetic Execution Checkpoints
                </h4>
                <div className="space-y-1.5">
                  {(customSimulationConfig?.biomechanicalCheckpoints || exercise.formCues).map((cue, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/90 text-zinc-300 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{cue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {exercise.tempo && (
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                  <span className="text-zinc-400">Prescribed Tempo</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {exercise.tempo} (Eccentric · Bottom Pause · Concentric · Reset)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STANDARD COACH REFERENCE VIDEO */}
        {activeTab === 'reference_video' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="relative bg-black aspect-video sm:aspect-16/10 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                src={EXERCISE_VIDEO_SOURCES[exercise.name] || DEFAULT_VIDEO_URL}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  Reference Angle · 60 FPS
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
                  {exercise.targetMuscle}
                </span>
              </div>

              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-zinc-700 p-1 rounded-xl">
                <button
                  onClick={() => setPlaybackSpeed(0.5)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    playbackSpeed === 0.5 ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  0.5x
                </button>
                <button
                  onClick={() => setPlaybackSpeed(1)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    playbackSpeed === 1 ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  1.0x
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="text-zinc-400 leading-relaxed">
                Demonstrating optimal cadence and locked joint positions for <strong>{exercise.name}</strong>.
              </div>
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200/90 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Control the eccentric descent. Never bounce or sacrifice spinal neutrality for added load.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI VIDEO STUDIO & REGENERATION */}
        {activeTab === 'ai_studio' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-zinc-950 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>AI Video Biomechanics Studio</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Generate personalized AI video kinematics tailored to your unique anatomical levers, limb lengths, grip preferences, or tempo protocols.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Athlete Morphology / Lever Lengths
                </label>
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Standard Proportions">Standard Proportions</option>
                  <option value="Long Femurs / Short Torso (Deeper Hinge Needed)">Long Femurs / Short Torso (Squat/Deadlift bias)</option>
                  <option value="Long Wingspan / Long Arms (Wide Arc)">Long Wingspan / Long Arms (Bench/Press bias)</option>
                  <option value="Short Limbs / Compact Torso (Mechanical Leverage)">Short Limbs / Compact Torso</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Stance / Grip Variation
                </label>
                <select
                  value={stanceVariation}
                  onChange={(e) => setStanceVariation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Standard / Shoulder Width">Standard / Shoulder Width</option>
                  <option value="Wide Grip / Sumo Stance (High Adductor & Lat bias)">Wide Grip / Sumo Stance</option>
                  <option value="Close / Narrow Grip (Tricep & Quad bias)">Close / Narrow Grip</option>
                  <option value="Neutral Grip / Dumbbells (Shoulder-friendly)">Neutral Grip (Joint Friendly)</option>
                  <option value="High Bar vs Low Bar (Posterior vs Quad)">High Bar vs Low Bar Placement</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Hypertrophic Tempo Profile
                </label>
                <select
                  value={tempoVariation}
                  onChange={(e) => setTempoVariation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Hypertrophy (3-1-1-0)">3-1-1-0 (Standard Hypertrophy Tempo)</option>
                  <option value="Pause Rep (3-2-1-0)">3-2-1-0 (2s Pause in the Hole/Stretch)</option>
                  <option value="Explosive Power (1-0-X-0)">1-0-X-0 (Explosive Concentric Speed)</option>
                  <option value="Time-Under-Tension (4-1-2-1)">4-1-2-1 (Extreme Slow Eccentric Burn)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Custom AI Coaching Prompt (Optional)
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Focus on preventing lower back arch or show scapular tuck"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleGenerateCustomAISimulation}
                disabled={isGeneratingAI}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
              >
                {isGeneratingAI ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing AI Video Trajectory...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Video Simulation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400">
            {activeTab === 'ai_simulation' && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI Biomechanical Rendering Active
              </span>
            )}
            {activeTab === 'reference_video' && (
              <span className="text-zinc-400">Reference Form Video</span>
            )}
            {activeTab === 'ai_studio' && (
              <span className="text-zinc-400">Custom Biomechanics Generator</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
