<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    /**
     * Display incidents.
     */
    public function index(Request $request): Response
    {
        $status = $request->input('status');
        $severity = $request->input('severity');

        $query = Incident::with(['reporter', 'resolver', 'tollGate']);

        if ($status) {
            $query->where('status', $status);
        }

        if ($severity) {
            $query->where('severity', $severity);
        }

        $incidents = $query->latest()->paginate(20);

        return Inertia::render('staff/incidents/index', [
            'incidents' => $incidents,
            'filters' => [
                'status' => $status,
                'severity' => $severity,
            ],
        ]);
    }

    /**
     * Store a new incident.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'toll_gate_id' => 'required|exists:toll_gates,id',
            'incident_type' => 'required|string|in:hardware_failure,vehicle_breakdown,accident,vandalism,power_outage,suspicious_activity,other',
            'severity' => 'required|string|in:low,medium,high,critical',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'action_taken' => 'nullable|string',
            'occurred_at' => 'nullable|date',
        ]);

        $incident = Incident::create([
            'toll_gate_id' => $validated['toll_gate_id'],
            'reported_by' => $request->user()->id,
            'incident_type' => $validated['incident_type'],
            'severity' => $validated['severity'],
            'status' => 'reported',
            'title' => $validated['title'],
            'description' => $validated['description'],
            'action_taken' => $validated['action_taken'] ?? null,
            'occurred_at' => $validated['occurred_at'] ?? now(),
        ]);

        return back()->with('success', 'Incident reported successfully');
    }

    /**
     * Update incident status.
     */
    public function updateStatus(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:reported,acknowledged,in_progress,resolved',
            'resolution_notes' => 'nullable|string',
        ]);

        $updateData = [
            'status' => $validated['status'],
        ];

        if ($validated['status'] === 'resolved') {
            $updateData['resolved_by'] = $request->user()->id;
            $updateData['resolved_at'] = now();
            $updateData['resolution_notes'] = $validated['resolution_notes'] ?? null;
        }

        $incident->update($updateData);

        return back()->with('success', 'Incident status updated successfully');
    }
}
