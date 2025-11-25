<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Display reports dashboard.
     */
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        // Revenue Statistics
        $totalRevenue = Transaction::where('type', 'debit')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->sum('amount');

        $dailyRevenue = Transaction::where('type', 'debit')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as total'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Transaction Statistics
        $totalTransactions = Transaction::where('type', 'debit')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->count();

        $transactionsByType = Transaction::whereBetween('created_at', [$dateFrom, $dateTo])
            ->select('type', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->get();

        // User Statistics
        $totalDrivers = User::where('role', 'driver')->count();
        $activeDrivers = User::where('role', 'driver')
            ->where('onboarding_completed', true)
            ->count();

        // Vehicle Statistics
        $totalVehicles = Vehicle::count();
        $activeVehicles = Vehicle::where('is_active', true)->count();
        $vehiclesByType = Vehicle::select('vehicle_type', DB::raw('COUNT(*) as count'))
            ->groupBy('vehicle_type')
            ->get();

        // Top Revenue Generators
        $topUsers = Transaction::where('type', 'debit')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->select('user_id', DB::raw('SUM(amount) as total_spent'), DB::raw('COUNT(*) as transaction_count'))
            ->groupBy('user_id')
            ->orderByDesc('total_spent')
            ->limit(10)
            ->with('user:id,name,email')
            ->get();

        return Inertia::render('admin/reports/index', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'revenue' => [
                'total' => $totalRevenue,
                'daily' => $dailyRevenue,
            ],
            'transactions' => [
                'total' => $totalTransactions,
                'by_type' => $transactionsByType,
            ],
            'users' => [
                'total_drivers' => $totalDrivers,
                'active_drivers' => $activeDrivers,
            ],
            'vehicles' => [
                'total' => $totalVehicles,
                'active' => $activeVehicles,
                'by_type' => $vehiclesByType,
            ],
            'top_users' => $topUsers,
        ]);
    }

    /**
     * Export revenue report.
     */
    public function exportRevenue(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        $transactions = Transaction::where('type', 'debit')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        $csv = "Date,User,Email,Amount,Description,Reference\n";

        foreach ($transactions as $transaction) {
            $csv .= sprintf(
                "%s,%s,%s,%s,%s,%s\n",
                $transaction->created_at->format('Y-m-d H:i:s'),
                $transaction->user->name ?? 'N/A',
                $transaction->user->email ?? 'N/A',
                $transaction->amount,
                str_replace(',', ' ', $transaction->description ?? ''),
                $transaction->reference ?? ''
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="revenue-report-'.$dateFrom.'-to-'.$dateTo.'.csv"',
        ]);
    }

    /**
     * Export toll gate usage report.
     */
    public function exportUsage(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));

        $transactions = Transaction::where('type', 'debit')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->with(['user:id,name,email', 'user.vehicles'])
            ->orderBy('created_at', 'desc')
            ->get();

        $csv = "Date,User,Email,Vehicle,Amount,Description\n";

        foreach ($transactions as $transaction) {
            $vehicle = $transaction->user->vehicles->first();
            $csv .= sprintf(
                "%s,%s,%s,%s,%s,%s\n",
                $transaction->created_at->format('Y-m-d H:i:s'),
                $transaction->user->name ?? 'N/A',
                $transaction->user->email ?? 'N/A',
                $vehicle ? "{$vehicle->make} {$vehicle->model} ({$vehicle->registration_number})" : 'N/A',
                $transaction->amount,
                str_replace(',', ' ', $transaction->description ?? '')
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="toll-usage-report-'.$dateFrom.'-to-'.$dateTo.'.csv"',
        ]);
    }
}
