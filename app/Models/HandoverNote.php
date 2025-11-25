<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HandoverNote extends Model
{
    protected $fillable = [
        'toll_gate_id',
        'from_staff_id',
        'to_staff_id',
        'shift_log_id',
        'notes',
        'pending_issues',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'pending_issues' => 'array',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    /**
     * Get the toll gate that owns the handover note.
     */
    public function tollGate(): BelongsTo
    {
        return $this->belongsTo(TollGate::class);
    }

    /**
     * Get the staff member that sent the handover note.
     */
    public function fromStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_staff_id');
    }

    /**
     * Get the staff member that received the handover note.
     */
    public function toStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_staff_id');
    }

    /**
     * Get the shift log associated with the handover note.
     */
    public function shiftLog(): BelongsTo
    {
        return $this->belongsTo(ShiftLog::class);
    }

    /**
     * Mark the handover note as read.
     */
    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }
}
