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
        Schema::create('shift_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('toll_gate_id')->constrained()->onDelete('cascade');
            $table->timestamp('clock_in_at');
            $table->timestamp('clock_out_at')->nullable();
            $table->integer('total_passages')->default(0);
            $table->integer('successful_passages')->default(0);
            $table->integer('rejected_passages')->default(0);
            $table->integer('manual_overrides')->default(0);
            $table->integer('cash_payments')->default(0);
            $table->integer('incidents_reported')->default(0);
            $table->decimal('total_revenue', 10, 2)->default(0);
            $table->decimal('cash_collected', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['staff_id', 'clock_in_at']);
            $table->index('toll_gate_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_logs');
    }
};
