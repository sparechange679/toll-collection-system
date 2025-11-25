<?php

use App\Http\Controllers\Api\ArduinoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Arduino API endpoints for hardware integration
Route::prefix('arduino')->name('arduino.')->group(function () {
    Route::post('/scan', [ArduinoController::class, 'processRfidScan'])->name('scan');
    Route::post('/hardware-status', [ArduinoController::class, 'updateHardwareStatus'])->name('hardware-status');
    Route::post('/heartbeat', [ArduinoController::class, 'heartbeat'])->name('heartbeat');
});
