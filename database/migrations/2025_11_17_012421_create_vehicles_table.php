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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('registration_number')->unique();
            $table->string('make');
            $table->string('model');
            $table->integer('year');
            $table->enum('vehicle_type', ['car', 'bus', 'truck', 'motorcycle', 'emergency', 'government']);
            $table->string('color')->nullable();
            $table->decimal('weight', 8, 2)->nullable();
            $table->string('rfid_tag')->unique()->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
