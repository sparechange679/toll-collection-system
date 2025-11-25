<?php

namespace App\Services;

use App\Models\ManualTransaction;
use App\Models\Notification;
use App\Models\TollGate;
use App\Models\TollPassage;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;

class TollGateService
{
    /**
     * Process an RFID scan and determine if vehicle can pass.
     */
    public function processRfidScan(
        TollGate $tollGate,
        string $rfidTag,
        float $vehicleWeightKg,
        ?User $staff = null
    ): array {
        try {
            // Find vehicle by RFID tag
            $vehicle = Vehicle::where('rfid_tag', $rfidTag)->first();

            if (! $vehicle) {
                return $this->createRejectedPassage(
                    $tollGate,
                    $rfidTag,
                    $vehicleWeightKg,
                    $staff,
                    'rejected_unregistered',
                    'Vehicle with RFID tag not found in system'
                );
            }

            if (! $vehicle->is_active) {
                return $this->createRejectedPassage(
                    $tollGate,
                    $rfidTag,
                    $vehicleWeightKg,
                    $staff,
                    'rejected_unregistered',
                    'Vehicle is not active',
                    $vehicle
                );
            }

            $user = $vehicle->user;

            if (! $user) {
                return $this->createRejectedPassage(
                    $tollGate,
                    $rfidTag,
                    $vehicleWeightKg,
                    $staff,
                    'rejected_unregistered',
                    'Vehicle owner not found',
                    $vehicle
                );
            }

            // Calculate toll and fines
            $tollAmount = $tollGate->base_toll_rate;
            $fineAmount = 0;
            $isOverweight = $vehicleWeightKg > $tollGate->weight_limit_kg;

            if ($isOverweight) {
                $fineAmount = $tollGate->overweight_fine_rate;
            }

            $totalAmount = $tollAmount + $fineAmount;

            // Check if user has sufficient balance
            if ($user->balance < $totalAmount) {
                $passage = $this->createRejectedPassage(
                    $tollGate,
                    $rfidTag,
                    $vehicleWeightKg,
                    $staff,
                    'rejected_insufficient_funds',
                    "Insufficient balance. Required: {$totalAmount}, Available: {$user->balance}",
                    $vehicle,
                    $tollAmount,
                    $fineAmount,
                    $totalAmount,
                    $isOverweight
                );

                // Send low balance notification
                $this->sendLowBalanceNotification($user, $totalAmount);

                return $passage;
            }

            // Debit user's wallet
            return DB::transaction(function () use ($user, $vehicle, $tollGate, $rfidTag, $vehicleWeightKg, $staff, $tollAmount, $fineAmount, $totalAmount, $isOverweight) {
                $user->decrement('balance', $totalAmount);

                // Create transaction record
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'debit',
                    'amount' => $totalAmount,
                    'balance_after' => $user->balance,
                    'description' => $isOverweight
                        ? "Toll payment with overweight fine at {$tollGate->name}"
                        : "Toll payment at {$tollGate->name}",
                    'reference' => 'TOLL-'.time(),
                    'metadata' => [
                        'toll_gate_id' => $tollGate->id,
                        'vehicle_id' => $vehicle->id,
                        'toll_amount' => $tollAmount,
                        'fine_amount' => $fineAmount,
                        'is_overweight' => $isOverweight,
                    ],
                ]);

                // Create toll passage record
                $passage = TollPassage::create([
                    'toll_gate_id' => $tollGate->id,
                    'user_id' => $user->id,
                    'vehicle_id' => $vehicle->id,
                    'staff_id' => $staff?->id,
                    'rfid_tag' => $rfidTag,
                    'status' => 'success',
                    'toll_amount' => $tollAmount,
                    'fine_amount' => $fineAmount,
                    'total_amount' => $totalAmount,
                    'vehicle_weight_kg' => $vehicleWeightKg,
                    'is_overweight' => $isOverweight,
                    'payment_method' => 'wallet',
                    'scanned_at' => now(),
                ]);

                // Send overweight notification if applicable
                if ($isOverweight) {
                    $this->sendOverweightNotification($user, $vehicle, $fineAmount, $tollGate);
                }

                return [
                    'success' => true,
                    'status' => 'success',
                    'message' => $isOverweight
                        ? "Payment successful. Overweight fine applied: ₱{$fineAmount}"
                        : 'Payment successful',
                    'passage' => $passage,
                    'user' => $user->fresh(),
                    'vehicle' => $vehicle,
                    'amount_charged' => $totalAmount,
                    'new_balance' => $user->balance,
                    'gate_action' => 'open',
                ];
            });
        } catch (\Exception $e) {
            return [
                'success' => false,
                'status' => 'error',
                'message' => 'System error: '.$e->getMessage(),
                'gate_action' => 'closed',
            ];
        }
    }

    /**
     * Process manual cash payment.
     */
    public function processCashPayment(
        TollGate $tollGate,
        User $staff,
        float $amount,
        float $vehicleWeightKg,
        ?string $vehicleRegistration = null,
        ?string $driverName = null,
        ?string $driverContact = null,
        ?string $notes = null
    ): array {
        $isOverweight = $vehicleWeightKg > $tollGate->weight_limit_kg;
        $tollAmount = $tollGate->base_toll_rate;
        $fineAmount = $isOverweight ? $tollGate->overweight_fine_rate : 0;
        $expectedAmount = $tollAmount + $fineAmount;

        return DB::transaction(function () use ($tollGate, $staff, $amount, $vehicleWeightKg, $vehicleRegistration, $driverName, $driverContact, $notes, $isOverweight, $tollAmount, $fineAmount, $expectedAmount) {
            // Create manual transaction
            $manualTransaction = ManualTransaction::create([
                'toll_gate_id' => $tollGate->id,
                'staff_id' => $staff->id,
                'transaction_type' => 'cash_payment',
                'amount' => $amount,
                'vehicle_registration' => $vehicleRegistration,
                'driver_name' => $driverName,
                'driver_contact' => $driverContact,
                'reason' => 'Cash payment for unregistered vehicle or RFID issue',
                'notes' => $notes,
            ]);

            // Create toll passage record
            $passage = TollPassage::create([
                'toll_gate_id' => $tollGate->id,
                'staff_id' => $staff->id,
                'rfid_tag' => null,
                'status' => 'cash_payment',
                'toll_amount' => $tollAmount,
                'fine_amount' => $fineAmount,
                'total_amount' => $amount,
                'vehicle_weight_kg' => $vehicleWeightKg,
                'is_overweight' => $isOverweight,
                'payment_method' => 'cash',
                'metadata' => [
                    'vehicle_registration' => $vehicleRegistration,
                    'driver_name' => $driverName,
                    'manual_transaction_id' => $manualTransaction->id,
                ],
                'scanned_at' => now(),
            ]);

            return [
                'success' => true,
                'status' => 'cash_payment',
                'message' => 'Cash payment processed successfully',
                'passage' => $passage,
                'manual_transaction' => $manualTransaction,
                'amount_collected' => $amount,
                'expected_amount' => $expectedAmount,
                'gate_action' => 'open',
            ];
        });
    }

    /**
     * Process manual override.
     */
    public function processManualOverride(
        TollGate $tollGate,
        User $staff,
        string $reason,
        ?string $rfidTag = null,
        ?Vehicle $vehicle = null,
        ?User $user = null,
        float $vehicleWeightKg = 0
    ): array {
        return DB::transaction(function () use ($tollGate, $staff, $reason, $rfidTag, $vehicle, $user, $vehicleWeightKg) {
            $passage = TollPassage::create([
                'toll_gate_id' => $tollGate->id,
                'user_id' => $user?->id,
                'vehicle_id' => $vehicle?->id,
                'staff_id' => $staff->id,
                'rfid_tag' => $rfidTag,
                'status' => 'manual_override',
                'toll_amount' => 0,
                'fine_amount' => 0,
                'total_amount' => 0,
                'vehicle_weight_kg' => $vehicleWeightKg,
                'is_overweight' => false,
                'payment_method' => 'manual_override',
                'override_reason' => $reason,
                'scanned_at' => now(),
            ]);

            return [
                'success' => true,
                'status' => 'manual_override',
                'message' => 'Manual override applied',
                'passage' => $passage,
                'gate_action' => 'open',
            ];
        });
    }

    /**
     * Look up driver by RFID tag or license plate.
     */
    public function lookupDriver(?string $rfidTag = null, ?string $registrationNumber = null): ?array
    {
        $vehicle = null;

        if ($rfidTag) {
            $vehicle = Vehicle::where('rfid_tag', $rfidTag)->with(['user', 'user.driverProfile'])->first();
        } elseif ($registrationNumber) {
            $vehicle = Vehicle::where('registration_number', $registrationNumber)->with(['user', 'user.driverProfile'])->first();
        }

        if (! $vehicle) {
            return null;
        }

        $user = $vehicle->user;

        return [
            'vehicle' => $vehicle,
            'user' => $user,
            'driver_profile' => $user->driverProfile,
            'balance' => $user->balance,
            'recent_passages' => $user->tollPassages()->latest()->limit(10)->get(),
        ];
    }

    /**
     * Create a rejected passage record.
     */
    protected function createRejectedPassage(
        TollGate $tollGate,
        string $rfidTag,
        float $vehicleWeightKg,
        ?User $staff,
        string $status,
        string $reason,
        ?Vehicle $vehicle = null,
        float $tollAmount = 0,
        float $fineAmount = 0,
        float $totalAmount = 0,
        bool $isOverweight = false
    ): array {
        $passage = TollPassage::create([
            'toll_gate_id' => $tollGate->id,
            'user_id' => $vehicle?->user_id,
            'vehicle_id' => $vehicle?->id,
            'staff_id' => $staff?->id,
            'rfid_tag' => $rfidTag,
            'status' => $status,
            'toll_amount' => $tollAmount,
            'fine_amount' => $fineAmount,
            'total_amount' => $totalAmount,
            'vehicle_weight_kg' => $vehicleWeightKg,
            'is_overweight' => $isOverweight,
            'payment_method' => 'wallet',
            'rejection_reason' => $reason,
            'scanned_at' => now(),
        ]);

        return [
            'success' => false,
            'status' => $status,
            'message' => $reason,
            'passage' => $passage,
            'vehicle' => $vehicle,
            'gate_action' => 'closed',
        ];
    }

    /**
     * Send low balance notification to driver.
     */
    protected function sendLowBalanceNotification(User $user, float $requiredAmount): void
    {
        $notification = Notification::create([
            'type' => 'low_balance',
            'title' => 'Low Balance - Unable to Pass Toll Gate',
            'message' => "Your balance is insufficient. Required: ₱{$requiredAmount}, Available: ₱{$user->balance}. Please top up your wallet.",
            'data' => json_encode([
                'required_amount' => $requiredAmount,
                'current_balance' => $user->balance,
                'action' => 'top_up',
            ]),
            'sent_at' => now(),
        ]);

        $notification->recipients()->create([
            'user_id' => $user->id,
        ]);
    }

    /**
     * Send overweight notification to driver.
     */
    protected function sendOverweightNotification(User $user, Vehicle $vehicle, float $fineAmount, TollGate $tollGate): void
    {
        $notification = Notification::create([
            'type' => 'overweight_fine',
            'title' => 'Overweight Fine Applied',
            'message' => "Your vehicle ({$vehicle->registration_number}) exceeded the weight limit at {$tollGate->name}. A fine of ₱{$fineAmount} has been applied.",
            'data' => json_encode([
                'vehicle_id' => $vehicle->id,
                'fine_amount' => $fineAmount,
                'toll_gate' => $tollGate->name,
            ]),
            'sent_at' => now(),
        ]);

        $notification->recipients()->create([
            'user_id' => $user->id,
        ]);
    }
}
