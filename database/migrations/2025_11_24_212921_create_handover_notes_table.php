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
        Schema::create('handover_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('toll_gate_id')->constrained()->onDelete('cascade');
            $table->foreignId('from_staff_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('to_staff_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('shift_log_id')->nullable()->constrained()->onDelete('set null');
            $table->text('notes');
            $table->json('pending_issues')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['toll_gate_id', 'created_at']);
            $table->index('from_staff_id');
            $table->index('to_staff_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('handover_notes');
    }
};
