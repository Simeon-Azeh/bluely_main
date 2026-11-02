'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, Button } from '@/components/ui';
import { FiCoffee, FiSun, FiMoon, FiCheck, FiX, FiPlusCircle, FiSend } from 'react-icons/fi';

// Carb level types
type CarbLevel = 'low' | 'medium' | 'high';

interface CamerooniaDish {
    id: string;
    name: string;
    carbLevel: CarbLevel;
    description: string;
    imageUrl?: string;
}

const cameroonianDishes: CamerooniaDish[] = [
    { id: 'fufu-eru', name: 'Fufu & Eru', carbLevel: 'high', description: 'Cassava-based', imageUrl: '' },
    { id: 'fufu-corn-njama', name: 'Fufu Corn & Njama Njama', carbLevel: 'high', description: 'Maize', imageUrl: '' },
    { id: 'garri-eru', name: 'Garri & Eru', carbLevel: 'high', description: 'Processed cassava', imageUrl: '' },
    { id: 'rice-stew', name: 'Rice & Stew', carbLevel: 'high', description: 'Refined carbs', imageUrl: '' },
    { id: 'plantain', name: 'Plantain (Boiled/Fried)', carbLevel: 'medium', description: 'Starchy', imageUrl: '' },
    { id: 'beans-plantain', name: 'Beans & Plantain', carbLevel: 'medium', description: 'Fiber reduces spike', imageUrl: '' },
    { id: 'yam', name: 'Yam (Boiled)', carbLevel: 'high', description: 'Starchy', imageUrl: '' },
    { id: 'achu', name: 'Achu', carbLevel: 'high', description: 'Pounded cocoyam', imageUrl: '' },
    { id: 'koki-beans', name: 'Koki Beans', carbLevel: 'medium', description: 'Legumes', imageUrl: '' },
    { id: 'okra-soup', name: 'Okra Soup (without fufu)', carbLevel: 'low', description: 'Mostly vegetables', imageUrl: '' },
    { id: 'fish-meat-eggs', name: 'Fish / Meat / Eggs', carbLevel: 'low', description: 'Protein', imageUrl: '' },
    { id: 'ndole', name: 'Ndolé (without starch)', carbLevel: 'low', description: 'Leafy vegetables', imageUrl: '' },
    { id: 'pepper-soup', name: 'Pepper Soup', carbLevel: 'low', description: 'Broth-based', imageUrl: '' },
];

const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: FiCoffee },
    { value: 'lunch', label: 'Lunch', icon: FiSun },
    { value: 'dinner', label: 'Dinner', icon: FiMoon },
    { value: 'snack', label: 'Snack', icon: FiPlusCircle },
];

const carbLevelConfig = {
    low: {
        color: 'text-green-700',
        bg: 'bg-green-100',
        border: 'border-green-200',
        dot: 'bg-green-500',
        label: 'Low carb'
    },
    medium: {
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        border: 'border-yellow-200',
        dot: 'bg-yellow-500',
        label: 'Medium carb'
    },
    high: {
        color: 'text-red-700',
        bg: 'bg-red-100',
        border: 'border-red-200',
        dot: 'bg-red-500',
        label: 'High carb'
    },
};

