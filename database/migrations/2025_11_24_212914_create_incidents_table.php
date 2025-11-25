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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('toll_gate_id')->constrained()->onDelete('cascade');
            $table->foreignId('reported_by')->constrained('users')->onDelete('cascade');
            $table->string('incident_type'); // hardware_failure, vehicle_breakdown, accident, vandalism, power_outage, suspicious_activity, other
            $table->string('severity'); // low, medium, high, critical
            $table->string('status')->default('reported'); // reported, acknowledged, in_progress, resolved
            $table->string('title');
            $table->text('description');
            $table->text('action_taken')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('occurred_at');
            $table->timestamp('resolved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['toll_gate_id', 'created_at']);
            $table->index('incident_type');
            $table->index('status');
            $table->index('severity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
