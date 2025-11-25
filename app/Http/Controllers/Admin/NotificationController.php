<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications.
     */
    public function index(Request $request): Response
    {
        $notifications = Notification::with('creator')
            ->withCount('recipients')
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/notifications/index', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Show the form for creating a new notification.
     */
    public function create(): Response
    {
        return Inertia::render('admin/notifications/toll-rate');
    }

    /**
     * Store a newly created notification.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:toll_rate,general,alert'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'data' => ['nullable', 'array'],
        ]);

        $notification = Notification::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'sent_at' => now(),
        ]);

        // Send to all drivers
        $drivers = User::where('role', 'driver')->pluck('id');

        foreach ($drivers as $driverId) {
            NotificationRecipient::create([
                'notification_id' => $notification->id,
                'user_id' => $driverId,
            ]);
        }

        return redirect()->route('admin.notifications.index')
            ->with('success', 'Notification sent to '.count($drivers).' drivers successfully.');
    }

    /**
     * Show the form for sending toll rate notification.
     */
    public function createTollRate(): Response
    {
        return Inertia::render('admin/notifications/toll-rate');
    }

    /**
     * Send toll rate notification to all drivers.
     */
    public function sendTollRate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'previous_rate' => ['required', 'numeric', 'min:0'],
            'new_rate' => ['required', 'numeric', 'min:0'],
            'effective_date' => ['required', 'date', 'after:today'],
            'reason' => ['nullable', 'string'],
        ]);

        $notification = Notification::create([
            'type' => 'toll_rate',
            'title' => 'Toll Rate Update',
            'message' => "The toll rates will be updated from MWK {$validated['previous_rate']} to MWK {$validated['new_rate']} effective {$validated['effective_date']}."
                .($validated['reason'] ? " Reason: {$validated['reason']}" : ''),
            'data' => [
                'previous_rate' => $validated['previous_rate'],
                'new_rate' => $validated['new_rate'],
                'effective_date' => $validated['effective_date'],
                'reason' => $validated['reason'] ?? null,
            ],
            'created_by' => $request->user()->id,
            'sent_at' => now(),
        ]);

        // Send to all drivers
        $drivers = User::where('role', 'driver')->pluck('id');

        foreach ($drivers as $driverId) {
            NotificationRecipient::create([
                'notification_id' => $notification->id,
                'user_id' => $driverId,
            ]);
        }

        return redirect()->route('admin.notifications.index')
            ->with('success', 'Toll rate notification sent to '.count($drivers).' drivers successfully.');
    }

    /**
     * Display the specified notification.
     */
    public function show(Notification $notification): Response
    {
        $notification->load(['creator', 'recipients.user']);

        return Inertia::render('admin/notifications/index', [
            'notification' => $notification,
        ]);
    }
}
