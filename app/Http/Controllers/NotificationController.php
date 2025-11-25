<?php

namespace App\Http\Controllers;

use App\Models\NotificationRecipient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display a listing of the user's notifications.
     */
    public function index(Request $request): Response
    {
        $notifications = NotificationRecipient::with('notification.creator')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        // Mark all as read when viewing the page
        NotificationRecipient::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        // Render the driver-facing notifications page (moved under pages/driver/notifications)
        return Inertia::render('driver/notifications/index', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, NotificationRecipient $notification): RedirectResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return back();
    }

    /**
     * Get unread notification count.
     */
    public function unreadCount(Request $request)
    {
        $count = NotificationRecipient::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }
}
