<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\TollPassage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TollGateMonitorController extends Controller
{
    /**
     * Display the toll gate activity monitor page.
     */
    public function index()
    {
        $recentActivity = TollPassage::with(['tollGate', 'user', 'vehicle'])
            ->latest('scanned_at')
            ->limit(50)
            ->get()
            ->map(function ($passage) {
                return [
                    'id' => $passage->id,
                    'timestamp' => $passage->scanned_at->format('Y-m-d H:i:s'),
                    'toll_gate' => $passage->tollGate->name ?? 'Unknown',
                    'driver_name' => $passage->user->name ?? 'Unknown',
                    'vehicle' => $passage->vehicle ? "{$passage->vehicle->registration_number} ({$passage->vehicle->make} {$passage->vehicle->model})" : 'Unknown',
                    'rfid_tag' => $passage->rfid_tag,
                    'status' => $passage->status,
                    'total_amount' => $passage->total_amount,
                    'toll_amount' => $passage->toll_amount,
                    'fine_amount' => $passage->fine_amount,
                    'is_overweight' => $passage->is_overweight,
                    'vehicle_weight_kg' => $passage->vehicle_weight_kg,
                    'payment_method' => $passage->payment_method,
                ];
            });

        return Inertia::render('staff/toll-gate-monitor', [
            'initialActivity' => $recentActivity,
        ]);
    }

    /**
     * Get latest toll gate activity updates (for polling).
     */
    public function updates(Request $request)
    {
        $since = $request->query('since');

        $query = TollPassage::with(['tollGate', 'user', 'vehicle'])
            ->latest('scanned_at');

        if ($since) {
            $query->where('scanned_at', '>', $since);
        }

        $activity = $query->limit(50)->get()->map(function ($passage) {
            return [
                'id' => $passage->id,
                'timestamp' => $passage->scanned_at->format('Y-m-d H:i:s'),
                'toll_gate' => $passage->tollGate->name ?? 'Unknown',
                'driver_name' => $passage->user->name ?? 'Unknown',
                'vehicle' => $passage->vehicle ? "{$passage->vehicle->registration_number} ({$passage->vehicle->make} {$passage->vehicle->model})" : 'Unknown',
                'rfid_tag' => $passage->rfid_tag,
                'status' => $passage->status,
                'total_amount' => $passage->total_amount,
                'toll_amount' => $passage->toll_amount,
                'fine_amount' => $passage->fine_amount,
                'is_overweight' => $passage->is_overweight,
                'vehicle_weight_kg' => $passage->vehicle_weight_kg,
                'payment_method' => $passage->payment_method,
            ];
        });

        return response()->json([
            'activity' => $activity,
            'latest_timestamp' => $activity->first()['timestamp'] ?? null,
        ]);
    }
}
