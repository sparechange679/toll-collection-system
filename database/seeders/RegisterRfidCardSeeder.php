<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class RegisterRfidCardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find user ID 2
        $user = User::find(2);

        if (! $user) {
            $this->command->error('User ID 2 not found!');

            return;
        }

        // Find their vehicle
        $vehicle = Vehicle::where('user_id', $user->id)->first();

        if (! $vehicle) {
            $this->command->error('No vehicle found for user ID 2!');

            return;
        }

        // Register RFID card
        $vehicle->rfid_tag = '93 EA DA 91';
        $vehicle->save();

        // Set initial balance for testing
        $user->balance = 10000;
        $user->save();

        $this->command->info('✓ RFID card "93 EA DA 91" registered to:');
        $this->command->info("  User: {$user->name} (ID: {$user->id})");
        $this->command->info("  Email: {$user->email}");
        $this->command->info("  Vehicle: {$vehicle->registration_number} - {$vehicle->make} {$vehicle->model}");
        $this->command->info("  New Balance: {$user->balance}");
    }
}
