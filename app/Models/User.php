<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'onboarding_completed',
        'balance',
        'registration_number',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'onboarding_completed' => 'boolean',
            'balance' => 'decimal:2',
        ];
    }

    /**
     * Get the driver profile associated with the user.
     */
    public function driverProfile(): HasOne|User
    {
        return $this->hasOne(DriverProfile::class);
    }

    /**
     * Get the vehicles associated with the user.
     */
    public function vehicles(): User|HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    /**
     * Get the transactions associated with the user.
     */
    public function transactions(): User|HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is a staff.
     */
    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    /**
     * Check if user is a driver.
     */
    public function isDriver(): bool
    {
        return $this->role === 'driver';
    }

    /**
     * Get the toll passages associated with the user.
     */
    public function tollPassages(): User|HasMany
    {
        return $this->hasMany(TollPassage::class);
    }

    /**
     * Get the shift logs associated with the staff member.
     */
    public function shiftLogs(): User|HasMany
    {
        return $this->hasMany(ShiftLog::class, 'staff_id');
    }

    /**
     * Get the manual transactions created by the staff member.
     */
    public function manualTransactions(): User|HasMany
    {
        return $this->hasMany(ManualTransaction::class, 'staff_id');
    }

    /**
     * Get the incidents reported by the user.
     */
    public function reportedIncidents(): User|HasMany
    {
        return $this->hasMany(Incident::class, 'reported_by');
    }

    /**
     * Get the incidents resolved by the user.
     */
    public function resolvedIncidents(): User|HasMany
    {
        return $this->hasMany(Incident::class, 'resolved_by');
    }

    /**
     * Get the handover notes sent by the staff member.
     */
    public function sentHandoverNotes(): User|HasMany
    {
        return $this->hasMany(HandoverNote::class, 'from_staff_id');
    }

    /**
     * Get the handover notes received by the staff member.
     */
    public function receivedHandoverNotes(): User|HasMany
    {
        return $this->hasMany(HandoverNote::class, 'to_staff_id');
    }
}
