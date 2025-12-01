<?php

use App\Models\TollGate;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('verifyRfid successfully processes toll payment', function () {
    // Create test user with sufficient balance
    $user = User::factory()->create(['balance' => 10000.00]);

    // Create toll gate
    $tollGate = TollGate::create([
        'name' => 'Main Gate',
        'location' => 'Test Location',
        'gate_identifier' => 'GATE-001',
        'base_toll_rate' => 500,
        'overweight_fine_rate' => 1000,
        'weight_limit_kg' => 5000,
        'is_active' => true,
        'gate_status' => 'operational',
        'rfid_scanner_status' => 'operational',
        'weight_sensor_status' => 'operational',
    ]);

    // Create vehicle with RFID tag
    $vehicle = Vehicle::create([
        'user_id' => $user->id,
        'rfid_tag' => '93 EA DA 91',
        'registration_number' => 'ABC123',
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
        'color' => 'White',
        'vehicle_type' => 'car',
        'is_active' => true,
    ]);

    // Send RFID verification request (same as Arduino)
    $response = $this->postJson('/api/toll-gate/verify-rfid', [
        'rfid_uid' => '93 EA DA 91',
        'toll_gate_id' => $tollGate->id,
        'weight_kg' => 0.553333252,
    ]);

    // Assert successful response
    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'message' => 'Access granted - Toll deducted',
        ]);

    // Verify transaction was created with correct type
    $transaction = Transaction::where('user_id', $user->id)->first();
    expect($transaction)->not->toBeNull()
        ->and($transaction->type)->toBe('debit')
        ->and($transaction->amount)->toBe('-500.00')
        ->and($transaction->description)->toContain('Toll payment');

    // Verify user balance was deducted
    $user->refresh();
    expect($user->balance)->toBe('9500.00');
});

test('verifyRfid handles insufficient balance correctly', function () {
    // Create test user with insufficient balance
    $user = User::factory()->create(['balance' => 100.00]);

    // Create toll gate
    $tollGate = TollGate::create([
        'name' => 'Main Gate',
        'location' => 'Test Location',
        'gate_identifier' => 'GATE-001',
        'base_toll_rate' => 500,
        'overweight_fine_rate' => 1000,
        'weight_limit_kg' => 5000,
        'is_active' => true,
        'gate_status' => 'operational',
        'rfid_scanner_status' => 'operational',
        'weight_sensor_status' => 'operational',
    ]);

    // Create vehicle with RFID tag
    $vehicle = Vehicle::create([
        'user_id' => $user->id,
        'rfid_tag' => '93 EA DA 91',
        'registration_number' => 'ABC123',
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
        'color' => 'White',
        'vehicle_type' => 'car',
        'is_active' => true,
    ]);

    // Send RFID verification request
    $response = $this->postJson('/api/toll-gate/verify-rfid', [
        'rfid_uid' => '93 EA DA 91',
        'toll_gate_id' => $tollGate->id,
        'weight_kg' => 0.553333252,
    ]);

    // Assert error response
    $response->assertStatus(402)
        ->assertJson([
            'success' => false,
            'message' => 'Insufficient balance',
            'error_code' => 'INSUFFICIENT_BALANCE',
        ]);

    // Verify no transaction was created
    expect(Transaction::where('user_id', $user->id)->count())->toBe(0);

    // Verify user balance unchanged
    $user->refresh();
    expect($user->balance)->toBe('100.00');
});

test('verifyRfid handles unregistered RFID tag', function () {
    // Create toll gate
    $tollGate = TollGate::create([
        'name' => 'Main Gate',
        'location' => 'Test Location',
        'gate_identifier' => 'GATE-001',
        'base_toll_rate' => 500,
        'overweight_fine_rate' => 1000,
        'weight_limit_kg' => 5000,
        'is_active' => true,
        'gate_status' => 'operational',
        'rfid_scanner_status' => 'operational',
        'weight_sensor_status' => 'operational',
    ]);

    // Send RFID verification request with non-existent tag
    $response = $this->postJson('/api/toll-gate/verify-rfid', [
        'rfid_uid' => 'UNKNOWN TAG',
        'toll_gate_id' => $tollGate->id,
        'weight_kg' => 0.553333252,
    ]);

    // Assert error response
    $response->assertNotFound()
        ->assertJson([
            'success' => false,
            'message' => 'RFID tag not registered or vehicle inactive',
            'error_code' => 'RFID_NOT_FOUND',
        ]);
});

test('verifyRfid applies overweight fine correctly', function () {
    // Create test user with sufficient balance
    $user = User::factory()->create(['balance' => 10000.00]);

    // Create toll gate with weight limit
    $tollGate = TollGate::create([
        'name' => 'Main Gate',
        'location' => 'Test Location',
        'gate_identifier' => 'GATE-001',
        'base_toll_rate' => 500,
        'overweight_fine_rate' => 1000,
        'weight_limit_kg' => 5000,
        'is_active' => true,
        'gate_status' => 'operational',
        'rfid_scanner_status' => 'operational',
        'weight_sensor_status' => 'operational',
    ]);

    // Create vehicle
    $vehicle = Vehicle::create([
        'user_id' => $user->id,
        'rfid_tag' => '93 EA DA 91',
        'registration_number' => 'ABC123',
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2020,
        'color' => 'White',
        'vehicle_type' => 'car',
        'is_active' => true,
    ]);

    // Send RFID verification request with overweight vehicle
    $response = $this->postJson('/api/toll-gate/verify-rfid', [
        'rfid_uid' => '93 EA DA 91',
        'toll_gate_id' => $tollGate->id,
        'weight_kg' => 6000, // Exceeds 5000 kg limit
    ]);

    // Assert successful response
    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
        ]);

    // Verify transaction includes toll + fine
    $transaction = Transaction::where('user_id', $user->id)->first();
    expect($transaction)->not->toBeNull()
        ->and($transaction->type)->toBe('debit')
        ->and($transaction->amount)->toBe('-1500.00'); // 500 toll + 1000 fine

    // Verify user balance was deducted correctly
    $user->refresh();
    expect($user->balance)->toBe('8500.00');
});
