<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverDocument extends Model
{
    protected $fillable = [
        'user_id',
        'document_type',
        'file_path',
        'file_type',
        'verification_status',
        'extracted_data',
        'failure_reason',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'extracted_data' => 'array',
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    public function isPending(): bool
    {
        return $this->verification_status === 'pending';
    }

    public function hasFailed(): bool
    {
        return $this->verification_status === 'failed';
    }
}
