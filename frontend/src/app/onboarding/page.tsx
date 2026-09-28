'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiArrowLeft, FiCheck, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import AuthAction from '@/components/auth/AuthAction';
import AuthField from '@/components/auth/AuthField';
import styles from '@/components/auth/AuthStep.module.css';
import api from '@/lib/api';

type Option = { value: string; label: string; detail?: string };

const steps = ['Welcome', 'About you', 'Glucose', 'Everyday life', 'Review'];
const diabetesTypes: Option[] = [
    { value: 'type1', label: 'Type 1' },
    { value: 'type2', label: 'Type 2' },
    { value: 'gestational', label: 'Gestational' },
    { value: 'not_sure', label: 'Not sure yet' },
];
const ageRanges: Option[] = [
    { value: '16-17', label: '16 to 17' },
    { value: '18-25', label: '18 to 25' },
    { value: '26-35', label: '26 to 35' },
    { value: '36-45', label: '36 to 45' },
    { value: '46-55', label: '46 to 55' },
    { value: '56-65', label: '56 to 65' },
    { value: '65+', label: '65+' },
];
const genderOptions: Option[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
const monitoringMethods: Option[] = [
    { value: 'finger_prick', label: 'Finger-prick meter', detail: 'I check with a meter and test strips.' },
    { value: 'cgm', label: 'Continuous glucose monitor', detail: 'I use a wearable sensor.' },
];
const unitOptions: Option[] = [
    { value: 'mg/dL', label: 'mg/dL' },
    { value: 'mmol/L', label: 'mmol/L' },
];
const readingsPerDayOptions: Option[] = [
    { value: '1', label: 'Around once' },
    { value: '2', label: 'Around twice' },
    { value: '3+', label: 'Three or more' },
];
const activityLevelOptions: Option[] = [
    { value: 'low', label: 'Mostly gentle' },
    { value: 'moderate', label: 'A mix of movement' },
    { value: 'high', label: 'Often active' },
];

interface OnboardingData {
    ageRange: string;
    gender: string;
    diabetesType: string;
    diagnosisYear: string;
    monitoringMethod: string;
    preferredUnit: string;
    readingsPerDay: string;
    activityLevel: string;
    trackMood: boolean;
    trackSleep: boolean;
    targetGlucoseMin: string;
    targetGlucoseMax: string;
}

const MMOL_FACTOR = 18.0182;
const currentYear = new Date().getFullYear();

function convertedValue(value: string, from: string, to: string): string {
    const number = Number(value);
    if (!value || !Number.isFinite(number) || from === to) return value;
    return to === 'mmol/L'
        ? (Math.round(number / MMOL_FACTOR * 10) / 10).toString()
        : Math.round(number * MMOL_FACTOR).toString();
}

function ChoiceGroup({ name, label, options, value, onChange, columns = 2 }: {
    name: string;
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    columns?: 2 | 3;
}) {
    return (
        <fieldset>
            <legend className="mb-3 text-sm font-semibold text-[#344463]">{label}</legend>
            <div className={`grid gap-3 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {options.map((option) => (
                    <label key={option.value} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-4 transition-[border-color,background-color,box-shadow] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1F2F98] ${value === option.value ? 'border-[#1F2F98] bg-[#eef2ff] shadow-[0_0_0_1px_rgba(31,47,152,0.15)]' : 'border-[#d4deef] bg-[#ffffff] hover:border-[#9eadd1]'}`}>
                        <span className="min-w-0"><span className="block text-sm font-semibold text-[#172853]">{option.label}</span>{option.detail && <span className="mt-1 block text-xs leading-[1.5] text-[#647396]">{option.detail}</span>}</span>
                        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="sr-only" />
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${value === option.value ? 'border-[#1F2F98] bg-[#1F2F98] text-white' : 'border-[#afbbd3] text-transparent'}`} aria-hidden="true"><FiCheck className="h-3 w-3" /></span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

function OnboardingSelect({ id, label, value, options, placeholder, onChange }: {
    id: string;
    label: string;
    value: string;
    options: Option[];
    placeholder: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-2.5 block text-sm font-semibold text-[#344463]">{label}</label>
            <div className="relative">
                <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-14 w-full appearance-none rounded-2xl border border-[#cbd6ed] bg-[#ffffff] px-4 py-3.5 pr-11 text-base text-[#172853] shadow-[0_8px_25px_rgba(24,43,94,0.04)] outline-none transition-[border-color,box-shadow] hover:border-[#9eadd1] focus:border-[#1F2F98] focus:shadow-[0_0_0_4px_rgba(87,107,214,0.12)]">
                    <option value="">{placeholder}</option>
                    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <FiChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8293ba]" />
            </div>
        </div>
    );
}

function TrackingOption({ id, title, description, checked, onChange }: {
    id: string;
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label htmlFor={id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition-colors ${checked ? 'border-[#1F2F98] bg-[#eef2ff]' : 'border-[#d4deef] bg-[#ffffff] hover:border-[#9eadd1]'}`}>
            <span><span className="block text-sm font-semibold text-[#172853]">{title}</span><span className="mt-1 block text-xs leading-[1.5] text-[#647396]">{description}</span></span>
            <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 shrink-0 accent-[#1F2F98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2F98]" />
        </label>
    );
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
    return (
        <div className="mb-9">
            <p className="text-xs font-bold tracking-[0.17em] text-[#1F2F98]">{eyebrow}</p>
            <h1 className="mt-4 text-[clamp(2.35rem,4vw,4.15rem)] font-semibold leading-[1.1] tracking-[-0.055em] text-[#172853]">{title}</h1>
            <p className="mt-4 max-w-[610px] text-base leading-[1.75] text-[#52617d] sm:text-lg">{description}</p>
        </div>
    );
}

function optionLabel(options: Option[], value: string, fallback = 'Not selected') {
    return options.find((option) => option.value === value)?.label ?? fallback;
}

export default function OnboardingPage() {
    const { user, refreshUserProfile } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [yearError, setYearError] = useState<string | null>(null);
    const [rangeError, setRangeError] = useState<string | null>(null);
    const [formData, setFormData] = useState<OnboardingData>({
        ageRange: '',
        gender: '',
        diabetesType: '',
        diagnosisYear: '',
        monitoringMethod: '',
        preferredUnit: 'mg/dL',
        readingsPerDay: '',
        activityLevel: '',
        trackMood: false,
        trackSleep: false,
        targetGlucoseMin: '70',
        targetGlucoseMax: '180',
    });

    const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'there';
    const updateFormData = (field: keyof OnboardingData, value: string | boolean) => {
        setFormData((current) => ({ ...current, [field]: value }));
        if (field === 'diagnosisYear') setYearError(null);
        if (field === 'targetGlucoseMin' || field === 'targetGlucoseMax') setRangeError(null);
    };
    const changeUnit = (unit: string) => {
        setFormData((current) => ({
            ...current,
            preferredUnit: unit,
            targetGlucoseMin: convertedValue(current.targetGlucoseMin, current.preferredUnit, unit),
            targetGlucoseMax: convertedValue(current.targetGlucoseMax, current.preferredUnit, unit),
        }));
        setRangeError(null);
    };
    const handleNext = () => {
        if (step === 2 && formData.diagnosisYear) {
            const year = Number(formData.diagnosisYear);
            if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
                setYearError(`Enter a year from 1900 to ${currentYear}.`);
                return;
            }
        }
        setError(null);
        setStep((current) => Math.min(current + 1, steps.length));
    };
    const handleBack = () => {
        setError(null);
        setStep((current) => Math.max(current - 1, 1));
    };
    const handleComplete = async () => {
        const min = Number(formData.targetGlucoseMin);
        const max = Number(formData.targetGlucoseMax);
        const minMg = formData.preferredUnit === 'mmol/L' ? Math.round(min * MMOL_FACTOR) : Math.round(min);
        const maxMg = formData.preferredUnit === 'mmol/L' ? Math.round(max * MMOL_FACTOR) : Math.round(max);
        if (!formData.targetGlucoseMin || !formData.targetGlucoseMax || !Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= min || minMg >= maxMg) {
            setRangeError('Enter a valid low and high value, with the low value below the high value.');
            return;
        }
        if (!user) {
            setError('Your session has ended. Please sign in again to finish setup.');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await api.updateUser(user.uid, {
                ageRange: formData.ageRange,
                gender: formData.gender,
                diabetesType: formData.diabetesType,
                diagnosisYear: formData.diagnosisYear ? Number(formData.diagnosisYear) : undefined,
                monitoringMethod: formData.monitoringMethod || undefined,
                preferredUnit: formData.preferredUnit,
                readingsPerDay: formData.readingsPerDay || undefined,
                activityLevel: formData.activityLevel || undefined,
                trackMood: formData.trackMood,
                trackSleep: formData.trackSleep,
                targetGlucoseMin: minMg,
                targetGlucoseMax: maxMg,
                onboardingCompleted: true,
            }, await user.getIdToken());
            await refreshUserProfile();
            router.push('/dashboard');
        } catch {
            setError('We could not save your setup. Check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8ff] text-[#172853]">
            <div className="grid min-h-screen lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
                <aside className="relative flex min-h-[235px] flex-col justify-between overflow-hidden bg-[#172853] px-6 pb-8 pt-7 text-white sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:px-14 lg:pb-12 lg:pt-12">
                    <div className="pointer-events-none absolute -right-36 -top-24 h-[420px] w-[420px] rounded-full border border-[#b9cbff]/20" aria-hidden="true" />
                    <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full bg-linear-to-t from-[#0c1b43] to-transparent" aria-hidden="true" />
                    <Link href="/" className="relative z-10 w-fit text-3xl font-semibold tracking-[-0.08em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-4xl">BLUELY</Link>
                    <div className="relative z-10 mt-9 max-w-[500px] lg:my-auto">
                        <p className="text-xs font-bold tracking-[0.18em] text-[#b9cbff]">YOUR BLUELY SPACE</p>
                        <h2 className="mt-4 text-[clamp(2.15rem,4.3vw,4.6rem)] font-semibold leading-[1.08] tracking-[-0.06em]">A clearer picture starts with you.</h2>
                        <p className="mt-5 max-w-[430px] text-sm leading-[1.7] text-[#d6def2] sm:text-base">Bring your readings and everyday routines into one place, at your own pace.</p>
                        <ol className="mt-12 hidden space-y-0 lg:block" aria-label="Onboarding steps">
                            {steps.map((name, index) => <li key={name} className={`flex items-center gap-4 border-t border-white/20 py-3.5 text-sm ${step === index + 1 ? 'text-white' : 'text-[#aebde0]'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step > index + 1 ? 'bg-white/20' : step === index + 1 ? 'bg-white text-[#1F2F98]' : 'border border-white/30'}`}>{step > index + 1 ? <FiCheck aria-label="Completed" /> : `0${index + 1}`}</span><span className="font-semibold">{name}</span>{step === index + 1 && <span className="ml-auto text-[10px] font-bold tracking-[0.15em] text-[#b9cbff]">CURRENT</span>}</li>)}
                        </ol>
                    </div>
                    <p className="relative z-10 hidden text-xs leading-[1.6] text-[#b9cbff] lg:block">Built for real life in Africa.</p>
                </aside>

                <main className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-20">
                    <div className="w-full max-w-[670px]">
                        <div className="mb-10 flex items-end justify-between border-b border-[#d1dced] pb-5">
                            <div><p className="text-xs font-bold tracking-[0.16em] text-[#1F2F98]">SETUP</p><p className="mt-1 text-sm font-semibold text-[#52617d]">{steps[step - 1]}</p></div>
                            <p className="text-sm font-bold text-[#1F2F98]">0{step} <span className="text-[#94a2bd]">/ 0{steps.length}</span></p>
                        </div>
                        <div className="mb-10 grid grid-cols-5 gap-2" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step} aria-valuetext={`Step ${step} of ${steps.length}: ${steps[step - 1]}`}>{steps.map((name, index) => <span key={name} className={`h-1.5 rounded-full transition-colors duration-300 ${index < step ? 'bg-[#1F2F98]' : 'bg-[#d7e0f1]'}`} />)}</div>

                        <div key={step} className={styles.step}>
                            {step === 1 && <>
                                <StepHeading eyebrow="LET'S BEGIN" title={`Welcome, ${firstName}.`} description="A few details will help us shape your Bluely space. You can change your choices later in Settings." />
                                <div className="border-l-[3px] border-[#1F2F98] bg-[#eef2fc] px-5 py-5 text-base leading-[1.7] text-[#344463]">Bluely is here to help you notice patterns and understand the context around your numbers.</div>
                            </>}
                            {step === 2 && <>
                                <StepHeading eyebrow="01 / ABOUT YOU" title="Tell us a little about you." description="Share what you are comfortable with. These details help us make your space feel more relevant." />
                                <div className="space-y-7">
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <OnboardingSelect id="age-range" label="Age range (optional)" value={formData.ageRange} options={ageRanges} placeholder="Choose an age range" onChange={(value) => updateFormData('ageRange', value)} />
                                        <OnboardingSelect id="gender" label="Gender (optional)" value={formData.gender} options={genderOptions} placeholder="Choose if you wish" onChange={(value) => updateFormData('gender', value)} />
                                    </div>
                                    <ChoiceGroup name="diabetes-type" label="Diabetes type (optional)" options={diabetesTypes} value={formData.diabetesType} onChange={(value) => updateFormData('diabetesType', value)} />
                                    <AuthField id="diagnosis-year" label="Year of diagnosis (optional)" type="number" inputMode="numeric" min={1900} max={currentYear} placeholder="e.g. 2020" value={formData.diagnosisYear} onChange={(event) => updateFormData('diagnosisYear', event.target.value)} error={yearError ?? undefined} />
                                </div>
                            </>}
                            {step === 3 && <>
                                <StepHeading eyebrow="02 / GLUCOSE" title="How do you check your glucose?" description="Choose what feels familiar. You can update your method and units later." />
                                <div className="space-y-7">
                                    <ChoiceGroup name="monitoring-method" label="Your usual method (optional)" options={monitoringMethods} value={formData.monitoringMethod} onChange={(value) => updateFormData('monitoringMethod', value)} />
                                    <ChoiceGroup name="preferred-unit" label="The unit you use" options={unitOptions} value={formData.preferredUnit} onChange={changeUnit} />
                                    <ChoiceGroup name="readings-per-day" label="About how often do you check in a day? (optional)" options={readingsPerDayOptions} value={formData.readingsPerDay} onChange={(value) => updateFormData('readingsPerDay', value)} columns={3} />
                                    <p className="text-sm leading-[1.7] text-[#647396]">Your care team can help you decide when and how often to check.</p>
                                </div>
                            </>}
                            {step === 4 && <>
                                <StepHeading eyebrow="03 / EVERYDAY LIFE" title="What else would you like to notice?" description="Choose the details you want to keep alongside your readings. There is no right way to use Bluely." />
                                <div className="space-y-7">
                                    <ChoiceGroup name="activity-level" label="How active are your days, generally? (optional)" options={activityLevelOptions} value={formData.activityLevel} onChange={(value) => updateFormData('activityLevel', value)} columns={3} />
                                    <fieldset><legend className="mb-3 text-sm font-semibold text-[#344463]">Optional notes</legend><div className="space-y-3">
                                        <TrackingOption id="track-mood" title="Mood and stress" description="Keep a note of how you feel." checked={formData.trackMood} onChange={(value) => updateFormData('trackMood', value)} />
                                        <TrackingOption id="track-sleep" title="Sleep" description="See sleep alongside the rest of your day." checked={formData.trackSleep} onChange={(value) => updateFormData('trackSleep', value)} />
                                    </div></fieldset>
                                </div>
                            </>}
                            {step === 5 && <>
                                <StepHeading eyebrow="04 / REVIEW" title="Ready when you are." description="Take a look at your choices. You can revisit them in Settings at any time." />
                                <dl className="border-y border-[#cbd6ed] text-sm">
                                    <div className="flex justify-between gap-5 border-b border-[#dbe3f2] py-4"><dt className="text-[#647396]">Diabetes type</dt><dd className="font-semibold text-[#172853]">{optionLabel(diabetesTypes, formData.diabetesType)}</dd></div>
                                    <div className="flex justify-between gap-5 border-b border-[#dbe3f2] py-4"><dt className="text-[#647396]">Glucose checks</dt><dd className="font-semibold text-[#172853]">{optionLabel(monitoringMethods, formData.monitoringMethod)}</dd></div>
                                    <div className="flex justify-between gap-5 border-b border-[#dbe3f2] py-4"><dt className="text-[#647396]">Units</dt><dd className="font-semibold text-[#172853]">{formData.preferredUnit}</dd></div>
                                    <div className="flex justify-between gap-5 py-4"><dt className="text-[#647396]">Extra notes</dt><dd className="text-right font-semibold text-[#172853]">{[formData.trackMood && 'Mood', formData.trackSleep && 'Sleep'].filter(Boolean).join(' and ') || 'None selected'}</dd></div>
                                </dl>
                                <div className="mt-8">
                                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#172853]">Your glucose range in Bluely</h2>
                                    <p className="mt-2 text-sm leading-[1.7] text-[#52617d]">Bluely starts with a general range for organizing readings. Your care team can help you set a range that fits your own care plan.</p>
                                    <div className="mt-5 grid grid-cols-2 gap-4">
                                        <AuthField id="target-min" label={`Low (${formData.preferredUnit})`} type="number" min="0" step={formData.preferredUnit === 'mmol/L' ? '0.1' : '1'} value={formData.targetGlucoseMin} onChange={(event) => updateFormData('targetGlucoseMin', event.target.value)} />
                                        <AuthField id="target-max" label={`High (${formData.preferredUnit})`} type="number" min="0" step={formData.preferredUnit === 'mmol/L' ? '0.1' : '1'} value={formData.targetGlucoseMax} onChange={(event) => updateFormData('targetGlucoseMax', event.target.value)} />
                                    </div>
                                    {rangeError && <p className="mt-3 text-sm text-[#a32626]" role="alert">{rangeError}</p>}
                                </div>
                            </>}
                        </div>

                        {error && <div className="mt-7 rounded-2xl border border-[#e9baba] bg-[#fff5f5] px-4 py-3 text-sm text-[#a32626]" role="alert">{error}</div>}
                        <div className="mt-10 flex gap-3 border-t border-[#d1dced] pt-7">
                            {step > 1 && <button type="button" onClick={handleBack} disabled={isLoading} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#cbd6ed] bg-[#ffffff] px-5 text-sm font-bold text-[#26375f] transition-colors hover:border-[#9eadd1] hover:bg-[#f8faff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] disabled:opacity-60"><FiArrowLeft aria-hidden="true" /> Back</button>}
                            <AuthAction type="button" onClick={step === steps.length ? handleComplete : handleNext} loading={isLoading} className="flex-1">{isLoading ? 'Saving your space...' : step === steps.length ? 'Start with Bluely' : step === 1 ? "Let's get started" : 'Continue'}</AuthAction>
                        </div>
                        <p className="mt-5 text-xs leading-[1.6] text-[#71809d]">Bluely supports understanding and tracking. <Link href="/medical-disclaimer" className="font-semibold text-[#1F2F98] underline underline-offset-2">Read our medical disclaimer</Link>.</p>
                    </div>
                </main>
            </div>
        </div>
    );
}
