<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Services\TollGateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DriverLookupController extends Controller
{
    public function __construct(
        public TollGateService $tollGateService
    ) {}

    /**
     * Display driver lookup page.
     */
    public function index()
    {
        return Inertia::render('staff/driver-lookup/index');
    }

    /**
     * Search for a driver by RFID or registration number.
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'rfid_tag' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:255',
        ]);

        if (empty($validated['rfid_tag']) && empty($validated['registration_number'])) {
            return back()->withErrors(['error' => 'Please provide either RFID tag or registration number']);
        }

        $result = $this->tollGateService->lookupDriver(
            $validated['rfid_tag'] ?? null,
            $validated['registration_number'] ?? null
        );

        if (! $result) {
            return back()->withErrors(['error' => 'Driver not found']);
        }

        return Inertia::render('staff/driver-lookup/index', [
            'searchResult' => $result,
        ]);
    }
}
