<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\TollGate;
use App\Models\TollPassage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PassageController extends Controller
{
    /**
     * Display passage logs.
     */
    public function index(Request $request): Response
    {
        $tollGateId = $request->input('toll_gate_id');
        $status = $request->input('status');
        $dateFrom = $request->input('date_from', now()->startOfDay()->format('Y-m-d'));
        $dateTo = $request->input('date_to', now()->format('Y-m-d'));

        $query = TollPassage::with(['user', 'vehicle', 'staff', 'tollGate'])
            ->whereBetween('created_at', [$dateFrom, $dateTo]);

        if ($tollGateId) {
            $query->where('toll_gate_id', $tollGateId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $passages = $query->latest()->paginate(50);

        $tollGates = TollGate::where('is_active', true)->get();

        return Inertia::render('staff/passages/index', [
            'passages' => $passages,
            'tollGates' => $tollGates,
            'filters' => [
                'toll_gate_id' => $tollGateId,
                'status' => $status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * View single passage details.
     */
    public function show(TollPassage $passage): Response
    {
        $passage->load(['user', 'vehicle', 'staff', 'tollGate']);

        return Inertia::render('staff/passages/show', [
            'passage' => $passage,
        ]);
    }
}
