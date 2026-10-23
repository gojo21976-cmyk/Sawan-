import React, { useState, useEffect, useRef } from 'react';
import { Exercise } from '../types/fitness';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Check,
  Dumbbell,
  Timer,
  Volume2,
  AlertCircle,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';

interface VoiceQuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExercise: Exercise | null;
  workoutExercises: Exercise[];
  defaultSetNumber?: number;
  initialWeight?: number;
  initialReps?: number;
  onApplyLog: (
    exerciseId: string,
    setIndex: number,
    weightKg: number,
    reps: number,
    markCompleted: boolean
  ) => void;
}

export const VoiceQuickLogModal: React.FC<VoiceQuickLogModalProps> = ({
  isOpen,
  onClose,
  currentExercise,
  workoutExercises,
  defaultSetNumber = 1,
  initialWeight = 60,
  initialReps = 10,
  onApplyLog,
}) => {
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [targetSet, setTargetSet] = useState<number>(defaultSetNumber);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [parsedWeight, setParsedWeight] = useState<number>(initialWeight);
  const [parsedReps, setParsedReps] = useState<number>(initialReps);
  const [markCompleted, setMarkCompleted] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isParsingAI, setIsParsingAI] = useState<boolean>(false);
  const [parseConfidence, setParseConfidence] = useState<string>('Ready');

  const recognitionRef = useRef<any>(null);

  // Sync with prop changes when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeId = currentExercise ? currentExercise.id : (workoutExercises[0]?.id || '');
      setSelectedExId(activeId);
      setTargetSet(defaultSetNumber);
      setParsedWeight(initialWeight || 60);
      setParsedReps(initialReps || 10);
      setTranscript('');
      setSpeechError(null);
      setParseConfidence('Ready');

      // Auto start listening if supported
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen, currentExercise, defaultSetNumber, initialWeight, initialReps]);

  const activeExerciseObj = workoutExercises.find((e) => e.id === selectedExId) || currentExercise || workoutExercises[0];

  // Client-side regex parser for instant real-time feedback
  const parseLocally = (text: string) => {
    const lower = text.toLowerCase();
    let weight: number | null = null;
    let reps: number | null = null;
    let setNum: number | null = null;

    // Set detection
    const setMatch = lower.match(/set\s*(?:number\s*)?(\d+)/i);
    if (setMatch) setNum = parseInt(setMatch[1], 10);
    else if (lower.includes('first set') || lower.includes('set one')) setNum = 1;
    else if (lower.includes('second set') || lower.includes('set two')) setNum = 2;
    else if (lower.includes('third set') || lower.includes('set three')) setNum = 3;
    else if (lower.includes('fourth set') || lower.includes('set four')) setNum = 4;

    // Weight detection
    const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos|kilograms|kilo)\b/i);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]);
    } else if (lower.includes('bodyweight') || lower.includes('body weight')) {
      weight = 0;
    }

    // Reps detection
    const repsMatch = lower.match(/(\d+)\s*(?:reps|rep|repetitions|times)\b/i);
    if (repsMatch) {
      reps = parseInt(repsMatch[1], 10);
    }

    // Shorthand "80 for 10" or "80 by 10" or "80 x 10"
    if (weight === null || reps === null) {
      const shorthandMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:for|by|x|\*)\s*(\d+)/i);
      if (shorthandMatch) {
        if (weight === null) weight = parseFloat(shorthandMatch[1]);
        if (reps === null) reps = parseInt(shorthandMatch[2], 10);
      }
    }

    if (weight !== null) setParsedWeight(weight);
    if (reps !== null) setParsedReps(reps);
    if (setNum !== null) setTargetSet(setNum);

    if (weight !== null || reps !== null) {
      setParseConfidence('Recognized');
    }
  };

  // AI-powered refinement from backend
  const refineWithAI = async (spokenText: string) => {
    if (!spokenText.trim()) return;
    setIsParsingAI(true);
    try {
      const res = await fetch('/api/ai/parse-voice-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: spokenText,
          currentExerciseName: activeExerciseObj?.name || 'Workout Exercise',
          currentSetNumber: targetSet,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.parsed) {
          if (typeof data.parsed.weightKg === 'number') {
            setParsedWeight(data.parsed.weightKg);
          }
          if (typeof data.parsed.reps === 'number') {
            setParsedReps(data.parsed.reps);
          }
          if (typeof data.parsed.setNumber === 'number' && data.parsed.setNumber > 0) {
            setTargetSet(data.parsed.setNumber);
          }
          setParseConfidence(data.isAI ? 'AI Verified' : 'Parsed');
        }
      }
    } catch (e) {
      console.warn('AI Voice Parse fallback to local:', e);
    } finally {
      setIsParsingAI(false);
    }
  };

  const startListening = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. You can use Quick Presets below!');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setParseConfidence('Listening...');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        parseLocally(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow mic access or use preset buttons.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice input: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Call AI refinement on final transcript
        if (transcript) {
          refineWithAI(transcript);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.warn('SpeechRecognition start error:', err);
      setSpeechError('Could not access microphone. Tap a preset below to log instantly.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleSimulatedCommand = (command: string) => {
    setTranscript(command);
    parseLocally(command);
    refineWithAI(command);
  };

  // Play audio chime feedback
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (_) {}
  };

  const handleApply = () => {
    if (!selectedExId) return;
    playChime();
    const setIdx = Math.max(0, targetSet - 1);
    onApplyLog(selectedExId, setIdx, parsedWeight, parsedReps, markCompleted);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-heading text-white">Voice Quick Log</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                  AI Voice
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Speak your sets, reps & weight hands-free</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Target Exercise & Set Selector */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Target Exercise
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                {activeExerciseObj?.sets || 3} Total Sets
              </span>
            </div>

            <select
              value={selectedExId}
              onChange={(e) => setSelectedExId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
            >
              {workoutExercises.map((ex, idx) => (
                <option key={ex.id} value={ex.id}>
                  {idx + 1}. {ex.name} ({ex.targetMuscle})
                </option>
              ))}
            </select>

            {/* Set Pill Selector */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs text-zinc-400 mr-1">Set:</span>
              {Array.from({ length: activeExerciseObj?.sets || 4 }, (_, i) => i + 1).map((sNum) => (
                <button
                  key={sNum}
                  type="button"
                  onClick={() => setTargetSet(sNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all min-h-[32px] ${
                    targetSet === sNum
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Set {sNum}
                </button>
              ))}
            </div>
          </div>

          {/* Central Microphone Visualizer & Listening Indicator */}
          <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 text-center space-y-3 relative overflow-hidden">
            {/* Background Ambient Glow */}
            {isListening && (
              <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none animate-pulse rounded-3xl" />
            )}

            {/* Microphone Button with Pulse Rings */}
            <div className="relative inline-flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                  <span className="absolute w-20 h-20 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 z-10 ${
                  isListening
                    ? 'bg-emerald-500 text-zinc-950 ring-4 ring-emerald-500/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30'
                }`}
                title={isListening ? 'Tap to pause microphone' : 'Tap to speak'}
              >
                {isListening ? (
                  <Mic className="w-8 h-8 animate-bounce" />
                ) : (
                  <Mic className="w-7 h-7" />
                )}
              </button>
            </div>

            {/* Listening Status & Waves */}
            <div>
              <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <span>{isListening ? 'Listening for voice command...' : 'Tap Mic to Start Speaking'}</span>
                {isParsingAI && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isListening
                  ? 'Say e.g. "80 kg for 8 reps" or "Set 2 100 kilos 5 reps done"'
                  : 'Or tap any preset quick voice command below'}
              </p>
            </div>

            {/* Live Audio Wave Graphic */}
            {isListening && (
              <div className="flex items-center justify-center gap-1 h-5 pt-1">
                <span className="w-1 h-2 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="w-1 h-4 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.1s]" />
                <span className="w-1 h-5 bg-emerald-300 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.2s]" />
                <span className="w-1 h-3 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.15s]" />
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
              </div>
            )}

            {/* Live Spoken Transcript */}
            {transcript && (
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-emerald-500/30 text-xs text-emerald-300 font-mono text-left flex items-start gap-2">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="truncate">"{transcript}"</span>
              </div>
            )}

            {speechError && (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{speechError}</span>
              </div>
            )}
          </div>

          {/* Parsed Output Result Card */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Parsed Log Values
              </span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-[10px] font-mono text-emerald-400 font-semibold border border-zinc-800">
                {parseConfidence}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Weight Adjustment */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                  <Dumbbell className="w-3 h-3 text-emerald-400" />
                  <span>Weight (kg)</span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setParsedWeight((prev) => Math.max(0, prev - 2.5))}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center min-h-[28px] min-w-[28px]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xl font-bold font-mono text-white tabular-nums">
                    {parsedWeight}
                  </span>
                  <button
                    type="button"
                    onClick={() => setParsedWeight((prev) => prev + 2.5)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center min-h-[28px] min-w-[28px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Reps Adjustment */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>Repetitions</span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setParsedReps((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center min-h-[28px] min-w-[28px]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xl font-bold font-mono text-white tabular-nums">
                    {parsedReps}
                  </span>
                  <button
                    type="button"
                    onClick={() => setParsedReps((prev) => prev + 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center min-h-[28px] min-w-[28px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Checkbox: Mark completed & Rest timer */}
            <label className="flex items-center gap-2.5 pt-1 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={markCompleted}
                onChange={(e) => setMarkCompleted(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
              />
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark completed and trigger rest timer</span>
              </span>
            </label>
          </div>

          {/* Quick Preset Voice Commands (for instant testing or hands-free gym simulation) */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Quick Voice Command Presets</span>
              <span className="text-zinc-600">Tap to test voice NLP</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                '80 kg for 8 reps',
                'Set 2: 90 kg for 6 reps',
                '100 kg × 5 reps',
                '12 reps at 40 kg',
                'Bodyweight 15 reps',
                '75 kg 10 reps done',
              ].map((phrase, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => handleSimulatedCommand(phrase)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:scale-95 border border-zinc-800/80 text-[11px] text-zinc-300 text-left truncate transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">"{phrase}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs tracking-wide transition-all min-h-[46px]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all min-h-[46px]"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Apply Voice Log (Set {targetSet})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
