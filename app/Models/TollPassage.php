<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TollPassage extends Model
{
    protected $fillable = [
        'toll_gate_id',
        'user_id',
        'vehicle_id',
        'staff_id',
        'rfid_tag',
        'status',
        'toll_amount',
        'fine_amount',
        'total_amount',
        'vehicle_weight_kg',
        'is_overweight',
        'payment_method',
        'rejection_reason',
        'override_reason',
        'metadata',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'toll_amount' => 'decimal:2',
            'fine_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'vehicle_weight_kg' => 'decimal:2',
            'is_overweight' => 'boolean',
            'metadata' => 'array',
            'scanned_at' => 'datetime',
        ];
    }

    /**
     * Get the toll gate that owns the passage.
     */
    public function tollGate(): BelongsTo
    {
        return $this->belongsTo(TollGate::class);
    }

    /**
     * Get the user that owns the passage.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the vehicle that owns the passage.
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * Get the staff member that processed the passage.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * Check if the passage was successful.
     */
    public function wasSuccessful(): bool
    {
        return $this->status === 'success';
    }

    /**
     * Check if the passage was rejected.
     */
    public function wasRejected(): bool
    {
        return str_starts_with($this->status, 'rejected_');
    }
}
