<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\HandoverNote;
use App\Models\Incident;
use App\Models\ShiftLog;
use App\Models\TollGate;
use App\Models\TollPassage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the staff dashboard with real-time monitoring.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get the toll gate assigned to this staff member or the first active gate
        $tollGate = TollGate::where('is_active', true)->first();

        if (! $tollGate) {
            return Inertia::render('staff/dashboard/index', [
                'error' => 'No active toll gate found. Please contact administrator.',
            ]);
        }

        // Get current active shift for this staff member
        $currentShift = ShiftLog::where('staff_id', $user->id)
            ->whereNull('clock_out_at')
            ->with('tollGate')
            ->first();

        // Today's statistics
        $today = now()->startOfDay();
        $todayPassages = TollPassage::where('toll_gate_id', $tollGate->id)
            ->where('created_at', '>=', $today)
            ->get();

        $todayStats = [
            'total_revenue' => $todayPassages->sum('total_amount'),
            'total_passages' => $todayPassages->count(),
            'successful_passages' => $todayPassages->where('status', 'success')->count(),
            'rejected_passages' => $todayPassages->where('status', 'like', 'rejected_%')->count(),
            'cash_payments' => $todayPassages->where('status', 'cash_payment')->count(),
            'manual_overrides' => $todayPassages->where('status', 'manual_override')->count(),
            'overweight_violations' => $todayPassages->where('is_overweight', true)->count(),
        ];

        // Recent passages (last 20)
        $recentPassages = TollPassage::where('toll_gate_id', $tollGate->id)
            ->with(['user', 'vehicle', 'staff'])
            ->latest()
            ->limit(20)
            ->get();

        // Recent incidents (unresolved)
        $unresolvedIncidents = Incident::where('toll_gate_id', $tollGate->id)
            ->whereIn('status', ['reported', 'acknowledged', 'in_progress'])
            ->with(['reporter', 'tollGate'])
            ->latest()
            ->get();

        // Unread handover notes for this staff member
        $unreadHandoverNotes = HandoverNote::where('to_staff_id', $user->id)
            ->where('is_read', false)
            ->with(['fromStaff', 'tollGate', 'shiftLog'])
            ->latest()
            ->get();

        return Inertia::render('staff/dashboard/index', [
            'tollGate' => $tollGate,
            'currentShift' => $currentShift,
            'todayStats' => $todayStats,
            'recentPassages' => $recentPassages,
            'unresolvedIncidents' => $unresolvedIncidents,
            'unreadHandoverNotes' => $unreadHandoverNotes,
        ]);
    }

    /**
     * Get real-time updates for the dashboard (for polling/refresh).
     */
    public function updates(Request $request)
    {
        $user = $request->user();
        $tollGateId = $request->input('toll_gate_id');

        $tollGate = TollGate::find($tollGateId);

        if (! $tollGate) {
            return response()->json(['error' => 'Toll gate not found'], 404);
        }

        // Get latest passages since last check
        $since = $request->input('since', now()->subMinutes(5));

        $newPassages = TollPassage::where('toll_gate_id', $tollGate->id)
            ->where('created_at', '>', $since)
            ->with(['user', 'vehicle', 'staff'])
            ->latest()
            ->get();

        // Current shift statistics
        $currentShift = ShiftLog::where('staff_id', $user->id)
            ->whereNull('clock_out_at')
            ->first();

        $shiftStats = null;
        if ($currentShift) {
            $shiftPassages = TollPassage::where('toll_gate_id', $tollGate->id)
                ->where('created_at', '>=', $currentShift->clock_in_at)
                ->get();

            $shiftStats = [
                'total_revenue' => $shiftPassages->sum('total_amount'),
                'total_passages' => $shiftPassages->count(),
                'successful_passages' => $shiftPassages->where('status', 'success')->count(),
                'rejected_passages' => $shiftPassages->where('status', 'like', 'rejected_%')->count(),
            ];
        }

        return response()->json([
            'newPassages' => $newPassages,
            'shiftStats' => $shiftStats,
            'gateStatus' => [
                'gate_status' => $tollGate->gate_status,
                'rfid_scanner_status' => $tollGate->rfid_scanner_status,
                'weight_sensor_status' => $tollGate->weight_sensor_status,
                'is_operational' => $tollGate->isOperational(),
            ],
            'timestamp' => now()->toISOString(),
        ]);
    }
}
