<?php

namespace Database\Seeders;

use App\Models\TollGate;
use Illuminate\Database\Seeder;

class TollGateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        TollGate::create([
            'name' => 'Main Gate',
            'location' => 'Main Entrance',
            'gate_identifier' => 'GATE-001',
            'base_toll_rate' => 500,
            'overweight_fine_rate' => 1000,
            'weight_limit_kg' => 5000,
            'is_active' => true,
            'gate_status' => 'operational',
            'rfid_scanner_status' => 'operational',
            'weight_sensor_status' => 'operational',
        ]);

        $this->command->info('✓ Toll gate created successfully!');
        $this->command->info('  Gate ID: 1');
        $this->command->info('  Name: Main Gate');
        $this->command->info('  Toll Rate: 500.00');
        $this->command->info('  Weight Limit: 5000 kg');
    }
}
