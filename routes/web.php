<?php

use App\Http\Controllers\OtpController;
use App\Services\WalletService;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// OTP Routes
Route::prefix('otp')->group(function () {
    Route::post('/request', [OtpController::class, 'requestOtp'])->name('otp.request');
    Route::post('/verify', [OtpController::class, 'verifyOtp'])->name('otp.verify');
    Route::get('/check', [OtpController::class, 'checkVerification'])->name('otp.check');
});

// Admin Registration (OTP Protected)
Route::get('/register/admin', function () {
    return Inertia::render('auth/register-admin');
})->middleware('otp.verified')->name('register.admin');

// Driver Onboarding
Route::middleware(['auth', 'verified', 'role:driver'])->group(function () {
    Route::get('/onboarding', function () {
        if (auth()->user()->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        // Page moved to resources/js/pages/driver/onboarding/driver-onboarding.tsx
        return Inertia::render('driver/onboarding/driver-onboarding');
    })->name('onboarding');

    Route::post('/onboarding/complete', [App\Http\Controllers\OnboardingController::class, 'complete'])
        ->name('onboarding.complete');

    // Document Upload and Verification Routes
    Route::post('/documents/upload', [App\Http\Controllers\DocumentController::class, 'upload'])
        ->name('documents.upload');
    Route::get('/documents/status', [App\Http\Controllers\DocumentController::class, 'status'])
        ->name('documents.status');
    Route::post('/documents/{document}/retry', [App\Http\Controllers\DocumentController::class, 'retry'])
        ->name('documents.retry');
});

// Stripe Webhook (No Auth Required)
Route::post('/stripe/webhook', [App\Http\Controllers\StripeWebhookController::class, 'handle'])
    ->name('stripe.webhook');

// Role-based Dashboards
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();

        // Redirect drivers to onboarding if not completed
        if ($user->isDriver() && ! $user->onboarding_completed) {
            return redirect()->route('onboarding');
        }

        // Role-based dashboard rendering
        if ($user->isAdmin()) {
            return Inertia::render('dashboards/admin-dashboard');
        } elseif ($user->isStaff()) {
            return Inertia::render('dashboards/staff-dashboard');
        } else {
            /** @var WalletService $walletService */
            $walletService = app(WalletService::class);

            // Get user's vehicles count
            $vehiclesCount = $user->vehicles()->count();

            // Get recent trips count (this month)
            $recentTripsCount = \App\Models\TollPassage::where('user_id', $user->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            return Inertia::render('dashboards/driver-dashboard', [
                'transactions_summary' => $walletService->getDailyTransactionsSummary($user, 14),
                'vehicles_count' => $vehiclesCount,
                'recent_trips_count' => $recentTripsCount,
            ]);
        }
    })->name('dashboard');

    // Vehicle Routes (Drivers only)
    Route::middleware('role:driver')->group(function () {
        Route::resource('vehicles', App\Http\Controllers\VehicleController::class);
    });

    // Notification Routes (All authenticated users)
    Route::get('notifications', [App\Http\Controllers\NotificationController::class, 'index'])
        ->name('notifications.index');
    Route::get('notifications/unread-count', [App\Http\Controllers\NotificationController::class, 'unreadCount'])
        ->name('notifications.unread-count');
    Route::post('notifications/{notification}/mark-as-read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])
        ->name('notifications.mark-as-read');

    // Admin Routes
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        // Notifications
        Route::get('notifications', [App\Http\Controllers\Admin\NotificationController::class, 'index'])
            ->name('notifications.index');
        Route::get('notifications/create', [App\Http\Controllers\Admin\NotificationController::class, 'create'])
            ->name('notifications.create');
        Route::post('notifications', [App\Http\Controllers\Admin\NotificationController::class, 'store'])
            ->name('notifications.store');
        Route::get('notifications/toll-rate', [App\Http\Controllers\Admin\NotificationController::class, 'createTollRate'])
            ->name('notifications.toll-rate');
        Route::post('notifications/toll-rate', [App\Http\Controllers\Admin\NotificationController::class, 'sendTollRate'])
            ->name('notifications.send-toll-rate');
        Route::get('notifications/{notification}', [App\Http\Controllers\Admin\NotificationController::class, 'show'])
            ->name('notifications.show');

        // Reports
        Route::get('reports', [App\Http\Controllers\Admin\ReportController::class, 'index'])
            ->name('reports.index');
        Route::get('reports/export/revenue', [App\Http\Controllers\Admin\ReportController::class, 'exportRevenue'])
            ->name('reports.export.revenue');
        Route::get('reports/export/usage', [App\Http\Controllers\Admin\ReportController::class, 'exportUsage'])
            ->name('reports.export.usage');

        // Vehicle Registry
        Route::get('vehicles', [App\Http\Controllers\Admin\VehicleController::class, 'index'])
            ->name('vehicles.index');
        Route::get('vehicles/users', [App\Http\Controllers\Admin\VehicleController::class, 'users'])
            ->name('vehicles.users');
        Route::get('vehicles/export', [App\Http\Controllers\Admin\VehicleController::class, 'export'])
            ->name('vehicles.export');
        Route::get('vehicles/{vehicle}', [App\Http\Controllers\Admin\VehicleController::class, 'show'])
            ->name('vehicles.show');
    });

    // Staff Routes
    Route::middleware('role:staff')->prefix('staff')->name('staff.')->group(function () {
        // Dashboard
        Route::get('dashboard', [App\Http\Controllers\Staff\DashboardController::class, 'index'])
            ->name('dashboard');
        Route::get('dashboard/updates', [App\Http\Controllers\Staff\DashboardController::class, 'updates'])
            ->name('dashboard.updates');

        // Shift Management
        Route::get('shifts', [App\Http\Controllers\Staff\ShiftController::class, 'index'])
            ->name('shifts.index');
        Route::post('shifts/clock-in', [App\Http\Controllers\Staff\ShiftController::class, 'clockIn'])
            ->name('shifts.clock-in');
        Route::post('shifts/clock-out', [App\Http\Controllers\Staff\ShiftController::class, 'clockOut'])
            ->name('shifts.clock-out');
        Route::get('shifts/{shift}', [App\Http\Controllers\Staff\ShiftController::class, 'show'])
            ->name('shifts.show');
        Route::get('shifts/{shift}/export', [App\Http\Controllers\Staff\ShiftController::class, 'exportReport'])
            ->name('shifts.export');

        // Passage Logs
        Route::get('passages', [App\Http\Controllers\Staff\PassageController::class, 'index'])
            ->name('passages.index');
        Route::get('passages/{passage}', [App\Http\Controllers\Staff\PassageController::class, 'show'])
            ->name('passages.show');

        // Toll Gate Monitor
        Route::get('toll-gate-monitor', [App\Http\Controllers\Staff\TollGateMonitorController::class, 'index'])
            ->name('toll-gate-monitor');
        Route::get('toll-gate-monitor/updates', [App\Http\Controllers\Staff\TollGateMonitorController::class, 'updates'])
            ->name('toll-gate-monitor.updates');

        // Manual Transactions
        Route::post('transactions/cash-payment', [App\Http\Controllers\Staff\ManualTransactionController::class, 'processCashPayment'])
            ->name('transactions.cash-payment');
        Route::post('transactions/manual-override', [App\Http\Controllers\Staff\ManualTransactionController::class, 'processManualOverride'])
            ->name('transactions.manual-override');
        Route::post('transactions/add-fine', [App\Http\Controllers\Staff\ManualTransactionController::class, 'addFine'])
            ->name('transactions.add-fine');

        // Incidents
        Route::get('incidents', [App\Http\Controllers\Staff\IncidentController::class, 'index'])
            ->name('incidents.index');
        Route::post('incidents', [App\Http\Controllers\Staff\IncidentController::class, 'store'])
            ->name('incidents.store');
        Route::post('incidents/{incident}/status', [App\Http\Controllers\Staff\IncidentController::class, 'updateStatus'])
            ->name('incidents.update-status');

        // Driver Lookup
        Route::get('driver-lookup', [App\Http\Controllers\Staff\DriverLookupController::class, 'index'])
            ->name('driver-lookup.index');
        Route::post('driver-lookup/search', [App\Http\Controllers\Staff\DriverLookupController::class, 'search'])
            ->name('driver-lookup.search');
    });

    // Wallet Routes
    Route::prefix('wallet')->group(function () {
        Route::get('/', [App\Http\Controllers\WalletController::class, 'index'])
            ->name('wallet.index');
        Route::get('/transactions', [App\Http\Controllers\WalletController::class, 'transactions'])
            ->name('wallet.transactions');
        Route::post('/top-up', [App\Http\Controllers\WalletController::class, 'createTopUpSession'])
            ->name('wallet.top-up');
        Route::get('/success', [App\Http\Controllers\WalletController::class, 'success'])
            ->name('wallet.success');
        Route::get('/cancel', [App\Http\Controllers\WalletController::class, 'cancel'])
            ->name('wallet.cancel');
        Route::get('/balance/check', [App\Http\Controllers\WalletController::class, 'checkBalance'])
            ->name('wallet.balance.check');
        Route::get('/export/xlsx', [App\Http\Controllers\WalletController::class, 'exportXlsx'])
            ->name('wallet.export.xlsx');
        Route::get('/export/pdf', [App\Http\Controllers\WalletController::class, 'exportPdf'])
            ->name('wallet.export.pdf');
    });
});

require __DIR__.'/settings.php';
