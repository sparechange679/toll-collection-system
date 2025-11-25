<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('toll_gates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location');
            $table->string('gate_identifier')->unique();
            $table->decimal('base_toll_rate', 10, 2)->default(50.00);
            $table->decimal('overweight_fine_rate', 10, 2)->default(200.00);
            $table->decimal('weight_limit_kg', 10, 2)->default(5000.00);
            $table->boolean('is_active')->default(true);
            $table->string('gate_status')->default('closed'); // open, closed, malfunction
            $table->string('rfid_scanner_status')->default('operational'); // operational, offline, error
            $table->string('weight_sensor_status')->default('operational'); // operational, offline, error
            $table->timestamp('last_heartbeat')->nullable();
            $table->json('hardware_info')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('toll_gates');
    }
};
