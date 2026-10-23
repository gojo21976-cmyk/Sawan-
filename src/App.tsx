/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FitnessProvider, useFitness } from './context/FitnessContext';
import { TopAppBar, BottomTabBar, NavTab } from './components/Navigation';
import { HomeScreen } from './screens/HomeScreen';
import { WorkoutsScreen } from './screens/WorkoutsScreen';
import { AICoachScreen } from './screens/AICoachScreen';
import { DietScreen } from './screens/DietScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RestTimerModal } from './components/RestTimerModal';
import { WorkoutPlayerModal } from './components/WorkoutPlayerModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SocialShareModal } from './components/SocialShareModal';

const MainAppContent: React.FC = () => {
  // Persistent React state for tab switching
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const { viewMode, isShareModalOpen, setIsShareModalOpen } = useFitness();

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'home':
        return <HomeScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'workouts':
        return <WorkoutsScreen />;
      case 'coach':
        return <AICoachScreen />;
      case 'diet':
        return <DietScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-start antialiased selection:bg-emerald-500 selection:text-black">
      {/* Container wrapper: Android mobile shell on desktop, or edge-to-edge */}
      <div
        className={`w-full transition-all duration-300 flex flex-col min-h-screen relative ${
          viewMode === 'mobile'
            ? 'max-w-[440px] sm:my-3 sm:rounded-[36px] sm:border sm:border-zinc-800/90 sm:shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:ring-1 sm:ring-white/5 overflow-hidden'
            : 'max-w-4xl'
        }`}
      >
        {/* Android Simulated Status Bar in Mobile Frame Mode */}
        {viewMode === 'mobile' && (
          <div className="h-6 bg-zinc-950 px-6 hidden sm:flex items-center justify-between text-[11px] font-mono text-zinc-500 border-b border-zinc-900 select-none">
            <span>9:41</span>
            <div className="w-12 h-3.5 bg-zinc-900 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Top App Bar */}
        <TopAppBar
          currentTab={currentTab}
          onOpenProfile={() => setCurrentTab('profile')}
        />

        {/* Scrollable Screen Content with bottom padding to avoid bottom tab overlap */}
        <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
          {renderActiveScreen()}
        </main>

        {/* Persistent Bottom Navigation Bar */}
        <BottomTabBar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      </div>

      {/* Global Modals & Floating Overlays */}
      <RestTimerModal />
      <WorkoutPlayerModal />
      <OnboardingModal />
      <SubscriptionModal />
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FitnessProvider>
      <MainAppContent />
    </FitnessProvider>
  );
}
