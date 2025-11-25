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
        Schema::create('toll_passages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('toll_gate_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('vehicle_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('staff_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('rfid_tag')->nullable();
            $table->string('status'); // success, rejected_insufficient_funds, rejected_unregistered, manual_override, cash_payment
            $table->decimal('toll_amount', 10, 2)->default(0);
            $table->decimal('fine_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('vehicle_weight_kg', 10, 2)->nullable();
            $table->boolean('is_overweight')->default(false);
            $table->string('payment_method')->default('wallet'); // wallet, cash, manual_override
            $table->text('rejection_reason')->nullable();
            $table->text('override_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('scanned_at');
            $table->timestamps();

            $table->index(['toll_gate_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('toll_passages');
    }
};
