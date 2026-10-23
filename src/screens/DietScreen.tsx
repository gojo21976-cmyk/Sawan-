import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { APP_IMAGES } from '../data/initialData';
import {
  UtensilsCrossed,
  Sparkles,
  Droplets,
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Info,
  ShieldCheck,
  Sliders,
  X,
  Target,
  Zap,
} from 'lucide-react';

export const DietScreen: React.FC = () => {
  const {
    dietPlan,
    setDietPlan,
    toggleMealCompleted,
    waterCups,
    addWaterCup,
    removeWaterCup,
    generateAIDiet,
    isGeneratingDiet,
    userProfile,
  } = useFitness();

  // Quick snack extra intake state
  const [extraMacros, setExtraMacros] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [isAdjustGoalsOpen, setIsAdjustGoalsOpen] = useState<boolean>(false);

  // Form states for adjusting goals
  const [customCalories, setCustomCalories] = useState<number>(dietPlan.totalCalories);
  const [customProtein, setCustomProtein] = useState<number>(dietPlan.macros.proteinGrams);
  const [customCarbs, setCustomCarbs] = useState<number>(dietPlan.macros.carbsGrams);
  const [customFats, setCustomFats] = useState<number>(dietPlan.macros.fatsGrams);

  // Quick log input state
  const [snackName, setSnackName] = useState<string>('');
  const [snackProtein, setSnackProtein] = useState<number>(24);
  const [snackCarbs, setSnackCarbs] = useState<number>(10);
  const [snackFats, setSnackFats] = useState<number>(3);

  // Totals consumed today from checked meals + extras
  const completedMeals = dietPlan.meals.filter((m) => m.completed);
  const consumedCalories =
    completedMeals.reduce((acc, m) => acc + m.calories, 0) + extraMacros.calories;
  const consumedProtein =
    completedMeals.reduce((acc, m) => acc + m.proteinGrams, 0) + extraMacros.protein;
  const consumedCarbs =
    completedMeals.reduce(
      (acc, m) => acc + (m.carbsGrams ?? Math.round((m.calories * 0.45) / 4)),
      0
    ) + extraMacros.carbs;
  const consumedFats =
    completedMeals.reduce(
      (acc, m) => acc + (m.fatsGrams ?? Math.round((m.calories * 0.25) / 9)),
      0
    ) + extraMacros.fats;

  // Percentage calculations against personalized daily goals
  const calPercent = Math.min(100, Math.round((consumedCalories / dietPlan.totalCalories) * 100));
  const proteinPercent = Math.min(
    100,
    Math.round((consumedProtein / dietPlan.macros.proteinGrams) * 100)
  );
  const carbsPercent = Math.min(
    100,
    Math.round((consumedCarbs / dietPlan.macros.carbsGrams) * 100)
  );
  const fatsPercent = Math.min(
    100,
    Math.round((consumedFats / dietPlan.macros.fatsGrams) * 100)
  );

  // Remaining grams
  const proteinRemaining = Math.max(0, dietPlan.macros.proteinGrams - consumedProtein);
  const carbsRemaining = Math.max(0, dietPlan.macros.carbsGrams - consumedCarbs);
  const fatsRemaining = Math.max(0, dietPlan.macros.fatsGrams - consumedFats);
  const caloriesRemaining = Math.max(0, dietPlan.totalCalories - consumedCalories);

  // Macro calorie contributions
  const proteinCals = consumedProtein * 4;
  const carbsCals = consumedCarbs * 4;
  const fatsCals = consumedFats * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals || 1;

  const proteinRatio = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsRatio = Math.round((carbsCals / totalMacroCals) * 100);
  const fatsRatio = Math.round((fatsCals / totalMacroCals) * 100);

  const handleSaveAdjustedGoals = () => {
    setDietPlan((prev) => ({
      ...prev,
      totalCalories: customCalories,
      macros: {
        proteinGrams: customProtein,
        carbsGrams: customCarbs,
        fatsGrams: customFats,
      },
    }));
    setIsAdjustGoalsOpen(false);
  };

  const handleAddQuickSnack = () => {
    const cals = snackProtein * 4 + snackCarbs * 4 + snackFats * 9;
    setExtraMacros((prev) => ({
      calories: prev.calories + cals,
      protein: prev.protein + snackProtein,
      carbs: prev.carbs + snackCarbs,
      fats: prev.fats + snackFats,
    }));
    setIsQuickLogOpen(false);
    setSnackName('');
  };

  const applyPresetSnack = (name: string, p: number, c: number, f: number) => {
    setSnackName(name);
    setSnackProtein(p);
    setSnackCarbs(c);
    setSnackFats(f);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Actions */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-heading text-white">Daily Macronutrients</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Personalized macro tracking for {userProfile.goal} ({userProfile.weight} kg)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdjustGoalsOpen(true)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Adjust daily macro targets"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => generateAIDiet()}
            disabled={isGeneratingDiet}
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0 min-h-[40px] disabled:opacity-50"
          >
            {isGeneratingDiet ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
                <span>AI Diet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Daily Macro Tracker Dashboard */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-5 relative overflow-hidden">
        {/* Subtle decorative atmosphere */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Energy Gauge */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3" /> Daily Energy Target
              </span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                {userProfile.goal}
              </span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-white mt-1 tabular-nums">
              {consumedCalories}{' '}
              <span className="text-base font-normal text-zinc-400">/ {dietPlan.totalCalories} kcal</span>
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {caloriesRemaining > 0 ? (
                <span>
                  <strong className="text-emerald-400 font-mono">{caloriesRemaining} kcal</strong> remaining for today
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Daily calorie target achieved! 🎉</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsQuickLogOpen(true)}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 transition-colors shrink-0 shadow-sm min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Snack</span>
          </button>
        </div>

        {/* Calorie Progress Bar */}
        <div className="space-y-1.5 relative z-10">
          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${calPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>{calPercent}% consumed</span>
            <span className="font-mono text-zinc-500">{(consumedCalories / userProfile.weight).toFixed(1)} kcal/kg</span>
          </div>
        </div>

        {/* The 3 Core Macronutrient Progress Rings / Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          {/* 1. PROTEIN CARD */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                PROTEIN
              </span>
              <span className="text-xs font-mono font-bold text-white tabular-nums">
                {proteinPercent}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
                  {consumedProtein} <span className="text-xs font-normal text-zinc-400">/ {dietPlan.macros.proteinGrams}g</span>
                </div>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400 border-t border-zinc-800/80">
              <span>{proteinRemaining}g left</span>
              <span className="font-mono text-emerald-400">
                {(dietPlan.macros.proteinGrams / userProfile.weight).toFixed(1)}g / kg
              </span>
            </div>
          </div>

          {/* 2. CARBOHYDRATES CARD */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/30 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                CARBS
              </span>
              <span className="text-xs font-mono font-bold text-white tabular-nums">
                {carbsPercent}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
                  {consumedCarbs} <span className="text-xs font-normal text-zinc-400">/ {dietPlan.macros.carbsGrams}g</span>
                </div>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400 border-t border-zinc-800/80">
              <span>{carbsRemaining}g left</span>
              <span className="text-amber-400 font-medium">Glycogen Reload</span>
            </div>
          </div>

          {/* 3. HEALTHY FATS CARD */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-cyan-500/30 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                FATS
              </span>
              <span className="text-xs font-mono font-bold text-white tabular-nums">
                {fatsPercent}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
                  {consumedFats} <span className="text-xs font-normal text-zinc-400">/ {dietPlan.macros.fatsGrams}g</span>
                </div>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${fatsPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400 border-t border-zinc-800/80">
              <span>{fatsRemaining}g left</span>
              <span className="text-cyan-400 font-medium">Hormone Health</span>
            </div>
          </div>
        </div>

        {/* Stacked Macro Distribution Ratio Bar */}
        <div className="p-3.5 bg-zinc-950/90 rounded-2xl border border-zinc-800/80 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Current Macro Energy Split</span>
            <span className="font-mono text-zinc-300">
              P: <strong className="text-emerald-400">{proteinRatio}%</strong> · C:{' '}
              <strong className="text-amber-400">{carbsRatio}%</strong> · F:{' '}
              <strong className="text-cyan-400">{fatsRatio}%</strong>
            </span>
          </div>

          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${proteinRatio}%` }}
            />
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${carbsRatio}%` }}
            />
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${fatsRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* Water Hydration Tracker */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Droplets className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Water Intake</span>
              <span className="text-[11px] text-blue-400 font-mono font-bold">
                {(waterCups * 0.25).toFixed(1)} / {dietPlan.waterTargetLiters} L
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              {waterCups} of 14 glasses (250ml each) logged
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={removeWaterCup}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            title="Remove 1 glass"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={addWaterCup}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md transition-colors min-h-[44px] min-w-[44px]"
            title="Add 1 glass"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nutrition Scientific Blueprint */}
      <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
        <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Sports Nutrition Formula
        </div>
        <ul className="text-xs text-emerald-100/90 space-y-1">
          {dietPlan.nutritionHighlights.map((hl, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span>{hl}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Meals Schedule Checklist with Detailed Macros per Meal */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-heading text-white">
            Daily Meal Schedule ({dietPlan.meals.length} Meals)
          </h3>
          <span className="text-xs text-zinc-400">Check off when consumed</span>
        </div>

        <div className="space-y-3.5">
          {dietPlan.meals.map((meal) => {
            const mealCarbs = meal.carbsGrams ?? Math.round((meal.calories * 0.45) / 4);
            const mealFats = meal.fatsGrams ?? Math.round((meal.calories * 0.25) / 9);

            return (
              <div
                key={meal.id}
                className={`p-4 rounded-2xl border transition-all shadow-sm ${
                  meal.completed
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/20'
                    : 'bg-zinc-900 border-zinc-800/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{meal.name}</span>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {meal.time}
                      </span>
                    </div>

                    {/* Meal Macro Chips */}
                    <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                      <span className="text-emerald-400 font-semibold">{meal.proteinGrams}g Pro</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-amber-400">{mealCarbs}g Carb</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-cyan-400">{mealFats}g Fat</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400">{meal.calories} kcal</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleMealCompleted(meal.id)}
                    className={`p-1.5 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      meal.completed
                        ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
                        : 'text-zinc-500 hover:text-white bg-zinc-800'
                    }`}
                    title={meal.completed ? 'Mark uncompleted' : 'Mark meal completed'}
                  >
                    {meal.completed ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 stroke-[2.5]" />
                    ) : (
                      <Circle className="w-5 h-5 stroke-[1.8]" />
                    )}
                  </button>
                </div>

                {/* Food Items (Authentic Indian Nutrition) */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                  {meal.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-zinc-300"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="text-zinc-500">({item.quantity})</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
                        {item.protein}g P · {item.calories} kcal
                      </div>
                    </div>
                  ))}
                </div>

                {meal.coachTip && (
                  <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/70 text-[11px] text-zinc-400 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{meal.coachTip}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Quick Snack / Shake Macro Logger */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsQuickLogOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-white">Log Extra Food / Snack</h3>
                <p className="text-xs text-zinc-400">Instant macro update</p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Fast Presets</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: '1 Scoop Whey Protein', p: 24, c: 2, f: 1 },
                  { name: '100g Paneer Slice', p: 18, c: 3, f: 20 },
                  { name: '2 Boiled Eggs', p: 12, c: 1, f: 10 },
                  { name: '1 Banana', p: 1, c: 27, f: 0 },
                  { name: 'Handful Almonds (30g)', p: 6, c: 6, f: 15 },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => applyPresetSnack(item.name, item.p, item.c, item.f)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white hover:border-emerald-500/40 transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Item Description</label>
                <input
                  type="text"
                  value={snackName}
                  onChange={(e) => setSnackName(e.target.value)}
                  placeholder="e.g. Protein shake or Fruit bowl"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-emerald-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={snackProtein}
                    onChange={(e) => setSnackProtein(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-amber-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={snackCarbs}
                    onChange={(e) => setSnackCarbs(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyan-400 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={snackFats}
                    onChange={(e) => setSnackFats(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 font-mono text-center pt-1">
                Yields: <strong className="text-white">{snackProtein * 4 + snackCarbs * 4 + snackFats * 9} kcal</strong>
              </div>
            </div>

            <button
              onClick={handleAddQuickSnack}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-zinc-950 text-xs tracking-wide transition-colors min-h-[44px]"
            >
              Add to Daily Macros
            </button>
          </div>
        </div>
      )}

      {/* Modal: Customize Macro Goals */}
      {isAdjustGoalsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAdjustGoalsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-white">Adjust Daily Targets</h3>
                <p className="text-xs text-zinc-400">Personalize your macronutrient thresholds</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Target Calories (kcal)</label>
                <input
                  type="number"
                  step="50"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(parseInt(e.target.value, 10) || 2000)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-emerald-400 font-semibold mb-1">
                  Protein Target (grams)
                </label>
                <input
                  type="number"
                  step="5"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(parseInt(e.target.value, 10) || 120)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500">
                  Recommended: {(userProfile.weight * 2.0).toFixed(0)}g - {(userProfile.weight * 2.2).toFixed(0)}g (2.0-2.2g/kg)
                </span>
              </div>

              <div>
                <label className="block text-xs text-amber-400 font-semibold mb-1">
                  Carbohydrates Target (grams)
                </label>
                <input
                  type="number"
                  step="10"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(parseInt(e.target.value, 10) || 200)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-cyan-400 font-semibold mb-1">
                  Healthy Fats Target (grams)
                </label>
                <input
                  type="number"
                  step="5"
                  value={customFats}
                  onChange={(e) => setCustomFats(parseInt(e.target.value, 10) || 60)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveAdjustedGoals}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-zinc-950 text-xs tracking-wide transition-colors min-h-[44px]"
            >
              Save Personalized Goals
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
