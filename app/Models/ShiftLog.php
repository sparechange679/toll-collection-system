<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ShiftLog extends Model
{
    protected $fillable = [
        'staff_id',
        'toll_gate_id',
        'clock_in_at',
        'clock_out_at',
        'total_passages',
        'successful_passages',
        'rejected_passages',
        'manual_overrides',
        'cash_payments',
        'incidents_reported',
        'total_revenue',
        'cash_collected',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'clock_in_at' => 'datetime',
            'clock_out_at' => 'datetime',
            'total_revenue' => 'decimal:2',
            'cash_collected' => 'decimal:2',
        ];
    }

    /**
     * Get the staff member that owns the shift log.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * Get the toll gate that owns the shift log.
     */
    public function tollGate(): BelongsTo
    {
        return $this->belongsTo(TollGate::class);
    }

    /**
     * Get the handover note for this shift.
     */
    public function handoverNote(): HasOne
    {
        return $this->hasOne(HandoverNote::class);
    }

    /**
     * Check if the shift is currently active.
     */
    public function isActive(): bool
    {
        return $this->clock_out_at === null;
    }

    /**
     * Get the shift duration in minutes.
     */
    public function getDurationInMinutes(): ?int
    {
        if (! $this->clock_out_at) {
            return null;
        }

        return $this->clock_in_at->diffInMinutes($this->clock_out_at);
    }
}
