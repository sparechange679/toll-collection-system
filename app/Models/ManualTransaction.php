<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManualTransaction extends Model
{
    protected $fillable = [
        'toll_gate_id',
        'staff_id',
        'user_id',
        'transaction_type',
        'amount',
        'vehicle_registration',
        'driver_name',
        'driver_contact',
        'reason',
        'notes',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the toll gate that owns the manual transaction.
     */
    public function tollGate(): BelongsTo
    {
        return $this->belongsTo(TollGate::class);
    }

    /**
     * Get the staff member that created the manual transaction.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * Get the user associated with the manual transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
