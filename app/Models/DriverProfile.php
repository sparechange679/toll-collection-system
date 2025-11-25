<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverProfile extends Model
{
    protected $fillable = [
        'user_id',
        'license_number',
        'license_expiry_date',
        'phone_number',
        'address',
        'city',
        'district',
        'date_of_birth',
        'id_number',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    protected function casts(): array
    {
        return [
            'license_expiry_date' => 'date',
            'date_of_birth' => 'date',
        ];
    }

    /**
     * Get the user that owns the driver profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
