import React from 'react';
import { useFitness } from '../context/FitnessContext';
import { APP_IMAGES } from '../data/initialData';
import {
  Flame,
  Dumbbell,
  Bot,
  UtensilsCrossed,
  User,
  Zap,
  Smartphone,
  Monitor,
} from 'lucide-react';

export type NavTab = 'home' | 'workouts' | 'coach' | 'diet' | 'profile';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const TopAppBar: React.FC<{
  currentTab: NavTab;
  onOpenProfile: () => void;
}> = ({ currentTab, onOpenProfile }) => {
  const { userProfile, isPremium, setIsSubscriptionOpen, viewMode, setViewMode } = useFitness();

  const getTitle = () => {
    switch (currentTab) {
      case 'home':
        return 'FitAI Coach';
      case 'workouts':
        return 'Training Programs';
      case 'coach':
        return 'AI Personal Trainer';
      case 'diet':
        return 'AI Nutrition Planner';
      case 'profile':
        return 'Athlete Profile';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between gap-3 h-14">
      {/* Brand / Title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold font-mono text-sm">
          FI
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold font-heading text-white truncate tracking-tight">
            {getTitle()}
          </h1>
          <div className="text-[10px] text-zinc-400 truncate">
            {userProfile.goal} · {userProfile.experience}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Streak counter */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-amber-400">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span className="font-mono">5d</span>
        </div>

        {/* View Mode Toggle (Mobile / Desktop) */}
        <button
          onClick={() => setViewMode(viewMode === 'mobile' ? 'responsive' : 'mobile')}
          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center hidden sm:flex"
          title={`Switch to ${viewMode === 'mobile' ? 'Responsive View' : 'Android Mobile Frame'}`}
        >
          {viewMode === 'mobile' ? (
            <Monitor className="w-4 h-4" />
          ) : (
            <Smartphone className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Pro Badge / Upgrade */}
        {isPremium ? (
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1 transition-colors min-h-[36px]"
          >
            <Zap className="w-3 h-3 fill-emerald-400" /> PRO
          </button>
        ) : (
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors min-h-[36px]"
          >
            <Zap className="w-3 h-3 text-emerald-400" /> Upgrade
          </button>
        )}

        {/* Profile Avatar trigger */}
        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 hover:border-emerald-500 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
        >
          <img
            src={APP_IMAGES.trainerAvatar}
            alt={userProfile.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>
      </div>
    </header>
  );
};

export const BottomTabBar: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Flame },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'coach', label: 'AI Coach', icon: Bot },
    { id: 'diet', label: 'Diet', icon: UtensilsCrossed },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors relative ${
                isActive ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300 font-medium'
              }`}
            >
              {/* Active glow indicator */}
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
