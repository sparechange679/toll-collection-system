<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use LaravelIdea\Helper\App\Models\_IH_User_C;
use Throwable;

class WalletService
{
    /**
     * Credit (add money to) a user's wallet.
     *
     * @throws Exception
     * @throws Throwable
     */
    public function credit(User $user, float $amount, string $description, ?string $reference = null, ?array $metadata = null): Transaction
    {
        if ($amount <= 0) {
            throw new Exception('Credit amount must be greater than zero');
        }

        return DB::transaction(function () use ($user, $amount, $description, $reference, $metadata) {
            // Lock the user row to prevent race conditions
            $user = User::where('id', $user->id)->lockForUpdate()->first();

            // Update balance
            $newBalance = $user->balance + $amount;
            $user->update(['balance' => $newBalance]);

            // Create transaction record
            return Transaction::create([
                'user_id' => $user->id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $newBalance,
                'description' => $description,
                'reference' => $reference,
                'metadata' => $metadata,
            ]);
        });
    }

    /**
     * Debit (deduct money from) a user's wallet.
     *
     * @throws Exception|Throwable
     */
    public function debit(User $user, float $amount, string $description, ?string $reference = null, ?array $metadata = null): Transaction
    {
        if ($amount <= 0) {
            throw new Exception('Debit amount must be greater than zero');
        }

        return DB::transaction(function () use ($user, $amount, $description, $reference, $metadata) {
            // Lock the user row to prevent race conditions
            $user = User::where('id', $user->id)->lockForUpdate()->first();

            // Check if user has sufficient balance
            if ($user->balance < $amount) {
                throw new Exception('Insufficient balance');
            }

            // Update balance
            $newBalance = $user->balance - $amount;
            $user->update(['balance' => $newBalance]);

            // Create transaction record
            return Transaction::create([
                'user_id' => $user->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $newBalance,
                'description' => $description,
                'reference' => $reference,
                'metadata' => $metadata,
            ]);
        });
    }

    /**
     * Check if user has sufficient balance.
     */
    public function hasSufficientBalance(User $user, float $amount): bool
    {
        return $user->balance >= $amount;
    }

    /**
     * Get user's current balance.
     */
    public function getBalance(User $user): float
    {
        return (float) $user->fresh()->balance;
    }

    /**
     * Get user's transaction history.
     */
    public function getTransactions(User $user, ?int $limit = null): Collection|array|_IH_User_C
    {
        $query = $user->transactions()->latest();

        if ($limit) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Get user's transaction history paginated.
     */
    public function getTransactionsPaginated(User $user, int $perPage = 20): array|LengthAwarePaginator|_IH_User_C
    {
        return $user->transactions()
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Process toll deduction.
     *
     * @throws Exception|Throwable
     */
    public function processTollDeduction(User $user, float $tollAmount, string $gateReference, array $gateMetadata = []): Transaction
    {
        return $this->debit(
            user: $user,
            amount: $tollAmount,
            description: "Toll deduction - Gate {$gateReference}",
            reference: $gateReference,
            metadata: array_merge($gateMetadata, [
                'type' => 'toll_payment',
                'gate_reference' => $gateReference,
            ])
        );
    }

    /**
     * Check if user can pass through tollgate.
     */
    public function canPassThroughToll(User $user, float $tollAmount): bool
    {
        return $this->hasSufficientBalance($user, $tollAmount);
    }

    /**
     * Check if balance is below threshold.
     */
    public function isBalanceLow(User $user, float $threshold = 20.00): bool
    {
        return $user->balance < $threshold;
    }

    /**
     * Build a per-day summary of a user's transactions for the given window.
     *
     * Returns an array of shape:
     * [
     *   [ 'date' => 'YYYY-MM-DD', 'debit_total' => float, 'credit_total' => float, 'count' => int ],
     *   ...
     * ]
     */
    public function getDailyTransactionsSummary(User $user, int $days = 14): array
    {
        $startDate = now()->subDays($days - 1)->startOfDay();

        // Fetch summed totals grouped by date and type
        $rows = Transaction::query()
            ->selectRaw('DATE(created_at) as date, type, COUNT(*) as cnt, SUM(amount) as total')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', $startDate)
            ->groupBy('date', 'type')
            ->orderBy('date')
            ->get();

        // Initialize the series with zeros for each day
        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i)->toDateString();
            $series[$date] = [
                'date' => $date,
                'debit_total' => 0.0,
                'credit_total' => 0.0,
                'count' => 0,
            ];
        }

        foreach ($rows as $row) {
            $date = (string) $row->date;
            if (! isset($series[$date])) {
                $series[$date] = [
                    'date' => $date,
                    'debit_total' => 0.0,
                    'credit_total' => 0.0,
                    'count' => 0,
                ];
            }

            if ($row->type === 'debit') {
                $series[$date]['debit_total'] += (float) $row->total;
            } else {
                $series[$date]['credit_total'] += (float) $row->total;
            }
            $series[$date]['count'] += (int) $row->cnt;
        }

        return array_values($series);
    }
}
