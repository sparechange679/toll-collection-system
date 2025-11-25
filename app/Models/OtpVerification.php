<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    protected $fillable = [
        'session_id',
        'otp_code',
        'purpose',
        'is_verified',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Check if OTP is expired.
     */
    public function isExpired(): bool
    {
        return Carbon::now()->isAfter($this->expires_at);
    }

    /**
     * Check if OTP is valid.
     */
    public function isValid(string $code): bool
    {
        return $this->otp_code === $code && ! $this->isExpired() && ! $this->is_verified;
    }

    /**
     * Mark OTP as verified.
     */
    public function markAsVerified(): void
    {
        $this->update(['is_verified' => true]);
    }
}
