<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TollPassage;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TollGateController extends Controller
{
    /**
     * Verify RFID tag and check if driver has sufficient balance
     */
    public function verifyRfid(Request $request)
    {
        $request->validate([
            'rfid_uid' => 'required|string',
            'toll_gate_id' => 'required|integer|exists:toll_gates,id',
            'weight_kg' => 'nullable|numeric|min:0',
        ]);

        $rfidUid = strtoupper($request->rfid_uid);

        // Find vehicle by RFID tag
        $vehicle = Vehicle::where('rfid_tag', $rfidUid)
            ->where('is_active', true)
            ->with('user')
            ->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'RFID tag not registered or vehicle inactive',
                'error_code' => 'RFID_NOT_FOUND',
            ], 404);
        }

        if (!$vehicle->user) {
            return response()->json([
                'success' => false,
                'message' => 'No user associated with this vehicle',
                'error_code' => 'NO_USER',
            ], 404);
        }

        // Get toll gate info
        $tollGate = \App\Models\TollGate::find($request->toll_gate_id);
        $tollAmount = $tollGate->base_toll_rate ?? 500; // Default 500 if not set
        $fineAmount = 0;
        $isOverweight = false;

        // Check if vehicle is overweight
        if ($request->weight_kg && $tollGate->weight_limit_kg) {
            if ($request->weight_kg > $tollGate->weight_limit_kg) {
                $isOverweight = true;
                $fineAmount = $tollGate->overweight_fine_rate ?? 1000;
            }
        }

        $totalAmount = $tollAmount + $fineAmount;

        // Check if user has sufficient balance
        $user = $vehicle->user;
        if ($user->balance < $totalAmount) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance',
                'error_code' => 'INSUFFICIENT_BALANCE',
                'data' => [
                    'driver_name' => $user->name,
                    'vehicle_registration' => $vehicle->registration_number,
                    'current_balance' => number_format($user->balance, 2),
                    'required_amount' => number_format($totalAmount, 2),
                    'toll_amount' => number_format($tollAmount, 2),
                    'fine_amount' => number_format($fineAmount, 2),
                    'is_overweight' => $isOverweight,
                ],
            ], 402);
        }

        // Deduct balance and record passage
        DB::beginTransaction();
        try {
            // Deduct from wallet
            $user->balance -= $totalAmount;
            $user->save();

            // Record transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'toll_payment',
                'amount' => -$totalAmount,
                'balance_after' => $user->balance,
                'description' => "Toll payment at {$tollGate->name}",
                'reference' => "TOLL-" . now()->format('YmdHis'),
                'metadata' => json_encode([
                    'toll_gate_id' => $tollGate->id,
                    'vehicle_id' => $vehicle->id,
                    'rfid_uid' => $rfidUid,
                    'toll_amount' => $tollAmount,
                    'fine_amount' => $fineAmount,
                    'weight_kg' => $request->weight_kg,
                ]),
            ]);

            // Record toll passage
            TollPassage::create([
                'toll_gate_id' => $tollGate->id,
                'user_id' => $user->id,
                'vehicle_id' => $vehicle->id,
                'rfid_tag' => $rfidUid,
                'status' => 'successful',
                'toll_amount' => $tollAmount,
                'fine_amount' => $fineAmount,
                'total_amount' => $totalAmount,
                'vehicle_weight_kg' => $request->weight_kg,
                'is_overweight' => $isOverweight,
                'payment_method' => 'wallet',
                'scanned_at' => now(),
            ]);

            DB::commit();

            Log::info("Toll passage successful", [
                'rfid' => $rfidUid,
                'user' => $user->name,
                'amount' => $totalAmount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Access granted - Toll deducted',
                'data' => [
                    'driver_name' => $user->name,
                    'vehicle_registration' => $vehicle->registration_number,
                    'vehicle_make_model' => "{$vehicle->make} {$vehicle->model}",
                    'amount_deducted' => number_format($totalAmount, 2),
                    'new_balance' => number_format($user->balance, 2),
                    'toll_amount' => number_format($tollAmount, 2),
                    'fine_amount' => number_format($fineAmount, 2),
                    'is_overweight' => $isOverweight,
                    'timestamp' => now()->toIso8601String(),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Toll passage failed", [
                'rfid' => $rfidUid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Transaction failed - Please try again',
                'error_code' => 'TRANSACTION_FAILED',
            ], 500);
        }
    }

    /**
     * Get toll gate status (for ESP32 heartbeat)
     */
    public function getStatus(Request $request)
    {
        $tollGateId = $request->input('toll_gate_id', 1);
        $tollGate = \App\Models\TollGate::find($tollGateId);

        if (!$tollGate) {
            return response()->json([
                'success' => false,
                'message' => 'Toll gate not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'gate_name' => $tollGate->name,
                'is_active' => $tollGate->is_active,
                'toll_rate' => $tollGate->base_toll_rate,
                'overweight_fine' => $tollGate->overweight_fine_rate,
                'weight_limit_kg' => $tollGate->weight_limit_kg,
            ],
        ]);
    }
}
