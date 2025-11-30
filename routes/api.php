<?php

use App\Http\Controllers\Api\ArduinoController;
use App\Http\Controllers\Api\TollGateController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Toll Gate API endpoints for ESP32 hardware
Route::prefix('toll-gate')->name('toll-gate.')->group(function () {
    Route::post('/verify-rfid', [TollGateController::class, 'verifyRfid'])->name('verify-rfid');
    Route::get('/status', [TollGateController::class, 'getStatus'])->name('status');
});

// Arduino API endpoints for hardware integration (legacy)
Route::prefix('arduino')->name('arduino.')->group(function () {
    Route::post('/scan', [ArduinoController::class, 'processRfidScan'])->name('scan');
    Route::post('/hardware-status', [ArduinoController::class, 'updateHardwareStatus'])->name('hardware-status');
    Route::post('/heartbeat', [ArduinoController::class, 'heartbeat'])->name('heartbeat');
});
