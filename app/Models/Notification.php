<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Notification extends Model
{
    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'created_by',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    /**
     * Get the user who created the notification.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the notification recipients.
     */
    public function recipients()
    {
        return $this->hasMany(NotificationRecipient::class);
    }

    /**
     * Get users who received this notification.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'notification_recipients')
            ->withPivot('is_read', 'read_at')
            ->withTimestamps();
    }
}
