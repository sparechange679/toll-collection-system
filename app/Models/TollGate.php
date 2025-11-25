<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TollGate extends Model
{
    protected $fillable = [
        'name',
        'location',
        'gate_identifier',
        'base_toll_rate',
        'overweight_fine_rate',
        'weight_limit_kg',
        'is_active',
        'gate_status',
        'rfid_scanner_status',
        'weight_sensor_status',
        'last_heartbeat',
        'hardware_info',
    ];

    protected function casts(): array
    {
        return [
            'base_toll_rate' => 'decimal:2',
            'overweight_fine_rate' => 'decimal:2',
            'weight_limit_kg' => 'decimal:2',
            'is_active' => 'boolean',
            'last_heartbeat' => 'datetime',
            'hardware_info' => 'array',
        ];
    }

    /**
     * Get the toll passages for the gate.
     */
    public function tollPassages(): TollGate|HasMany
    {
        return $this->hasMany(TollPassage::class);
    }

    /**
     * Get the shift logs for the gate.
     */
    public function shiftLogs(): TollGate|HasMany
    {
        return $this->hasMany(ShiftLog::class);
    }

    /**
     * Get the manual transactions for the gate.
     */
    public function manualTransactions(): TollGate|HasMany
    {
        return $this->hasMany(ManualTransaction::class);
    }

    /**
     * Get the incidents for the gate.
     */
    public function incidents(): TollGate|HasMany
    {
        return $this->hasMany(Incident::class);
    }

    /**
     * Get the handover notes for the gate.
     */
    public function handoverNotes(): TollGate|HasMany
    {
        return $this->hasMany(HandoverNote::class);
    }

    /**
     * Check if the gate is operational.
     */
    public function isOperational(): bool
    {
        return $this->is_active
            && $this->gate_status !== 'malfunction'
            && $this->rfid_scanner_status === 'operational'
            && $this->weight_sensor_status === 'operational';
    }
}
