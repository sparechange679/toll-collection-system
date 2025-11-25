<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TollGate;
use App\Services\TollGateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ArduinoController extends Controller
{
    public function __construct(private TollGateService $tollGateService) {}

    /**
     * Process RFID scan from Arduino hardware
     *
     * Expected payload:
     * {
     *   "gate_identifier": "GATE-001",
     *   "rfid_tag": "ABC123XYZ",
     *   "weight_kg": 4500.50,
     *   "timestamp": "2025-11-25T10:30:00Z"
     * }
     */
    public function processRfidScan(Request $request): JsonResponse
    {
        // Validate incoming data
        $validator = Validator::make($request->all(), [
            'gate_identifier' => 'required|string|exists:toll_gates,gate_identifier',
            'rfid_tag' => 'required|string|max:255',
            'weight_kg' => 'required|numeric|min:0|max:50000',
            'timestamp' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'gate_action' => 'close',
                'message' => 'Invalid request data',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Find toll gate
        $tollGate = TollGate::where('gate_identifier', $validated['gate_identifier'])->first();

        // Check if toll gate is operational
        if (! $tollGate->isOperational()) {
            Log::warning('Arduino scan attempted on non-operational gate', [
                'gate_identifier' => $validated['gate_identifier'],
                'gate_status' => $tollGate->gate_status,
            ]);

            return response()->json([
                'success' => false,
                'gate_action' => 'close',
                'message' => 'Toll gate is not operational',
                'gate_status' => $tollGate->gate_status,
                'rfid_scanner_status' => $tollGate->rfid_scanner_status,
                'weight_sensor_status' => $tollGate->weight_sensor_status,
            ], 503);
        }

        // Update last heartbeat
        $tollGate->update(['last_heartbeat' => now()]);

        // Process RFID scan
        try {
            $result = $this->tollGateService->processRfidScan(
                tollGate: $tollGate,
                rfidTag: $validated['rfid_tag'],
                vehicleWeightKg: $validated['weight_kg'],
                staff: null
            );

            // Log the transaction
            Log::info('Arduino RFID scan processed', [
                'gate_identifier' => $validated['gate_identifier'],
                'rfid_tag' => $validated['rfid_tag'],
                'weight_kg' => $validated['weight_kg'],
                'result' => $result,
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Arduino RFID scan processing failed', [
                'gate_identifier' => $validated['gate_identifier'],
                'rfid_tag' => $validated['rfid_tag'],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'gate_action' => 'close',
                'message' => 'Internal server error processing scan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update hardware status from Arduino
     *
     * Expected payload:
     * {
     *   "gate_identifier": "GATE-001",
     *   "gate_status": "open",
     *   "rfid_scanner_status": "operational",
     *   "weight_sensor_status": "operational"
     * }
     */
    public function updateHardwareStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'gate_identifier' => 'required|string|exists:toll_gates,gate_identifier',
            'gate_status' => 'required|in:open,closed,opening,closing,malfunction',
            'rfid_scanner_status' => 'required|in:operational,maintenance,malfunction',
            'weight_sensor_status' => 'required|in:operational,maintenance,malfunction',
            'hardware_info' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid request data',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $tollGate = TollGate::where('gate_identifier', $validated['gate_identifier'])->first();

        $tollGate->update([
            'gate_status' => $validated['gate_status'],
            'rfid_scanner_status' => $validated['rfid_scanner_status'],
            'weight_sensor_status' => $validated['weight_sensor_status'],
            'hardware_info' => $validated['hardware_info'] ?? $tollGate->hardware_info,
            'last_heartbeat' => now(),
        ]);

        Log::info('Arduino hardware status updated', [
            'gate_identifier' => $validated['gate_identifier'],
            'gate_status' => $validated['gate_status'],
            'rfid_scanner_status' => $validated['rfid_scanner_status'],
            'weight_sensor_status' => $validated['weight_sensor_status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Hardware status updated successfully',
            'toll_gate' => [
                'id' => $tollGate->id,
                'name' => $tollGate->name,
                'is_operational' => $tollGate->isOperational(),
            ],
        ]);
    }

    /**
     * Heartbeat endpoint for Arduino to check connection
     *
     * Expected payload:
     * {
     *   "gate_identifier": "GATE-001"
     * }
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'gate_identifier' => 'required|string|exists:toll_gates,gate_identifier',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid gate identifier',
                'errors' => $validator->errors(),
            ], 422);
        }

        $tollGate = TollGate::where('gate_identifier', $request->gate_identifier)->first();

        $tollGate->update(['last_heartbeat' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Heartbeat received',
            'server_time' => now()->toIso8601String(),
            'toll_gate' => [
                'id' => $tollGate->id,
                'name' => $tollGate->name,
                'is_operational' => $tollGate->isOperational(),
                'base_toll_rate' => $tollGate->base_toll_rate,
                'overweight_fine_rate' => $tollGate->overweight_fine_rate,
                'weight_limit_kg' => $tollGate->weight_limit_kg,
            ],
        ]);
    }
}
