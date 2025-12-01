/**
 * Vehicle weight capacity limits in kilograms
 * Based on typical weight capacities for each vehicle type
 */
export const VEHICLE_WEIGHT_LIMITS: Record<string, number> = {
    car: 2000, // 2 tons (typical passenger car)
    bus: 18000, // 18 tons (typical bus)
    truck: 26000, // 26 tons (typical commercial truck)
    motorcycle: 400, // 400 kg (typical motorcycle)
    emergency: 10000, // 10 tons (ambulance/fire truck)
    government: 3500, // 3.5 tons (government vehicle)
};

/**
 * Get weight limit for a vehicle type
 */
export function getVehicleWeightLimit(vehicleType: string): number {
    return VEHICLE_WEIGHT_LIMITS[vehicleType] || 2000; // Default to car weight if unknown
}

/**
 * Raw load cell to kg conversion
 * Assuming linear relationship: 200 raw = 200 kg
 */
export function rawToKg(rawValue: number): number {
    return rawValue; // 1:1 conversion (adjust if needed)
}

/**
 * Format weight with unit
 */
export function formatWeight(kg: number): string {
    if (kg >= 1000) {
        return `${(kg / 1000).toFixed(1)} tons`;
    }
    return `${kg.toFixed(0)} kg`;
}
