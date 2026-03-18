'use client';

import { useAuth } from '@/contexts/AuthContext';
import { convertGlucose, formatGlucose, toMgdl, unitLabel, glucoseBounds, type GlucoseUnit } from '@/lib/glucose';

/**
 * Returns the user's preferred glucose unit and conversion helpers.
 * All glucose values in the DB are in mg/dL — use these helpers for display only.
 *
 * @example
 * const { unit, format, convert, label } = useGlucoseUnit();
 * <span>{format(reading.value)} {label}</span>
 */
export function useGlucoseUnit() {
    const { userProfile } = useAuth();
    const unit: GlucoseUnit = (userProfile?.preferredUnit as GlucoseUnit) ?? 'mg/dL';

    return {
        unit,
        label: unitLabel(unit),
        /** Format mg/dL value as a display string (integer for mg/dL, 1dp for mmol/L). */
        format: (mgdl: number) => formatGlucose(mgdl, unit),
        /** Convert mg/dL value to the display unit as a number. */
        convert: (mgdl: number) => convertGlucose(mgdl, unit),
        /** Convert a user-entered value back to mg/dL for storage. */
        toMgdl: (value: number) => toMgdl(value, unit),
        /** Validation bounds in the user's unit. */
        bounds: glucoseBounds(unit),
        isMmol: unit === 'mmol/L',
    };
}
