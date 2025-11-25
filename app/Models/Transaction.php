<?php

namespace App\Models;

use Database\Factories\TransactionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    /** @use HasFactory<TransactionFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'balance_after',
        'description',
        'reference',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the user that owns the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if transaction is a credit.
     */
    public function isCredit(): bool
    {
        return $this->type === 'credit';
    }

    /**
     * Check if transaction is a debit.
     */
    public function isDebit(): bool
    {
        return $this->type === 'debit';
    }
}
