<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    protected $fillable = [
        'user_id',
        'registration_number',
        'make',
        'model',
        'year',
        'vehicle_type',
        'color',
        'weight',
        'rfid_tag',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'decimal:2',
            'is_active' => 'boolean',
            'year' => 'integer',
        ];
    }

    /**
     * Get the user that owns the vehicle.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the toll passages for the vehicle.
     */
    public function tollPassages(): Vehicle|HasMany
    {
        return $this->hasMany(TollPassage::class);
    }
}
