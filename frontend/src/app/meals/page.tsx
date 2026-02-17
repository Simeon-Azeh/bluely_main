'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, Button } from '@/components/ui';
import { FiCoffee, FiSun, FiMoon, FiCheck, FiInfo, FiX, FiPlusCircle } from 'react-icons/fi';
import { IoFastFoodOutline } from 'react-icons/io5';

// Carb level types
type CarbLevel = 'low' | 'medium' | 'high';

interface CamerooniaDish {
    id: string;
    name: string;
    carbLevel: CarbLevel;
    description: string;
}

const cameroonianDishes: CamerooniaDish[] = [
    { id: 'fufu-eru', name: 'Fufu & Eru', carbLevel: 'high', description: 'Cassava-based' },
    { id: 'fufu-corn-njama', name: 'Fufu Corn & Njama Njama', carbLevel: 'high', description: 'Maize' },
    { id: 'garri-eru', name: 'Garri & Eru', carbLevel: 'high', description: 'Processed cassava' },
    { id: 'rice-stew', name: 'Rice & Stew', carbLevel: 'high', description: 'Refined carbs' },
    { id: 'plantain', name: 'Plantain (Boiled/Fried)', carbLevel: 'medium', description: 'Starchy' },
    { id: 'beans-plantain', name: 'Beans & Plantain', carbLevel: 'medium', description: 'Fiber reduces spike' },
    { id: 'yam', name: 'Yam (Boiled)', carbLevel: 'high', description: 'Starchy' },
    { id: 'achu', name: 'Achu', carbLevel: 'high', description: 'Pounded cocoyam' },
    { id: 'koki-beans', name: 'Koki Beans', carbLevel: 'medium', description: 'Legumes' },
    { id: 'okra-soup', name: 'Okra Soup (without fufu)', carbLevel: 'low', description: 'Mostly vegetables' },
    { id: 'fish-meat-eggs', name: 'Fish / Meat / Eggs', carbLevel: 'low', description: 'Protein' },
    { id: 'ndole', name: 'Ndolé (without starch)', carbLevel: 'low', description: 'Leafy vegetables' },
    { id: 'pepper-soup', name: 'Pepper Soup', carbLevel: 'low', description: 'Broth-based' },
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

            // For now, just show success (API integration would go here)
            setIsSuccess(true);

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
        <div className="space-y-5 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <IoFastFoodOutline className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Log a Meal</h1>
                    <p className="text-sm text-gray-500">Track what you eat to understand glucose effects</p>
                </div>
            </div>

            {/* Success Message */}
            {isSuccess && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
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
                    <div className="grid grid-cols-4 gap-2">
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

            {/* Step 2: Select Foods */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <CardContent>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">2. What did you eat?</h3>
                    <p className="text-xs text-gray-400 mb-3">Select dishes. Carb estimates are for guidance only.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
            <div className="flex gap-3">
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedMealType || selectedDishes.length === 0 || isLoading}
                    isLoading={isLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
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
