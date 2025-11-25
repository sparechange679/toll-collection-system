<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    /**
     * Display a listing of the user's vehicles.
     */
    public function index(Request $request): Response
    {
        $vehicles = $request->user()->vehicles()->latest()->get();
        $canAddMore = $vehicles->count() < 3;

        return Inertia::render('driver/vehicles/index', compact('vehicles', 'canAddMore'));
    }

    /**
     * Show the form for creating a new vehicle.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->user()->vehicles()->count() >= 3) {
            return redirect()->route('vehicles.index')
                ->with('error', 'You can only register up to 3 vehicles.');
        }

        return Inertia::render('driver/vehicles/create');
    }

    /**
     * Store a newly created vehicle in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->vehicles()->count() >= 3) {
            return redirect()->route('vehicles.index')
                ->with('error', 'You can only register up to 3 vehicles.');
        }

        $validated = $request->validate([
            'make' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'year' => ['required', 'integer', 'min:1900', 'max:'.(date('Y') + 1)],
            'vehicle_type' => ['required', 'string', 'in:car,motorcycle,truck,bus,van'],
            'color' => ['nullable', 'string', 'max:255'],
        ]);

        $registrationNumber = $this->generateRegistrationNumber();

        $request->user()->vehicles()->create([
            ...$validated,
            'registration_number' => $registrationNumber,
            'is_active' => true,
        ]);

        return redirect()->route('vehicles.index')
            ->with('success', 'Vehicle registered successfully.');
    }

    /**
     * Show the form for editing the specified vehicle.
     */
    public function edit(Request $request, Vehicle $vehicle): Response|RedirectResponse
    {
        if ($vehicle->user_id !== $request->user()->id) {
            abort(403);
        }

        return Inertia::render('driver/vehicles/edit', [
            'vehicle' => $vehicle,
        ]);
    }

    /**
     * Update the specified vehicle in storage.
     */
    public function update(Request $request, Vehicle $vehicle): RedirectResponse
    {
        if ($vehicle->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'make' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'year' => ['required', 'integer', 'min:1900', 'max:'.(date('Y') + 1)],
            'vehicle_type' => ['required', 'string', 'in:car,motorcycle,truck,bus,van'],
            'color' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $vehicle->update($validated);

        return redirect()->route('vehicles.index')
            ->with('success', 'Vehicle updated successfully.');
    }

    /**
     * Remove the specified vehicle from storage.
     */
    public function destroy(Request $request, Vehicle $vehicle): RedirectResponse
    {
        if ($vehicle->user_id !== $request->user()->id) {
            abort(403);
        }

        $vehicle->delete();

        return redirect()->route('vehicles.index')
            ->with('success', 'Vehicle removed successfully.');
    }

    /**
     * Generate a unique registration number for the vehicle.
     */
    private function generateRegistrationNumber(): string
    {
        do {
            $number = 'VEH'.strtoupper(substr(uniqid(), -8));
        } while (Vehicle::where('registration_number', $number)->exists());

        return $number;
    }
}
