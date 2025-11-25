<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Incident extends Model
{
    protected $fillable = [
        'toll_gate_id',
        'reported_by',
        'incident_type',
        'severity',
        'status',
        'title',
        'description',
        'action_taken',
        'resolution_notes',
        'resolved_by',
        'occurred_at',
        'resolved_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'resolved_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the toll gate that owns the incident.
     */
    public function tollGate(): BelongsTo
    {
        return $this->belongsTo(TollGate::class);
    }

    /**
     * Get the user that reported the incident.
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Get the user that resolved the incident.
     */
    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Check if the incident is resolved.
     */
    public function isResolved(): bool
    {
        return $this->status === 'resolved';
    }

    /**
     * Check if the incident is critical.
     */
    public function isCritical(): bool
    {
        return $this->severity === 'critical';
    }
}
