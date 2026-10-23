import React, { useState, useRef, useEffect } from 'react';
import { useFitness } from '../context/FitnessContext';
import { APP_IMAGES } from '../data/initialData';
import { Exercise } from '../types/fitness';
import { ExerciseVideoModal } from '../components/ExerciseVideoModal';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  Dumbbell,
  Apple,
  RefreshCw,
  Video,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'How can I build muscle faster?',
  'What should I train today?',
  'How much protein do I need?',
  'Suggest a vegetarian bulking diet',
  'How can I improve my bench press?',
  'How to warm up shoulders properly?',
];

export const AICoachScreen: React.FC = () => {
  const { chatMessages, sendChatMessage, isChatLoading, userProfile, workouts } = useFitness();
  const [inputText, setInputText] = useState<string>('');
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<Exercise | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isChatLoading) return;
    const msg = inputText;
    setInputText('');
    sendChatMessage(msg);
  };

  const handleChipClick = (q: string) => {
    sendChatMessage(q);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[850px] relative">
      {/* Coach Bio Header */}
      <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center justify-between shrink-0 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-emerald-500/40 relative shrink-0">
            <img
              src={APP_IMAGES.trainerAvatar}
              alt="Coach FitAI"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold font-heading text-white">Coach FitAI</h3>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                PRO CSCS
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Personalized for {userProfile.name} ({userProfile.goal} · {userProfile.experience})
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Online</div>
          <div className="text-[10px] text-zinc-500">Gemini 3.8</div>
        </div>
      </div>

      {/* Suggested Questions & AI Video Demos Carousel */}
      <div className="space-y-1.5 shrink-0 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(q)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-850 text-xs text-zinc-300 hover:text-white whitespace-nowrap transition-all shrink-0 min-h-[36px]"
            >
              {q}
            </button>
          ))}
        </div>

        {/* AI Video Demos Quick-Launch Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-1 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3" /> AI Videos:
          </span>
          {[
            'Barbell Bench Press',
            'Barbell Back Squat',
            'Conventional Barbell Deadlift',
            'Overhead Barbell Press (OHP)',
            'Wide-Grip Lat Pulldown',
            'Incline Dumbbell Bicep Curl',
          ].map((exName) => {
            const foundEx = workouts.flatMap((w) => w.exercises).find((e) => e.name === exName) || {
              id: `ex-${exName.toLowerCase().replace(/\s+/g, '-')}`,
              name: exName,
              targetMuscle: 'Compound Muscle',
              sets: 3,
              reps: '8-10',
              suggestedWeightKg: 60,
              restSeconds: 90,
              tempo: '3-0-1-0',
              formCues: ['Maintain 360 core brace', 'Controlled eccentric descent', 'Explosive drive'],
              illustrationType: 'barbell' as const,
            };

            return (
              <button
                key={exName}
                onClick={() => setSelectedVideoExercise(foundEx)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 hover:text-white whitespace-nowrap transition-all flex items-center gap-1 shrink-0 min-h-[28px]"
              >
                <Video className="w-3 h-3 text-emerald-400" />
                <span>{exName.replace('Barbell ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-2">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0 mt-0.5">
                  <img
                    src={APP_IMAGES.trainerAvatar}
                    alt="AI Coach"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1.5 shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                }`}
              >
                {/* Formatted Message text (handles bullet points & bold) */}
                <div className="whitespace-pre-wrap space-y-1">
                  {msg.text.split('\n').map((line, i) => {
                    if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
                      return (
                        <div key={i} className="flex items-start gap-1.5 pl-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          <span>{line.replace(/^[-•*]\s*/, '')}</span>
                        </div>
                      );
                    }
                    return <p key={i}>{line}</p>;
                  })}
                </div>

                <div
                  className={`text-[9px] font-mono text-right ${
                    isUser ? 'text-emerald-200' : 'text-zinc-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isChatLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0">
              <img
                src={APP_IMAGES.trainerAvatar}
                alt="AI Coach"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 rounded-tl-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Safety Guidance Disclaimer */}
      <div className="py-1 px-2 text-[10px] text-zinc-500 flex items-center justify-center gap-1 text-center shrink-0">
        <ShieldAlert className="w-3 h-3 text-zinc-500 shrink-0" />
        <span>FitAI provides general training guidance. Seek professional medical advice for injuries or acute pain.</span>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-2 shrink-0 mt-1 shadow-lg"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Coach FitAI anything about sets, form, or diet..."
          className="flex-1 px-3 py-2.5 bg-transparent text-white text-xs placeholder:text-zinc-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isChatLoading}
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 text-zinc-950 flex items-center justify-center transition-all shrink-0 min-h-[44px] min-w-[44px]"
        >
          <Send className="w-4 h-4 fill-zinc-950" />
        </button>
      </form>

      {/* AI Exercise Video Demonstration Modal */}
      <ExerciseVideoModal
        exercise={selectedVideoExercise}
        onClose={() => setSelectedVideoExercise(null)}
      />
    </div>
  );
};
