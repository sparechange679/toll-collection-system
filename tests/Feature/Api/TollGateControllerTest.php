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
        'weight' => 5000, // Vehicle weight capacity
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

test('verifyRfid allows governmental vehicles to pass without payment', function () {
    // Create test user with driver profile (governmental license)
    $user = User::factory()->create(['balance' => 10000.00, 'role' => 'driver']);

    // Create driver profile with MG license number (governmental)
    \App\Models\DriverProfile::create([
        'user_id' => $user->id,
        'license_number' => 'MG12345',
        'license_expiry_date' => now()->addYears(5),
        'phone_number' => '+250 788 123 456',
        'address' => '123 Test St',
        'city' => 'Kigali',
        'district' => 'Gasabo',
        'date_of_birth' => now()->subYears(30),
        'id_number' => 'ID123456789',
    ]);

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

    // Create governmental vehicle
    $vehicle = Vehicle::create([
        'user_id' => $user->id,
        'rfid_tag' => 'AA BB CC DD',
        'registration_number' => 'GOV-001',
        'make' => 'Toyota',
        'model' => 'Land Cruiser',
        'year' => 2024,
        'color' => 'White',
        'vehicle_type' => 'government',
        'weight' => 3000,
        'is_active' => true,
    ]);

    // Send RFID verification request
    $response = $this->postJson('/api/toll-gate/verify-rfid', [
        'rfid_uid' => 'AA BB CC DD',
        'toll_gate_id' => $tollGate->id,
        'weight_kg' => 2500,
    ]);

    // Assert successful response with no charge
    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'message' => 'Access granted - Governmental vehicle (No charge)',
            'data' => [
                'amount_deducted' => '0.00',
                'toll_amount' => '0.00',
                'fine_amount' => '0.00',
                'is_governmental' => true,
            ],
        ]);

    // Verify NO transaction was created (no payment)
    $transaction = Transaction::where('user_id', $user->id)->first();
    expect($transaction)->toBeNull();

    // Verify user balance was NOT deducted
    $user->refresh();
    expect($user->balance)->toBe('10000.00');

    // Verify toll passage was recorded
    $passage = \App\Models\TollPassage::where('user_id', $user->id)->first();
    expect($passage)->not->toBeNull()
        ->and($passage->toll_amount)->toBe('0.00')
        ->and($passage->fine_amount)->toBe('0.00')
        ->and($passage->total_amount)->toBe('0.00')
        ->and($passage->payment_method)->toBe('governmental_exemption')
        ->and($passage->status)->toBe('successful');
});
