<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\HandoverNote;
use App\Models\ShiftLog;
use App\Models\TollGate;
use App\Models\TollPassage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    /**
     * Display shift management page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get current active shift
        $currentShift = ShiftLog::where('staff_id', $user->id)
            ->whereNull('clock_out_at')
            ->with('tollGate')
            ->first();

        // Get recent shifts (last 10)
        $recentShifts = ShiftLog::where('staff_id', $user->id)
            ->with(['tollGate', 'handoverNote'])
            ->latest('clock_in_at')
            ->limit(10)
            ->get();

        // Get available toll gates
        $tollGates = TollGate::where('is_active', true)->get();

        return Inertia::render('staff/shifts/index', [
            'currentShift' => $currentShift,
            'recentShifts' => $recentShifts,
            'tollGates' => $tollGates,
        ]);
    }

    /**
     * Clock in to start a shift.
     */
    public function clockIn(Request $request)
    {
        $validated = $request->validate([
            'toll_gate_id' => 'required|exists:toll_gates,id',
        ]);

        $user = $request->user();

        // Check if staff already has an active shift
        $existingShift = ShiftLog::where('staff_id', $user->id)
            ->whereNull('clock_out_at')
            ->first();

        if ($existingShift) {
            throw ValidationException::withMessages([
                'toll_gate_id' => 'You already have an active shift. Please clock out first.',
            ]);
        }

        $tollGate = TollGate::find($validated['toll_gate_id']);

        $shift = ShiftLog::create([
            'staff_id' => $user->id,
            'toll_gate_id' => $validated['toll_gate_id'],
            'clock_in_at' => now(),
            'total_passages' => 0,
            'successful_passages' => 0,
            'rejected_passages' => 0,
            'manual_overrides' => 0,
            'cash_payments' => 0,
            'incidents_reported' => 0,
            'total_revenue' => 0,
            'cash_collected' => 0,
        ]);

        return redirect()->route('staff.dashboard')->with('success', "Clocked in at {$tollGate->name}");
    }

    /**
     * Clock out to end a shift.
     */
    public function clockOut(Request $request)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
            'handover_notes' => 'nullable|string|max:1000',
            'pending_issues' => 'nullable|array',
        ]);

        $user = $request->user();

        $shift = ShiftLog::where('staff_id', $user->id)
            ->whereNull('clock_out_at')
            ->first();

        if (! $shift) {
            throw ValidationException::withMessages([
                'shift' => 'No active shift found.',
            ]);
        }

        return DB::transaction(function () use ($shift, $validated, $user) {
            // Calculate shift statistics
            $shiftPassages = TollPassage::where('toll_gate_id', $shift->toll_gate_id)
                ->where('created_at', '>=', $shift->clock_in_at)
                ->where('created_at', '<=', now())
                ->get();

            $shift->update([
                'clock_out_at' => now(),
                'total_passages' => $shiftPassages->count(),
                'successful_passages' => $shiftPassages->where('status', 'success')->count(),
                'rejected_passages' => $shiftPassages->filter(fn ($p) => str_starts_with($p->status, 'rejected_'))->count(),
                'manual_overrides' => $shiftPassages->where('status', 'manual_override')->count(),
                'cash_payments' => $shiftPassages->where('status', 'cash_payment')->count(),
                'total_revenue' => $shiftPassages->sum('total_amount'),
                'cash_collected' => $shiftPassages->where('payment_method', 'cash')->sum('total_amount'),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create handover note if provided
            if (! empty($validated['handover_notes'])) {
                HandoverNote::create([
                    'toll_gate_id' => $shift->toll_gate_id,
                    'from_staff_id' => $user->id,
                    'shift_log_id' => $shift->id,
                    'notes' => $validated['handover_notes'],
                    'pending_issues' => $validated['pending_issues'] ?? null,
                ]);
            }

            return redirect()->route('staff.shifts.index')->with('success', 'Shift ended successfully');
        });
    }

    /**
     * View shift details.
     */
    public function show(Request $request, ShiftLog $shift): Response
    {
        $user = $request->user();

        // Ensure user can only view their own shifts (or admins can view all)
        if ($shift->staff_id !== $user->id && ! $user->isAdmin()) {
            abort(403);
        }

        $shift->load(['staff', 'tollGate', 'handoverNote']);

        // Get passages during this shift
        $passages = TollPassage::where('toll_gate_id', $shift->toll_gate_id)
            ->where('created_at', '>=', $shift->clock_in_at)
            ->when($shift->clock_out_at, fn ($q) => $q->where('created_at', '<=', $shift->clock_out_at))
            ->with(['user', 'vehicle'])
            ->latest()
            ->get();

        return Inertia::render('staff/shifts/show', [
            'shift' => $shift,
            'passages' => $passages,
        ]);
    }

    /**
     * Export shift report.
     */
    public function exportReport(Request $request, ShiftLog $shift)
    {
        $user = $request->user();

        // Ensure user can only export their own shifts (or admins can export all)
        if ($shift->staff_id !== $user->id && ! $user->isAdmin()) {
            abort(403);
        }

        $shift->load(['staff', 'tollGate']);

        // Get passages during this shift
        $passages = TollPassage::where('toll_gate_id', $shift->toll_gate_id)
            ->where('created_at', '>=', $shift->clock_in_at)
            ->when($shift->clock_out_at, fn ($q) => $q->where('created_at', '<=', $shift->clock_out_at))
            ->with(['user', 'vehicle'])
            ->latest()
            ->get();

        $csv = "Shift Report - {$shift->tollGate->name}\n";
        $csv .= "Staff: {$shift->staff->name}\n";
        $csv .= "Clock In: {$shift->clock_in_at->format('Y-m-d H:i:s')}\n";
        $csv .= 'Clock Out: '.($shift->clock_out_at ? $shift->clock_out_at->format('Y-m-d H:i:s') : 'N/A')."\n";
        $csv .= "Total Revenue: ₱{$shift->total_revenue}\n";
        $csv .= "Total Passages: {$shift->total_passages}\n\n";

        $csv .= "Time,Status,Driver,Vehicle,Amount,Payment Method\n";

        foreach ($passages as $passage) {
            $csv .= sprintf(
                "%s,%s,%s,%s,%s,%s\n",
                $passage->scanned_at->format('Y-m-d H:i:s'),
                $passage->status,
                $passage->user->name ?? 'N/A',
                $passage->vehicle ? "{$passage->vehicle->make} {$passage->vehicle->model} ({$passage->vehicle->registration_number})" : 'N/A',
                $passage->total_amount,
                $passage->payment_method
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="shift-report-'.$shift->id.'.csv"',
        ]);
    }
}