export default function MealsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedMealType, setSelectedMealType] = useState<string>('');
    const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
    const [customDishNames, setCustomDishNames] = useState<Record<string, string>>({});
    const [dishSearch, setDishSearch] = useState('');
    const [showAllDishes, setShowAllDishes] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [dishCarbLevels, setDishCarbLevels] = useState<Record<string, CarbLevel>>({});
    const [customDish, setCustomDish] = useState('');
    const [customCarbLevel, setCustomCarbLevel] = useState<CarbLevel>('medium');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [aiDescription, setAiDescription] = useState('');
    const [aiEstimating, setAiEstimating] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [aiParsed, setAiParsed] = useState<{ carbsEstimate: number; carbLevel: CarbLevel; description: string } | null>(null);
    const [aiBreakdown, setAiBreakdown] = useState<Array<{ item: string; carbs: number }> | null>(null);
    const [aiLogging, setAiLogging] = useState(false);
    const [aiRefinement, setAiRefinement] = useState('');
    const [aiRefining, setAiRefining] = useState(false);
    const [aiAdjustedCarbs, setAiAdjustedCarbs] = useState<number | null>(null);
    const [aiHistory, setAiHistory] = useState<Array<{ role: string; content: string }>>([]);

    const handleDishSelect = (dish: CamerooniaDish) => {
        if (selectedDishes.includes(dish.id)) {
            setSelectedDishes(prev => prev.filter(id => id !== dish.id));
            setDishCarbLevels(prev => {
                const updated = { ...prev };
                delete updated[dish.id];
                return updated;
            });
        } else {
            setSelectedDishes(prev => [...prev, dish.id]);
            setDishCarbLevels(prev => ({
                ...prev,
                [dish.id]: dish.carbLevel,
            }));
        }
    };

    const handleCarbLevelChange = (dishId: string, level: CarbLevel) => {
        setDishCarbLevels(prev => ({
            ...prev,
            [dishId]: level,
        }));
    };

    const handleAddCustomDish = () => {
        if (!customDish.trim()) return;

        const customId = `custom-${Date.now()}`;
        setSelectedDishes(prev => [...prev, customId]);
        setCustomDishNames(prev => ({ ...prev, [customId]: customDish.trim() }));
        setDishCarbLevels(prev => ({
            ...prev,
            [customId]: customCarbLevel,
        }));
        setCustomDish('');
    };

    // Parse AI response to extract per-item breakdown
    const parseAiBreakdown = (reply: string): Array<{ item: string; carbs: number }> => {
        const lines = reply.split('\n');
        const items: Array<{ item: string; carbs: number }> = [];
        for (const line of lines) {
            // Match patterns like "Rice: 45g", "• Bread: 28g carbs", "- Tea: ~5g", "4 slices of bread: 60g", "1. Eggs (2): 1g"
            const match = line.match(/^(?:[-•*]|\d+[.)\s])?\ *([^:\n]+?):\s*(?:~|about\s*)?(?:\d+\s*[-–]\s*)?(\d+)\s*g(?:rams?)?(?:\s*(?:of\s+)?carbs?)?/i);
            if (match) {
                const itemName = match[1].trim();
                if (/^(total|note|overall|approx|summary)/i.test(itemName)) continue;
                const carbs = parseInt(match[2], 10);
                if (!isNaN(carbs) && carbs >= 0 && carbs <= 500) {
                    items.push({ item: itemName, carbs });
                }
            }
        }
        return items;
    };

    // Parse AI response to extract carbs and level
    const parseAiResponse = (reply: string, desc: string): { carbsEstimate: number; carbLevel: CarbLevel; description: string } | null => {
        const lower = reply.toLowerCase();
        // Try to extract grams number
        const carbMatch = reply.match(/(\d{1,4})\s*(?:[-–]\s*\d{1,4}\s*)?(?:g(?:rams)?|carb)/i)
            || reply.match(/about\s+(\d{1,4})/i)
            || reply.match(/(\d{1,4})\s*(?:total|estimated)/i);
        const carbs = carbMatch ? parseInt(carbMatch[1], 10) : null;

        // Determine level
        let level: CarbLevel = 'medium';
        if (lower.includes('high carb') || lower.includes('**high**') || lower.includes('high level')) level = 'high';
        else if (lower.includes('low carb') || lower.includes('**low**') || lower.includes('low level')) level = 'low';
        else if (lower.includes('medium carb') || lower.includes('**medium**') || lower.includes('moderate') || lower.includes('medium level')) level = 'medium';

        if (carbs && carbs >= 1 && carbs <= 500) {
            return { carbsEstimate: carbs, carbLevel: level, description: desc.trim() };
        }
        return null;
    };

    const handleAiEstimate = async () => {
        if (!user || !aiDescription.trim() || aiEstimating) return;
        setAiEstimating(true);
        setAiResult(null);
        setAiParsed(null);
        setAiBreakdown(null);
        setAiAdjustedCarbs(null);
        setAiRefinement('');
        setAiHistory([]);
        const userMsg = `I just ate: ${aiDescription.trim()}. List every food and drink item I mentioned, each on its own line in this exact format: "Item name: Xg". Then on a final line write "Total: Xg". No extra commentary, just the breakdown.`;
        try {
            const result = await api.chatWithDiaBuddy(
                user.uid,
                userMsg,
                [],
                user.displayName
            );
            setAiResult(result.reply);
            // Store exchange so refine calls can send full context
            setAiHistory([
                { role: 'user', content: userMsg },
                { role: 'assistant', content: result.reply },
            ]);
            const breakdown = parseAiBreakdown(result.reply);
            if (breakdown.length > 0) {
                setAiBreakdown(breakdown);
                const total = breakdown.reduce((s, i) => s + i.carbs, 0);
                const parsed = parseAiResponse(result.reply, aiDescription);
                setAiParsed(parsed ?? { carbsEstimate: total, carbLevel: total > 60 ? 'high' : total > 30 ? 'medium' : 'low', description: aiDescription });
            } else {
                // Always set aiParsed so refine + accept sections stay visible
                const parsed = parseAiResponse(result.reply, aiDescription);
                setAiParsed(parsed);
            }
        } catch {
            setAiResult('Sorry, I couldn\'t estimate carbs right now. Please try again.');
        } finally {
            setAiEstimating(false);
        }
    };

    const handleAiRefine = async () => {
        if (!user || !aiRefinement.trim() || aiRefining) return;
        setAiRefining(true);
        const refineMsg = `Update the carb estimate for my meal: "${aiDescription.trim()}". Correction: ${aiRefinement.trim()}. Show every food item on its own line as "Item name: Xg". Then write "Total: Xg". No extra commentary.`;
        try {
            const result = await api.chatWithDiaBuddy(
                user.uid,
                refineMsg,
                aiHistory,  // pass full conversation so AI knows the existing breakdown
                user.displayName
            );
            const breakdown = parseAiBreakdown(result.reply);
            if (breakdown.length > 0) {
                setAiBreakdown(breakdown);
                const total = breakdown.reduce((s, i) => s + i.carbs, 0);
                const refined = { carbsEstimate: total, carbLevel: (total > 60 ? 'high' : total > 30 ? 'medium' : 'low') as CarbLevel, description: aiDescription };
                setAiParsed(refined);
                setAiAdjustedCarbs(total);
            } else {
                const refined = parseAiResponse(result.reply, aiDescription);
                if (refined) {
                    setAiParsed(refined);
                    setAiAdjustedCarbs(refined.carbsEstimate);
                }
            }
            if (result.reply) {
                setAiResult(result.reply);
                // Keep history growing so subsequent refines also have full context
                setAiHistory(prev => [
                    ...prev,
                    { role: 'user', content: refineMsg },
                    { role: 'assistant', content: result.reply },
                ]);
            }
        } catch {
            /* ignore */
        } finally {
            setAiRefining(false);
            setAiRefinement('');
        }
    };

    const handleAiAccept = async () => {
        if (!user || !aiParsed || !selectedMealType) return;
        setAiLogging(true);
        try {
            // Use adjusted per-item total if breakdown exists, else fall back to adjusted/parsed
            const breakdownTotal = aiBreakdown ? aiBreakdown.reduce((s, i) => s + i.carbs, 0) : null;
            const carbsToLog = breakdownTotal ?? aiAdjustedCarbs ?? aiParsed.carbsEstimate;
            await api.createMeal({
                firebaseUid: user.uid,
                mealType: selectedMealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
                carbsEstimate: carbsToLog,
                description: aiParsed.description.slice(0, 300),
                timestamp: new Date().toISOString(),
            });
            try { await api.getGlucose30(user.uid, 'meal_log'); } catch { /* non-critical */ }
            setIsSuccess(true);
            setAiDescription('');
            setAiResult(null);
            setAiParsed(null);
            setAiBreakdown(null);
            setAiAdjustedCarbs(null);
            setAiHistory([]);
            setTimeout(() => {
                setSelectedMealType('');
                setSelectedDishes([]);
                setDishCarbLevels({});
                setNotes('');
                setIsSuccess(false);
            }, 2000);
        } catch {
            console.error('Failed to log AI meal');
        } finally {
            setAiLogging(false);
        }
    };

    const handleSubmit = async () => {
        if (!user || !selectedMealType || selectedDishes.length === 0) return;

        try {
            setIsLoading(true);
            setSubmitError('');

            // Create meal log entry (in a real app, this would call an API)
            const mealData = {
                firebaseUid: user.uid,
                mealType: selectedMealType,
                dishes: selectedDishes.map(id => {
                    const dish = cameroonianDishes.find(d => d.id === id);
                    return {
                        id,
                        name: dish?.name || customDishNames[id] || 'Custom dish',
                        carbLevel: dishCarbLevels[id],
                    };
                }),
                notes,
                loggedAt: new Date().toISOString(),
            };

            console.log('Meal logged:', mealData);

            // Map carb levels to an estimate: low=15, medium=40, high=65
            const carbMap: Record<string, number> = { low: 15, medium: 40, high: 65 };
            const totalCarbs = mealData.dishes.reduce((sum, d) => sum + (carbMap[d.carbLevel] || 30), 0);

            // Build a description from the selected dishes
            const dishNames = mealData.dishes.map(d => d.name).join(', ');

            await api.createMeal({
                firebaseUid: user.uid,
                mealType: selectedMealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
                carbsEstimate: totalCarbs,
                description: dishNames.slice(0, 300),
                timestamp: mealData.loggedAt,
            });

            // Trigger a new 30-min forecast in the background after logging a meal
            try {
                await api.getGlucose30(user.uid, 'meal_log');
            } catch (forecastErr) {
                console.warn('Forecast refresh after meal log failed (non-critical):', forecastErr);
            }

            // Show success
            setIsSuccess(true);
            try { localStorage.setItem('bluely-data-logged', Date.now().toString()); } catch { /* non-critical */ }

            // Reset form after short delay
            setTimeout(() => {
                setSelectedMealType('');
                setSelectedDishes([]);
                setCustomDishNames({});
                setDishCarbLevels({});
                setNotes('');
                setIsSuccess(false);
            }, 2000);

        } catch (error) {
            console.error('Error logging meal:', error);
            setSubmitError('We could not save this meal. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getDishById = (id: string): CamerooniaDish | undefined => {
        return cameroonianDishes.find(d => d.id === id);
    };

    const visibleDishes = cameroonianDishes.filter(dish =>
        selectedDishes.includes(dish.id) || (dishSearch.trim()
            ? dish.name.toLowerCase().includes(dishSearch.trim().toLowerCase())
            : showAllDishes || cameroonianDishes.indexOf(dish) < 5)
    );

    return (
        <div className="mx-auto max-w-4xl space-y-5 pb-10">
            {/* Header */}
            <div className="pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5365b2] dark:text-[#aebdff]">Daily log</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#101b4b] dark:text-white">Log a meal</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose when you ate, then add the food.</p>
            </div>

            {/* Success Message */}
            {isSuccess && (
                <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                        <FiCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                        <span className="text-green-700 font-medium">Meal logged successfully!</span>
                        <p className="text-xs text-green-600 mt-0.5">Keep tracking for more accurate insights.</p>
                    </div>
                </div>
            )}

            <details className="rounded-2xl border border-[#e3e7f0] bg-white px-5 py-3 text-sm dark:border-white/10 dark:bg-[#1a1a1a]">
                <summary className="cursor-pointer font-medium text-[#1F2F98] dark:text-[#aebdff]">About carb estimates</summary>
                <p className="mt-3 leading-6 text-slate-600 dark:text-slate-300">The labels are rough guides. Portion and preparation change the amount of carbohydrate in a meal.</p>
            </details>

            {/* Step 1: Meal Type */}
            <Card className="rounded-[22px] border border-[#e3e7f0] bg-white shadow-none dark:border-white/10 dark:bg-[#1a1a1a]">
                <CardContent>
                    <h2 className="mb-3 text-base font-semibold text-[#101b4b] dark:text-white">When did you eat?</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {mealTypes.map((meal) => {
                            const Icon = meal.icon;
                            const isSelected = selectedMealType === meal.value;
                            return (
                                <button
                                    key={meal.value}
                                    type="button"
                                    onClick={() => setSelectedMealType(meal.value)}
                                    aria-pressed={isSelected}
                                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${isSelected
                                        ? 'border-[#1F2F98] bg-[#f3f5ff] text-[#1F2F98] dark:bg-[#1F2F98]/20 dark:text-white'
                                        : 'border-[#e3e7f0] text-slate-600 hover:border-[#9eaae0] dark:border-white/10 dark:text-slate-300'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{meal.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Optional meal description estimate */}
            <details className="rounded-[22px] border border-[#e3e7f0] bg-white dark:border-white/10 dark:bg-[#1a1a1a]">
                <summary className="cursor-pointer list-none px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="block text-sm font-semibold text-[#101b4b] dark:text-white">Prefer to describe your meal?</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">DiaBuddy can suggest an estimate for you to review.</span>
                </summary>
                <CardContent>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            type="text"
                            value={aiDescription}
                            onChange={(e) => setAiDescription(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiEstimate(); } }}
                            placeholder="e.g. A plate of rice with stew and fried plantain"
                            className="min-w-0 flex-1 rounded-xl border border-[#dfe4f0] bg-white px-4 py-3 text-sm focus:border-[#1F2F98] focus:outline-none dark:bg-[#222] dark:text-white"
                            disabled={aiEstimating}
                        />
                        <button
                            type="button"
                            onClick={handleAiEstimate}
                            disabled={!aiDescription.trim() || aiEstimating}
                            className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1F2F98] px-4 py-3 text-sm font-semibold text-white hover:bg-[#17257d] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {aiEstimating ? 'Estimating...' : 'Estimate carbs'}
                        </button>
                    </div>

                    {/* Thinking animation */}
                    {aiEstimating && (
                        <div role="status" className="mt-3 rounded-xl border border-[#e3e7f0] bg-[#f7f8fc] p-4 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative w-8 h-8 shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-[#1F2F98]/15 animate-pulse motion-reduce:animate-none" />
                                    <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center">
                                        <Image src="/diabuddy.png" alt="" width={22} height={22} className="rounded-full" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-[#1F2F98]">DiaBuddy is analysing your meal</p>
                                    <p className="text-xs text-slate-500">Review the estimate before saving.</p>
                                </div>
                                <span className="flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 bg-[#1F2F98] rounded-full animate-bounce motion-reduce:animate-none" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-[#1F2F98] rounded-full animate-bounce motion-reduce:animate-none" style={{ animationDelay: '120ms' }} />
                                    <span className="w-1.5 h-1.5 bg-[#1F2F98] rounded-full animate-bounce motion-reduce:animate-none" style={{ animationDelay: '240ms' }} />
                                </span>
                            </div>
                            <div className="h-1 bg-[#e3e7f0] rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-[#1F2F98] rounded-full animate-pulse motion-reduce:animate-none" />
                            </div>
                        </div>
                    )}

                    {aiResult && !aiParsed && !aiEstimating && <p role="alert" className="mt-3 text-sm text-slate-600 dark:text-slate-300">We couldn&apos;t produce a usable estimate. Try describing the portion and ingredients, or select dishes below.</p>}
                    {/* AI Result */}
                    {aiParsed !== null && !aiEstimating && (
                        <div className="mt-3 space-y-2.5">
                            {/* Per-item breakdown (shown when DiaBuddy returns structured data) */}
                            {aiBreakdown && aiBreakdown.length > 0 ? (
                                <div className="rounded-xl border border-indigo-100 overflow-hidden shadow-[0_2px_8px_rgba(99,102,241,0.10)]">
                                    {/* Breakdown header */}
                                    <div className="flex items-center gap-2 bg-[#101b4b] px-4 py-2.5">
                                        <Image src="/diabuddy.png" alt="" width={18} height={18} className="rounded-full opacity-90" />
                                        <p className="text-xs font-semibold text-white tracking-wide">Food Breakdown by DiaBuddy</p>
                                        <span className="ml-auto flex items-center gap-1 text-[10px] text-white/70">
                                            AI
                                        </span>
                                    </div>
                                    <div className="px-4 py-3 bg-linear-to-br from-indigo-50/80 via-violet-50/50 to-white space-y-2">
                                        {aiBreakdown.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700 font-medium">{item.item}</span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAiBreakdown(prev => {
                                                            if (!prev) return prev;
                                                            const updated = [...prev];
                                                            updated[idx] = { ...updated[idx], carbs: Math.max(0, updated[idx].carbs - 5) };
                                                            return updated;
                                                        })}
                                                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold text-sm"
                                                    >−</button>
                                                    <span className="font-bold text-[#1F2F98] min-w-10 text-center text-sm">{item.carbs}g</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAiBreakdown(prev => {
                                                            if (!prev) return prev;
                                                            const updated = [...prev];
                                                            updated[idx] = { ...updated[idx], carbs: updated[idx].carbs + 5 };
                                                            return updated;
                                                        })}
                                                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold text-sm"
                                                    >+</button>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Total row */}
                                        <div className="border-t border-indigo-100 pt-2 mt-1 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total</span>
                                            <span className="text-base font-bold text-[#1F2F98]">
                                                {aiBreakdown.reduce((s, i) => s + i.carbs, 0)}g carbs
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Fallback: plain response text when no structured breakdown returned */
                                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-sm text-gray-700">
                                    <div className="flex items-start gap-2">
                                        <Image src="/diabuddy.png" alt="" width={18} height={18} className="rounded-full mt-0.5 shrink-0" />
                                        <p className="leading-relaxed">{aiResult || 'Estimate ready — adjust the carbs below if needed.'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Live carb adjuster (only when no per-item breakdown — fallback path) */}
                            {aiParsed && !aiBreakdown && (
                                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[11px] font-semibold text-[#1F2F98] uppercase tracking-wide">Adjust estimate</p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${carbLevelConfig[aiParsed.carbLevel].bg} ${carbLevelConfig[aiParsed.carbLevel].color}`}>
                                            {carbLevelConfig[aiParsed.carbLevel].label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center rounded-xl border border-indigo-200 overflow-hidden bg-white shadow-sm">
                                            <button type="button" onClick={() => setAiAdjustedCarbs(c => Math.max(0, (c ?? aiParsed.carbsEstimate) - 5))}
                                                className="w-8 h-8 flex items-center justify-center text-[#1F2F98] hover:bg-indigo-50 text-base font-bold transition-colors">−</button>
                                            <span className="px-3 text-sm font-bold text-[#1F2F98] min-w-12 text-center">{aiAdjustedCarbs ?? aiParsed.carbsEstimate}g</span>
                                            <button type="button" onClick={() => setAiAdjustedCarbs(c => (c ?? aiParsed.carbsEstimate) + 5)}
                                                className="w-8 h-8 flex items-center justify-center text-[#1F2F98] hover:bg-indigo-50 text-base font-bold transition-colors">+</button>
                                        </div>
                                        <span className="text-xs text-gray-500">per 5g carbs · tap to fine-tune</span>
                                    </div>
                                </div>
                            )}

                            {/* Refinement follow-up */}
                            {aiParsed && (
                                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Refine with DiaBuddy</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={aiRefinement}
                                            onChange={e => setAiRefinement(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAiRefine(); } }}
                                            placeholder="e.g. I had 2 cups of rice, not 1"
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/15 bg-white"
                                            disabled={aiRefining}
                                        />
                                        <button type="button" onClick={handleAiRefine}
                                            disabled={!aiRefinement.trim() || aiRefining}
                                            className="flex items-center gap-1 rounded-xl bg-[#1F2F98] px-3 py-2 text-xs font-semibold text-white hover:bg-[#17257d] disabled:opacity-40">
                                            {aiRefining ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSend className="w-3 h-3" />}
                                            Refine
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Accept button */}
                            {aiParsed && selectedMealType && (
                                <button
                                    type="button"
                                    onClick={handleAiAccept}
                                    disabled={aiLogging}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F2F98] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#17257d] disabled:opacity-50"
                                >
                                    {aiLogging ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <FiCheck className="w-4 h-4" />
                                    )}
                                    Accept {aiBreakdown ? aiBreakdown.reduce((s, i) => s + i.carbs, 0) : (aiAdjustedCarbs ?? aiParsed?.carbsEstimate)}g &amp; Log Meal
                                </button>
                            )}
                            {aiParsed && !selectedMealType && (
                                <p className="text-xs text-amber-600 px-1">Select a meal type above to accept this estimate.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </details>

            {/* Step 2: Select Foods */}
            <Card className="rounded-[22px] border border-[#e3e7f0] bg-white shadow-none dark:border-white/10 dark:bg-[#1a1a1a]">
                <CardContent>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div><h2 className="text-base font-semibold text-[#101b4b] dark:text-white">What did you eat?</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select a dish or add your own.</p></div>
                        {selectedDishes.length > 0 && <p className="text-xs font-medium text-[#1F2F98] dark:text-[#aebdff]">{selectedDishes.length} selected</p>}
                    </div>
                    <input type="search" value={dishSearch} onChange={event => setDishSearch(event.target.value)} placeholder="Find a dish" aria-label="Find a dish" className="mb-3 w-full rounded-xl border border-[#dfe4f0] bg-white px-4 py-3 text-sm focus:border-[#1F2F98] focus:outline-none dark:border-white/15 dark:bg-[#222] dark:text-white" />

                    <div className="grid gap-2 sm:grid-cols-2">
                        {visibleDishes.map((dish) => {
                            const isSelected = selectedDishes.includes(dish.id);
                            const config = carbLevelConfig[dish.carbLevel];

                            return (
                                <button type="button"
                                    key={dish.id}
                                    aria-pressed={isSelected}
                                    className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${isSelected
                                        ? 'border-[#1F2F98] bg-[#f3f5ff] dark:bg-[#1F2F98]/20'
                                        : 'border-[#e3e7f0] hover:border-[#9eaae0] dark:border-white/10'
                                        }`}
                                    onClick={() => handleDishSelect(dish)}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isSelected ? 'border-[#1F2F98] bg-[#1F2F98]' : 'border-slate-300'
                                            }`}>
                                            {isSelected && <FiCheck className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium leading-tight text-[#101b4b] dark:text-white">{dish.name}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">{dish.description}</p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{config.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    {!dishSearch && !showAllDishes && <button type="button" onClick={() => setShowAllDishes(true)} className="mt-3 text-sm font-semibold text-[#1F2F98] hover:underline dark:text-[#aebdff]">Browse all dishes</button>}
                    {dishSearch && visibleDishes.length === 0 && <p className="py-3 text-sm text-slate-500">No dish found. Add it below.</p>}

                    {/* Custom Dish Input */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="mb-2 text-sm font-medium text-[#101b4b] dark:text-white">Add your own dish</p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                                type="text"
                                value={customDish}
                                onChange={(e) => setCustomDish(e.target.value)}
                                placeholder="Dish name"
                                className="min-w-0 flex-1 rounded-xl border border-[#dfe4f0] px-4 py-3 text-sm focus:border-[#1F2F98] focus:outline-none dark:bg-[#222] dark:text-white"
                            />
                            <select
                                value={customCarbLevel}
                                onChange={(e) => setCustomCarbLevel(e.target.value as CarbLevel)}
                                aria-label="Estimated carb level"
                                className="rounded-xl border border-[#dfe4f0] px-3 py-3 text-sm focus:border-[#1F2F98] focus:outline-none dark:bg-[#222] dark:text-white"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAddCustomDish}
                                disabled={!customDish.trim()}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Selected Dishes with Editable Carb Levels + Notes — combined */}
            {selectedDishes.length > 0 && (
                <Card className="rounded-[22px] border border-[#e3e7f0] bg-white shadow-none dark:border-white/10 dark:bg-[#1a1a1a]">
                    <CardContent>
                        <h2 className="mb-1 text-base font-semibold text-[#101b4b] dark:text-white">Review your meal</h2>
                        <p className="mb-4 text-xs text-slate-500">Adjust the rough carb label if needed.</p>
                        <div className="space-y-2">
                            {selectedDishes.map((dishId) => {
                                const dish = getDishById(dishId);
                                const currentLevel = dishCarbLevels[dishId] || 'medium';
                                const name = dish?.name || customDishNames[dishId] || 'Custom dish';

                                return (
                                    <div key={dishId} className="flex flex-col gap-3 rounded-xl bg-[#f7f8fc] p-3 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                aria-label={`Remove ${name}`}
                                                onClick={() => {
                                                    setSelectedDishes(prev => prev.filter(id => id !== dishId));
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <FiX className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-sm font-medium text-[#101b4b] dark:text-white">{name}</span>
                                        </div>
                                        <div className="flex gap-1" role="group" aria-label={`${name} carb level`}>
                                            {(['low', 'medium', 'high'] as CarbLevel[]).map((level) => {
                                                const config = carbLevelConfig[level];
                                                const isActive = currentLevel === level;
                                                return (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        aria-pressed={isActive}
                                                        onClick={() => handleCarbLevelChange(dishId, level)}
                                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${isActive
                                                            ? `${config.bg} ${config.color} ${config.border} border`
                                                            : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Notes inline */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes about this meal..."
                                rows={2}
                                className="w-full rounded-xl border border-[#dfe4f0] px-4 py-3 text-sm focus:border-[#1F2F98] focus:outline-none dark:bg-[#222] dark:text-white"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Submit Button */}
            {submitError && <p role="alert" className="text-sm text-rose-700">{submitError}</p>}
            <div className="flex flex-col gap-3 sm:flex-row *:w-full sm:*:w-auto">
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedMealType || selectedDishes.length === 0 || isLoading}
                    isLoading={isLoading}
                    className="flex-1 bg-[#1F2F98] hover:bg-[#17257d]"
                >
                    <FiCheck className="w-4 h-4 mr-2" />
                    Log Meal
                </Button>
                <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                >
                    Cancel
                </Button>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 text-center pb-4">
                Carb levels shown are estimates based on typical preparations.
                Actual values may vary by portion and method.
            </p>
        </div>
    );
}
