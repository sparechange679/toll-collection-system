<?php

namespace App\Http\Controllers;

use App\Models\DriverDocument;
use App\Models\DriverProfile;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    /**
     * Complete driver onboarding.
     */
    public function complete(Request $request)
    {
        // Check if documents are verified
        $documents = DriverDocument::where('user_id', $request->user()->id)
            ->whereIn('document_type', ['license', 'national_id'])
            ->get();

        $licenseDoc = $documents->where('document_type', 'license')->first();
        $nationalIdDoc = $documents->where('document_type', 'national_id')->first();

        if (! $licenseDoc || ! $licenseDoc->isVerified()) {
            return response()->json([
                'success' => false,
                'message' => 'Driver license document must be uploaded and verified before completing onboarding',
            ], 422);
        }

        if (! $nationalIdDoc || ! $nationalIdDoc->isVerified()) {
            return response()->json([
                'success' => false,
                'message' => 'National ID document must be uploaded and verified before completing onboarding',
            ], 422);
        }

        $validated = $request->validate([
            // Personal Details
            'license_number' => ['required', 'string', 'unique:driver_profiles,license_number'],
            'license_expiry_date' => ['required', 'date', 'after:today'],
            'country_code' => ['required', 'string', 'max:10'],
            'phone_number' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string'],
            'city' => ['required', 'string', 'max:100'],
            'district' => ['required', 'string', 'max:100'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'id_number' => ['required', 'string', 'unique:driver_profiles,id_number'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_country_code' => ['nullable', 'string', 'max:10'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],

            // Vehicle Details (registration_number removed - will be auto-generated)
            'make' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1900', 'max:'.(date('Y') + 1)],
            'vehicle_type' => ['required', 'string', 'in:car,bus,truck,motorcycle,emergency,government'],
            'color' => ['nullable', 'string', 'max:50'],
            'weight' => ['required', 'numeric', 'min:1'],
        ]);

        // Concatenate country code with phone number
        $fullPhoneNumber = $validated['country_code'].' '.$validated['phone_number'];
        $fullEmergencyPhone = null;

        if (! empty($validated['emergency_contact_phone']) && ! empty($validated['emergency_country_code'])) {
            $fullEmergencyPhone = $validated['emergency_country_code'].' '.$validated['emergency_contact_phone'];
        }

        // Auto-generate unique vehicle registration number
        $registrationNumber = $this->generateRegistrationNumber();

        DB::transaction(function () use ($request, $validated, $fullPhoneNumber, $fullEmergencyPhone, $registrationNumber) {
            // Create driver profile
            DriverProfile::create([
                'user_id' => $request->user()->id,
                'license_number' => $validated['license_number'],
                'license_expiry_date' => $validated['license_expiry_date'],
                'phone_number' => $fullPhoneNumber,
                'address' => $validated['address'],
                'city' => $validated['city'],
                'district' => $validated['district'],
                'date_of_birth' => $validated['date_of_birth'],
                'id_number' => $validated['id_number'],
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $fullEmergencyPhone,
            ]);

            // Create vehicle with auto-generated registration number and default RFID tag
            Vehicle::create([
                'user_id' => $request->user()->id,
                'registration_number' => $registrationNumber,
                'make' => $validated['make'],
                'model' => $validated['model'],
                'year' => $validated['year'],
                'vehicle_type' => $validated['vehicle_type'],
                'color' => $validated['color'] ?? null,
                'weight' => $validated['weight'],
                'rfid_tag' => 'C3 3F FF E3', // Default RFID tag for new drivers
            ]);

            // Mark onboarding as completed
            $request->user()->update([
                'onboarding_completed' => true,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Onboarding completed successfully!',
        ]);
    }

    /**
     * Generate a unique vehicle registration number.
     * Format: REG-YYYY-XXXXX (e.g., REG-2025-00001)
     */
    protected function generateRegistrationNumber(): string
    {
        $year = date('Y');
        $prefix = "REG-{$year}-";

        // Get the highest registration number for this year
        $lastVehicle = Vehicle::where('registration_number', 'LIKE', $prefix.'%')
            ->orderByDesc('registration_number')
            ->first();

        if ($lastVehicle) {
            // Extract the numeric part and increment
            $lastNumber = (int) substr($lastVehicle->registration_number, -5);
            $newNumber = $lastNumber + 1;
        } else {
            // First registration for this year
            $newNumber = 1;
        }

        // Pad with zeros to make it 5 digits
        $registrationNumber = $prefix.str_pad($newNumber, 5, '0', STR_PAD_LEFT);

        // Ensure it's unique (in case of race conditions)
        while (Vehicle::where('registration_number', $registrationNumber)->exists()) {
            $newNumber++;
            $registrationNumber = $prefix.str_pad($newNumber, 5, '0', STR_PAD_LEFT);
        }

        return $registrationNumber;
    }
}
