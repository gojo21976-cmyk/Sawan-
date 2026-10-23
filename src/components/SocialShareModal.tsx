import React, { useState, useRef } from 'react';
import { useFitness } from '../context/FitnessContext';
import { APP_IMAGES } from '../data/initialData';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Flame,
  Trophy,
  Dumbbell,
  Sparkles,
  ExternalLink,
  Smartphone,
} from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareType?: 'weekly' | 'workout' | 'milestone';
  workoutName?: string;
  workoutVolume?: number;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  shareType = 'weekly',
  workoutName,
  workoutVolume,
}) => {
  const { userProfile, workoutHistory, prs } = useFitness();
  const [copied, setCopied] = useState<boolean>(false);
  const [cardTheme, setCardTheme] = useState<'stealth' | 'emerald' | 'gold'>('stealth');
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Compute weekly statistics
  const weeklyWorkouts = workoutHistory.slice(0, 5);
  const weeklyTotalVolume = weeklyWorkouts.reduce((acc, w) => acc + (w.totalVolumeKg || 0), 0);
  const weeklyTotalCalories = weeklyWorkouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
  const totalMinutes = weeklyWorkouts.reduce((acc, w) => acc + (w.durationMinutes || 0), 0);
  const topPR = prs[0] || { exercise: 'Barbell Bench Press', weight: 92.5, reps: 5 };

  const shareText = `🔥 FitAI Coach Progress Update by ${userProfile.name}:
💪 Completed ${weeklyWorkouts.length} workouts this week
🏋️ Total Volume Lifted: ${weeklyTotalVolume.toLocaleString()} kg
🔥 Calories Burned: ${weeklyTotalCalories.toLocaleString()} kcal
🏆 Top PR: ${topPR.exercise} (${topPR.weight}kg x ${topPR.reps})
⚡ Active Streak: 5 Days!
Crush your fitness goals with FitAI Coach!`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userProfile.name}'s FitAI Fitness Milestone`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyText();
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(tweetUrl, '_blank');
  };

  const shareToWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadCard = () => {
    // Generate image or trigger download format
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw dark background
    ctx.fillStyle = cardTheme === 'gold' ? '#1c1917' : cardTheme === 'emerald' ? '#022c22' : '#09090b';
    ctx.fillRect(0, 0, 1080, 1920);

    // Accent header
    ctx.fillStyle = cardTheme === 'gold' ? '#f59e0b' : '#10b981';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('FITAI COACH // ATHLETE MILESTONE', 80, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText(userProfile.name, 80, 280);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '40px sans-serif';
    ctx.fillText(`${userProfile.goal} · 5 Days Streak`, 80, 360);

    // Metrics
    ctx.fillStyle = '#18181b';
    ctx.fillRect(80, 440, 920, 260);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 90px sans-serif';
    ctx.fillText(`${(weeklyTotalVolume / 1000).toFixed(1)} TONS`, 120, 560);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '36px sans-serif';
    ctx.fillText('Total Tonnage Lifted This Week', 120, 640);

    ctx.fillStyle = '#18181b';
    ctx.fillRect(80, 740, 920, 260);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px sans-serif';
    ctx.fillText(`${weeklyWorkouts.length} SESSIONS`, 120, 860);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '36px sans-serif';
    ctx.fillText(`${totalMinutes} Total Minutes Trained`, 120, 940);

    // PR Box
    ctx.fillStyle = '#18181b';
    ctx.fillRect(80, 1040, 920, 260);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText(`PR: ${topPR.exercise}`, 120, 1140);
    ctx.fillStyle = '#ffffff';
    ctx.font = '50px sans-serif';
    ctx.fillText(`${topPR.weight} kg × ${topPR.reps} reps`, 120, 1220);

    // Footer
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 45px sans-serif';
    ctx.fillText('FitAI Coach · Science-Backed Fitness', 80, 1780);

    const link = document.createElement('a');
    link.download = `FitAI_${userProfile.name.replace(/\s+/g, '_')}_Milestone.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-heading text-white">Share Milestone</h3>
              <p className="text-[10px] text-zinc-400">Export progress card to social media</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Card Theme Switcher */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-semibold">Card Aesthetic</span>
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                onClick={() => setCardTheme('stealth')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  cardTheme === 'stealth'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Stealth
              </button>
              <button
                onClick={() => setCardTheme('emerald')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  cardTheme === 'emerald'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Neon
              </button>
              <button
                onClick={() => setCardTheme('gold')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  cardTheme === 'gold'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Gold
              </button>
            </div>
          </div>

          {/* Social Share Card Preview (Instagram Story / Post format) */}
          <div
            ref={cardRef}
            className={`p-5 rounded-3xl border transition-all space-y-4 relative overflow-hidden shadow-2xl ${
              cardTheme === 'gold'
                ? 'bg-gradient-to-br from-amber-950/60 via-zinc-900 to-zinc-950 border-amber-500/40'
                : cardTheme === 'emerald'
                ? 'bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-zinc-950 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                : 'bg-zinc-950 border-zinc-800 shadow-xl'
            }`}
          >
            {/* Top Brand & Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-400 font-mono">
                  FI
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-tight text-white uppercase font-heading">
                    FitAI Coach
                  </div>
                  <div className="text-[9px] text-zinc-400">Weekly Performance Report</div>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400">
                <Flame className="w-3 h-3 fill-amber-400" />
                <span>5d Streak</span>
              </div>
            </div>

            {/* Athlete Info */}
            <div className="flex items-center gap-3 pt-1">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/40 shrink-0">
                <img
                  src={APP_IMAGES.trainerAvatar}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-base font-bold font-heading text-white">{userProfile.name}</h4>
                <div className="text-xs text-zinc-400">
                  {userProfile.goal} · {userProfile.experience}
                </div>
              </div>
            </div>

            {/* Stats Highlight Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Volume Lifted</div>
                <div className="text-lg font-extrabold font-mono text-emerald-400 mt-0.5 tabular-nums">
                  {(weeklyTotalVolume / 1000).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-zinc-400">tons</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">5 completed sessions</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Calories Burned</div>
                <div className="text-lg font-extrabold font-mono text-white mt-0.5 tabular-nums">
                  {weeklyTotalCalories}{' '}
                  <span className="text-xs font-normal text-zinc-400">kcal</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{totalMinutes} mins active</div>
              </div>
            </div>

            {/* Top PR Highlight Box */}
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-400">Top Record</div>
                  <div className="text-xs font-bold text-white mt-0.5">{topPR.exercise}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                  {topPR.weight} kg
                </div>
                <div className="text-[10px] text-zinc-400">{topPR.reps} reps</div>
              </div>
            </div>

            {/* Coach Motivational Watermark */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Sparkles className="w-3 h-3" /> FitAI Certified
              </span>
              <span>fitai.app</span>
            </div>
          </div>

          {/* Social Platform Share Buttons */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Share Direct To:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareToWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm min-h-[44px]"
              >
                <span>WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={shareToTwitter}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700 min-h-[44px]"
              >
                <span>X (Twitter)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action CTAs: Native Share, Download Image, Copy Text */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleDownloadCard}
              className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Image</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  <span>Copy Stats</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Share CTA */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via Phone Apps (Story / Chat)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
