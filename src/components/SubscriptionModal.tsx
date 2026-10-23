import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { X, Check, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SubscriptionModal: React.FC = () => {
  const { isSubscriptionOpen, setIsSubscriptionOpen, isPremium, setIsPremium } = useFitness();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  if (!isSubscriptionOpen) return null;

  const handleSubscribe = () => {
    setIsPremium(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      setIsSubscriptionOpen(false);
    }, 1200);
  };

  const handleCancelSubscription = () => {
    setIsPremium(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={() => setIsSubscriptionOpen(false)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="p-6 pb-5 bg-gradient-to-b from-emerald-950/60 to-zinc-900 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-400" /> FitAI Pro
            </span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-white">
            Unleash Your Ultimate Physique
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Unlimited AI plan adaptations, biomechanical exercise critiques, and customized Indian macros.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Selector */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`p-3 rounded-xl text-left transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-zinc-800 text-white shadow-md border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-emerald-400 mb-0.5">Save 40%</div>
              <div className="text-base font-bold">$5.83 <span className="text-xs font-normal text-zinc-400">/mo</span></div>
              <div className="text-xs text-zinc-400 mt-0.5">$69.99 billed annually</div>
            </button>

            <button
              onClick={() => setBillingCycle('monthly')}
              className={`p-3 rounded-xl text-left transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-zinc-800 text-white shadow-md border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-0.5">Monthly</div>
              <div className="text-base font-bold">$9.99 <span className="text-xs font-normal text-zinc-400">/mo</span></div>
              <div className="text-xs text-zinc-400 mt-0.5">Cancel anytime</div>
            </button>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {[
              'Unlimited custom AI workout generation for any split',
              'Deep Indian diet optimizer (Paneer, Dal, Rotis & Chicken)',
              'Priority real-time AI Personal Trainer chat with Gemini',
              '1-Rep Max (1RM) calculators & progression forecasting',
              'Zero sponsor ads in your workout flow',
            ].map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          {isPremium ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <span className="text-sm font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> You are an active FitAI Pro member
                </span>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Switch back to Free Plan
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start 7-Day Free Trial</span>
            </button>
          )}

          <div className="text-[11px] text-center text-zinc-500">
            Secure checkout · No commitment · Cancel anytime with 1-click
          </div>
        </div>
      </div>
    </div>
  );
};
