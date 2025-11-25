<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\TollGate;
use App\Models\Vehicle;
use App\Services\TollGateService;
use Illuminate\Http\Request;

class ManualTransactionController extends Controller
{
    public function __construct(
        public TollGateService $tollGateService
    ) {}

    /**
     * Process a cash payment.
     */
    public function processCashPayment(Request $request)
    {
        $validated = $request->validate([
            'toll_gate_id' => 'required|exists:toll_gates,id',
            'amount' => 'required|numeric|min:0',
            'vehicle_weight_kg' => 'required|numeric|min:0',
            'vehicle_registration' => 'nullable|string|max:255',
            'driver_name' => 'nullable|string|max:255',
            'driver_contact' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $tollGate = TollGate::findOrFail($validated['toll_gate_id']);
        $user = $request->user();

        $result = $this->tollGateService->processCashPayment(
            $tollGate,
            $user,
            $validated['amount'],
            $validated['vehicle_weight_kg'],
            $validated['vehicle_registration'] ?? null,
            $validated['driver_name'] ?? null,
            $validated['driver_contact'] ?? null,
            $validated['notes'] ?? null
        );

        if ($result['success']) {
            return back()->with('success', $result['message']);
        }

        return back()->withErrors(['error' => $result['message']]);
    }

    /**
     * Process a manual override.
     */
    public function processManualOverride(Request $request)
    {
        $validated = $request->validate([
            'toll_gate_id' => 'required|exists:toll_gates,id',
            'reason' => 'required|string|max:500',
            'rfid_tag' => 'nullable|string|max:255',
            'vehicle_weight_kg' => 'nullable|numeric|min:0',
        ]);

        $tollGate = TollGate::findOrFail($validated['toll_gate_id']);
        $user = $request->user();

        // Try to find vehicle if RFID is provided
        $vehicle = null;
        $vehicleOwner = null;
        if (! empty($validated['rfid_tag'])) {
            $vehicle = Vehicle::where('rfid_tag', $validated['rfid_tag'])->first();
            $vehicleOwner = $vehicle?->user;
        }

        $result = $this->tollGateService->processManualOverride(
            $tollGate,
            $user,
            $validated['reason'],
            $validated['rfid_tag'] ?? null,
            $vehicle,
            $vehicleOwner,
            $validated['vehicle_weight_kg'] ?? 0
        );

        if ($result['success']) {
            return back()->with('success', $result['message']);
        }

        return back()->withErrors(['error' => $result['message']]);
    }

    /**
     * Manually add or adjust a fine.
     */
    public function addFine(Request $request)
    {
        $validated = $request->validate([
            'toll_gate_id' => 'required|exists:toll_gates,id',
            'user_id' => 'nullable|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $tollGate = TollGate::findOrFail($validated['toll_gate_id']);
        $staff = $request->user();

        // Create manual transaction for fine adjustment
        $manualTransaction = \App\Models\ManualTransaction::create([
            'toll_gate_id' => $validated['toll_gate_id'],
            'staff_id' => $staff->id,
            'user_id' => $validated['user_id'] ?? null,
            'transaction_type' => 'fine_adjustment',
            'amount' => $validated['amount'],
            'reason' => $validated['reason'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // If user is provided, debit their wallet
        if (! empty($validated['user_id'])) {
            $targetUser = \App\Models\User::find($validated['user_id']);

            if ($targetUser->balance >= $validated['amount']) {
                $targetUser->decrement('balance', $validated['amount']);

                \App\Models\Transaction::create([
                    'user_id' => $targetUser->id,
                    'type' => 'debit',
                    'amount' => $validated['amount'],
                    'balance_after' => $targetUser->balance,
                    'description' => "Manual fine: {$validated['reason']}",
                    'reference' => 'FINE-'.time(),
                    'metadata' => [
                        'manual_transaction_id' => $manualTransaction->id,
                        'staff_id' => $staff->id,
                    ],
                ]);

                return back()->with('success', "Fine of ₱{$validated['amount']} applied successfully");
            } else {
                return back()->withErrors(['error' => 'User has insufficient balance for this fine']);
            }
        }

        return back()->with('success', 'Fine recorded successfully');
    }
}
