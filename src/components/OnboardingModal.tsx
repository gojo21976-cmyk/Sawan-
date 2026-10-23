import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import {
  UserProfile,
  FitnessGoal,
  FitnessExperience,
  WorkoutLocation,
  DietPreference,
} from '../types/fitness';
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

const GOALS: { id: FitnessGoal; label: string; desc: string }[] = [
  { id: 'Muscle Gain', label: 'Build Muscle & Strength', desc: 'Hypertrophy focused training with calorie surplus' },
  { id: 'Fat Loss', label: 'Fat Loss & Definition', desc: 'Metabolic resistance work with targeted calorie deficit' },
  { id: 'Weight Gain', label: 'Clean Weight Gain', desc: 'Nutrient-dense nutrition and progressive overloading' },
  { id: 'General Fitness', label: 'General Fitness & Longevity', desc: 'Cardiovascular health, mobility and balanced strength' },
];

const EXPERIENCES: { id: FitnessExperience; label: string; desc: string }[] = [
  { id: 'Beginner', label: 'Beginner', desc: '0 - 1 year of consistent gym training' },
  { id: 'Intermediate', label: 'Intermediate', desc: '1 - 3 years of lifting with good form' },
  { id: 'Advanced', label: 'Advanced', desc: '3+ years of progressive overload experience' },
];

const LOCATIONS: { id: WorkoutLocation; label: string }[] = [
  { id: 'Gym', label: 'Commercial Gym' },
  { id: 'Home', label: 'Home Gym' },
  { id: 'Both', label: 'Both / Hybrid' },
];

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbells',
  'Cables',
  'Squat Rack',
  'Pull-up Bar',
  'Bench',
  'Kettlebells',
  'Resistance Bands',
  'Bodyweight Only',
];

const DIET_PREFERENCES: { id: DietPreference; label: string }[] = [
  { id: 'Vegetarian', label: 'Vegetarian (Paneer, Dal, Curd, Milk)' },
  { id: 'Non-Vegetarian', label: 'Non-Vegetarian (Eggs, Chicken, Fish, Dal)' },
  { id: 'Eggetarian', label: 'Eggetarian (Eggs + Vegetarian)' },
  { id: 'Vegan', label: 'Vegan (Plant-based only, Tofu, Soy, Pulses)' },
];

const COMMON_ALLERGIES = ['Peanuts', 'Dairy/Lactose', 'Gluten', 'Eggs', 'Soy', 'Tree Nuts', 'Seafood'];

export const OnboardingModal: React.FC = () => {
  const { userProfile, updateProfile, isOnboardingOpen, setIsOnboardingOpen, generateAIDiet } = useFitness();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<UserProfile>(userProfile);

  if (!isOnboardingOpen) return null;

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Save and finish
      updateProfile(formData);
      setIsOnboardingOpen(false);
      // Automatically refresh AI diet plan
      generateAIDiet();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleEquipment = (eq: string) => {
    setFormData((prev) => {
      const exists = prev.equipment.includes(eq);
      return {
        ...prev,
        equipment: exists ? prev.equipment.filter((item) => item !== eq) : [...prev.equipment, eq],
      };
    });
  };

  const toggleAllergy = (allergy: string) => {
    setFormData((prev) => {
      const exists = prev.allergies.includes(allergy);
      return {
        ...prev,
        allergies: exists ? prev.allergies.filter((a) => a !== allergy) : [...prev.allergies, allergy],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Step {step} of 5
            </span>
          </div>
          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-zinc-800 h-1">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold font-heading text-white">Let's get to know you</h3>
                <p className="text-xs text-zinc-400 mt-1">Your AI coach customizes every set and gram of protein based on your bio.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 18 })}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                      min={14}
                      max={90}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Height & Weight */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold font-heading text-white">Body Metrics</h3>
                <p className="text-xs text-zinc-400 mt-1">Used to calculate precise basal metabolic rate (BMR) and recommended loads.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Height (cm)</label>
                    <span className="text-xs font-mono text-emerald-400 tabular-nums">{formData.height} cm ({(formData.height / 30.48).toFixed(1)} ft)</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="220"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Current Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 60 })}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Target Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.targetWeight}
                      onChange={(e) => setFormData({ ...formData, targetWeight: parseFloat(e.target.value) || 65 })}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs text-zinc-400">
                  Calculated BMI: <strong className="text-white font-mono">{(formData.weight / ((formData.height / 100) ** 2)).toFixed(1)}</strong>
                  {' · '}
                  <span className="text-emerald-400 font-medium">
                    {formData.targetWeight > formData.weight ? 'Bulking phase (+ surplus)' : 'Cutting phase (- deficit)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Goals & Experience */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold font-heading text-white">Your Primary Goal</h3>
                <p className="text-xs text-zinc-400 mt-1">Select what you want FitAI Coach to optimize your program for.</p>
              </div>

              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setFormData({ ...formData, goal: g.id })}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      formData.goal === g.id
                        ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-sm'
                        : 'bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">{g.label}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{g.desc}</div>
                    </div>
                    {formData.goal === g.id && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shrink-0 ml-2">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Lifting Experience</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCES.map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => setFormData({ ...formData, experience: exp.id })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        formData.experience === exp.id
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 font-semibold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{exp.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Training Setup & Equipment */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold font-heading text-white">Training Location & Equipment</h3>
                <p className="text-xs text-zinc-400 mt-1">We guarantee every suggested exercise matches your available tools.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Where do you train?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => setFormData({ ...formData, location: loc.id })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          formData.location === loc.id
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{loc.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Days per week</label>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{formData.daysPerWeek} Days / Week</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={formData.daysPerWeek}
                    onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Available Equipment</label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((eq) => {
                      const selected = formData.equipment.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipment(eq)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Diet Preferences & Allergies */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold font-heading text-white">Diet & Food Preferences</h3>
                <p className="text-xs text-zinc-400 mt-1">Specialized support for authentic Indian fitness foods (Roti, Dal, Paneer, Chicken).</p>
              </div>

              <div className="space-y-2">
                {DIET_PREFERENCES.map((diet) => (
                  <button
                    key={diet.id}
                    onClick={() => setFormData({ ...formData, dietPreference: diet.id })}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      formData.dietPreference === diet.id
                        ? 'bg-emerald-950/30 border-emerald-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{diet.label}</div>
                    {formData.dietPreference === diet.id && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Food Allergies / Intolerances</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const selected = formData.allergies.includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {allergy}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all min-h-[44px]"
          >
            <span>{step === 5 ? 'Save & Build My AI Plan' : 'Continue'}</span>
            {step === 5 ? <Sparkles className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
