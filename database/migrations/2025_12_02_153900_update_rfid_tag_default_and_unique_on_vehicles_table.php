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
        // 1) Drop the unique constraint on rfid_tag so duplicates are allowed
        Schema::table('vehicles', function (Blueprint $table) {
            // By convention, the index name is "vehicles_rfid_tag_unique"
            // Using the column array form to be database agnostic
            $table->dropUnique(['rfid_tag']);
        });

        // 2) Set the default value for rfid_tag
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('rfid_tag')->nullable()->default('93 EA DA 91')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1) Remove the default value (set back to null default)
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('rfid_tag')->nullable()->default(null)->change();
        });

        // 2) Re-add the unique constraint
        Schema::table('vehicles', function (Blueprint $table) {
            $table->unique('rfid_tag');
        });
    }
};
