<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    /**
     * Display all registered vehicles.
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $vehicleType = $request->get('vehicle_type');
        $status = $request->get('status');

        $vehicles = Vehicle::with(['user:id,name,email'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('registration_number', 'like', "%{$search}%")
                        ->orWhere('make', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($vehicleType, function ($query, $vehicleType) {
                $query->where('vehicle_type', $vehicleType);
            })
            ->when($status !== null, function ($query) use ($status) {
                $query->where('is_active', $status === 'active');
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $statistics = [
            'total' => Vehicle::count(),
            'active' => Vehicle::where('is_active', true)->count(),
            'inactive' => Vehicle::where('is_active', false)->count(),
            'by_type' => Vehicle::select('vehicle_type', DB::raw('COUNT(*) as count'))
                ->groupBy('vehicle_type')
                ->get(),
        ];

        return Inertia::render('admin/vehicles/index', [
            'vehicles' => $vehicles,
            'statistics' => $statistics,
            'filters' => [
                'search' => $search,
                'vehicle_type' => $vehicleType,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Display all registered users and their vehicles.
     */
    public function users(Request $request): Response
    {
        $search = $request->get('search');
        $role = $request->get('role', 'driver');

        $users = User::where('role', $role)
            ->with(['vehicles', 'driverProfile'])
            ->withCount('vehicles')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $statistics = [
            'total_users' => User::where('role', 'driver')->count(),
            'active_users' => User::where('role', 'driver')
                ->where('onboarding_completed', true)
                ->count(),
            'total_vehicles' => Vehicle::count(),
            'users_with_vehicles' => User::where('role', 'driver')
                ->has('vehicles')
                ->count(),
        ];

        return Inertia::render('admin/vehicles/users', [
            'users' => $users,
            'statistics' => $statistics,
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
        ]);
    }

    /**
     * Display details of a specific vehicle.
     */
    public function show(Vehicle $vehicle): Response
    {
        $vehicle->load(['user.driverProfile', 'user.transactions' => function ($query) {
            $query->latest()->limit(10);
        }]);

        return Inertia::render('admin/vehicles/show', [
            'vehicle' => $vehicle,
        ]);
    }

    /**
     * Export vehicles list.
     */
    public function export(Request $request)
    {
        $vehicleType = $request->get('vehicle_type');
        $status = $request->get('status');

        $vehicles = Vehicle::with(['user:id,name,email'])
            ->when($vehicleType, function ($query, $vehicleType) {
                $query->where('vehicle_type', $vehicleType);
            })
            ->when($status !== null, function ($query) use ($status) {
                $query->where('is_active', $status === 'active');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $csv = "Registration Number,Owner Name,Owner Email,Make,Model,Year,Type,Color,Status,Registered Date\n";

        foreach ($vehicles as $vehicle) {
            $csv .= sprintf(
                "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                $vehicle->registration_number,
                $vehicle->user->name ?? 'N/A',
                $vehicle->user->email ?? 'N/A',
                $vehicle->make,
                $vehicle->model,
                $vehicle->year,
                $vehicle->vehicle_type,
                $vehicle->color ?? 'N/A',
                $vehicle->is_active ? 'Active' : 'Inactive',
                $vehicle->created_at->format('Y-m-d H:i:s')
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="vehicles-registry-'.now()->format('Y-m-d').'.csv"',
        ]);
    }
}
