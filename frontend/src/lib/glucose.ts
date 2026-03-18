/**
 * Glucose unit conversion utilities.
 *
 * All values are stored in the database as mg/dL.
 * These helpers convert for display only, based on the user's preferredUnit.
 */

export type GlucoseUnit = 'mg/dL' | 'mmol/L';

const CONVERSION_FACTOR = 18.0182;

/** Convert a mg/dL value to the display unit. */
export function convertGlucose(mgdl: number, unit: GlucoseUnit): number {
    if (unit === 'mmol/L') return Math.round((mgdl / CONVERSION_FACTOR) * 10) / 10;
    return Math.round(mgdl);
}

/** Format a mg/dL value for display with 1 decimal for mmol/L, integer for mg/dL. */
export function formatGlucose(mgdl: number, unit: GlucoseUnit): string {
    if (unit === 'mmol/L') return (Math.round((mgdl / CONVERSION_FACTOR) * 10) / 10).toFixed(1);
    return Math.round(mgdl).toString();
}

/** Convert a user-entered value back to mg/dL for storage. */
export function toMgdl(value: number, unit: GlucoseUnit): number {
    if (unit === 'mmol/L') return Math.round(value * CONVERSION_FACTOR);
    return Math.round(value);
}

/** The unit label string. */
export function unitLabel(unit: GlucoseUnit): string {
    return unit;
}

/** Min/max input validation bounds in the user's unit. */
export function glucoseBounds(unit: GlucoseUnit): { min: number; max: number; minDisplay: string; maxDisplay: string } {
    if (unit === 'mmol/L') {
        return { min: 1.1, max: 33.3, minDisplay: '1.1', maxDisplay: '33.3' };
    }
    return { min: 20, max: 600, minDisplay: '20', maxDisplay: '600' };
}
