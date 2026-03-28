'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, Button } from '@/components/ui';
import { FiCoffee, FiSun, FiMoon, FiCheck, FiInfo, FiX, FiPlusCircle, FiSend, FiZap } from 'react-icons/fi';
import { IoFastFoodOutline } from 'react-icons/io5';

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
    const [dishCarbLevels, setDishCarbLevels] = useState<Record<string, CarbLevel>>({});
    const [customDish, setCustomDish] = useState('');
    const [customCarbLevel, setCustomCarbLevel] = useState<CarbLevel>('medium');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
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
                setAiParsed(parsed ?? { carbsEstimate: 0, carbLevel: 'low', description: aiDescription });
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

            // Create meal log entry (in a real app, this would call an API)
            const mealData = {
                firebaseUid: user.uid,
                mealType: selectedMealType,
                dishes: selectedDishes.map(id => {
                    const dish = cameroonianDishes.find(d => d.id === id);
                    return {
                        id,
                        name: dish?.name || id.replace('custom-', 'Custom: '),
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
                setDishCarbLevels({});
                setNotes('');
                setIsSuccess(false);
            }, 2000);

        } catch (error) {
            console.error('Error logging meal:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDishById = (id: string): CamerooniaDish | undefined => {
        return cameroonianDishes.find(d => d.id === id);
    };

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <IoFastFoodOutline className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Log a Meal</h1>
                    <p className="text-sm text-gray-500">Track what you eat to understand glucose effects</p>
                </div>
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

            {/* Info + Carb Legend — combined */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-blue-50/50">
                <CardContent>
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => setShowTooltip(!showTooltip)}
                            className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 hover:bg-blue-200 transition-colors"
                        >
                            <FiInfo className="w-4 h-4 text-blue-600" />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900 text-sm">What are carbohydrates?</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] text-gray-500">Low</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-[10px] text-gray-500">Med</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] text-gray-500">High</span></div>
                                </div>
                            </div>
                            {showTooltip && (
                                <div className="mt-2 space-y-2">
                                    <p className="text-sm text-gray-600">
                                        Carbohydrates are foods that give your body energy, such as rice, fufu, garri, plantain, and yam.
                                        These foods can raise blood glucose levels, especially when eaten in large portions.
                                    </p>
                                    <p className="text-xs text-blue-700 pt-1 border-t border-blue-100">
                                        Bluely uses carb levels (low, medium, high) instead of exact numbers to keep meal tracking simple.
                                    </p>
                                    <button onClick={() => setShowTooltip(false)} className="text-xs text-blue-600 hover:underline">Hide details</button>
                                </div>
                            )}
                            {!showTooltip && (
                                <button onClick={() => setShowTooltip(true)} className="text-xs text-blue-600 hover:underline mt-1">Learn more</button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 1: Meal Type */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <CardContent>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">1. Select meal type</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {mealTypes.map((meal) => {
                            const Icon = meal.icon;
                            const isSelected = selectedMealType === meal.value;
                            return (
                                <button
                                    key={meal.value}
                                    onClick={() => setSelectedMealType(meal.value)}
                                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${isSelected
                                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-500'
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 ${isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-xs font-medium ${isSelected ? 'text-orange-700' : 'text-gray-600'}`}>{meal.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* AI Meal Description */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-linear-to-br from-[#1F2F98]/3 via-indigo-50/20 to-purple-50/10">
                <CardContent>
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="relative w-9 h-9 shrink-0">
                            <div className="absolute inset-0 rounded-full bg-linear-to-br from-[#1F2F98] to-indigo-400 opacity-20 animate-pulse" />
                            <Image src="/diabuddy.png" alt="DiaBuddy" width={36} height={36} className="rounded-full relative z-10" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Describe your meal to DiaBuddy</h3>
                            <p className="text-[11px] text-gray-400">AI estimates carbs and you can refine in real-time</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={aiDescription}
                            onChange={(e) => setAiDescription(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiEstimate(); } }}
                            placeholder="e.g. A plate of rice with stew and fried plantain"
                            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/15 focus:border-[#1F2F98]/30 bg-white"
                            disabled={aiEstimating}
                        />
                        <button
                            type="button"
                            onClick={handleAiEstimate}
                            disabled={!aiDescription.trim() || aiEstimating}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.03] hover:shadow-[0_4px_16px_rgba(79,70,229,0.4)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shrink-0"
                            style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}
                        >
                            <FiZap className={`w-4 h-4 ${aiDescription.trim() && !aiEstimating ? 'animate-pulse' : ''}`} />
                            {aiEstimating ? 'Analysing...' : 'AI Estimate'}
                        </button>
                    </div>

                    {/* Thinking animation */}
                    {aiEstimating && (
                        <div className="mt-3 p-4 bg-linear-to-br from-[#1F2F98]/5 via-indigo-50/60 to-purple-50/40 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative w-8 h-8 shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-linear-to-br from-[#1F2F98] via-indigo-500 to-purple-500 animate-pulse opacity-80" />
                                    <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center">
                                        <Image src="/diabuddy.png" alt="" width={22} height={22} className="rounded-full" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-[#1F2F98]">DiaBuddy is analysing your meal</p>
                                    <p className="text-[10px] text-indigo-400">Estimating carbohydrate content...</p>
                                </div>
                                <span className="flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 bg-[#1F2F98] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                                </span>
                            </div>
                            <div className="h-1 bg-indigo-100 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-linear-to-r from-[#1F2F98] via-indigo-400 to-purple-400 rounded-full animate-pulse" />
                            </div>
                        </div>
                    )}

                    {/* AI Result */}
                    {aiResult && !aiEstimating && (
                        <div className="mt-3 space-y-2.5">
                            {/* Per-item breakdown (shown when DiaBuddy returns structured data) */}
                            {aiBreakdown && aiBreakdown.length > 0 ? (
                                <div className="rounded-xl border border-indigo-100 overflow-hidden shadow-[0_2px_8px_rgba(99,102,241,0.10)]">
                                    {/* Breakdown header */}
                                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}>
                                        <Image src="/diabuddy.png" alt="" width={18} height={18} className="rounded-full opacity-90" />
                                        <p className="text-xs font-semibold text-white tracking-wide">Food Breakdown by DiaBuddy</p>
                                        <span className="ml-auto flex items-center gap-1 text-[10px] text-white/70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                                        <p className="leading-relaxed">{aiResult}</p>
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
                                            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
                                            style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}>
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
                                    className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            </Card>

            {/* Step 2: Select Foods */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <CardContent>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">2. What did you eat?</h3>
                    <p className="text-xs text-gray-400 mb-3">Select dishes. Carb estimates are for guidance only.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {cameroonianDishes.map((dish) => {
                            const isSelected = selectedDishes.includes(dish.id);
                            const config = carbLevelConfig[dish.carbLevel];

                            return (
                                <div
                                    key={dish.id}
                                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${isSelected
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => handleDishSelect(dish)}
                                >
                                    <div className="flex items-center space-x-2.5">
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <FiCheck className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                        {dish.imageUrl ? (
                                            <img
                                                src={dish.imageUrl}
                                                alt={dish.name}
                                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
                                                <IoFastFoodOutline className="w-5 h-5 text-orange-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm leading-tight">{dish.name}</p>
                                            <p className="text-[10px] text-gray-400">{dish.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`}></div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Custom Dish Input */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Add something else</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customDish}
                                onChange={(e) => setCustomDish(e.target.value)}
                                placeholder="Dish name"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <select
                                value={customCarbLevel}
                                onChange={(e) => setCustomCarbLevel(e.target.value as CarbLevel)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <CardContent>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">3. Adjust carbs & add notes</h3>
                        <p className="text-xs text-gray-400 mb-3">Adjust based on your portion size.</p>
                        <div className="space-y-2">
                            {selectedDishes.map((dishId) => {
                                const dish = getDishById(dishId);
                                const currentLevel = dishCarbLevels[dishId] || 'medium';
                                const name = dish?.name || dishId.replace('custom-', '');

                                return (
                                    <div key={dishId} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedDishes(prev => prev.filter(id => id !== dishId));
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <FiX className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="font-medium text-gray-900 text-sm">{name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {(['low', 'medium', 'high'] as CarbLevel[]).map((level) => {
                                                const config = carbLevelConfig[level];
                                                const isActive = currentLevel === level;
                                                return (
                                                    <button
                                                        key={level}
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 *:w-full sm:*:w-auto">
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedMealType || selectedDishes.length === 0 || isLoading}
                    isLoading={isLoading}
                    className="flex-1 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
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
