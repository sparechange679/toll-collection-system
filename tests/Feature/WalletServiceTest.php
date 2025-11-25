<?php

use App\Models\Transaction;
use App\Models\User;
use App\Services\WalletService;

test('can credit user wallet and create transaction', function () {
    $user = User::factory()->create(['balance' => 10.00]);
    $walletService = app(WalletService::class);

    $transaction = $walletService->credit(
        user: $user,
        amount: 50.00,
        description: 'Test wallet top-up',
        reference: 'test_ref_123'
    );

    expect($transaction)->toBeInstanceOf(Transaction::class)
        ->and($transaction->type)->toBe('credit')
        ->and($transaction->amount)->toBe('50.00')
        ->and($transaction->reference)->toBe('test_ref_123')
        ->and($transaction->balance_after)->toBe('60.00');

    $user->refresh();
    expect($user->balance)->toBe('60.00');
});

test('prevents duplicate transactions with same reference', function () {
    $user = User::factory()->create(['balance' => 10.00]);
    $walletService = app(WalletService::class);

    // First transaction
    $walletService->credit(
        user: $user,
        amount: 50.00,
        description: 'First top-up',
        reference: 'duplicate_ref_123'
    );

    // Check if duplicate exists
    $existingTransaction = Transaction::where('reference', 'duplicate_ref_123')->first();

    expect($existingTransaction)->not->toBeNull()
        ->and($existingTransaction->amount)->toBe('50.00');

    $user->refresh();
    expect($user->balance)->toBe('60.00');
});

test('can debit user wallet', function () {
    $user = User::factory()->create(['balance' => 100.00]);
    $walletService = app(WalletService::class);

    $transaction = $walletService->debit(
        user: $user,
        amount: 30.00,
        description: 'Test debit',
        reference: 'debit_ref_123'
    );

    expect($transaction)->toBeInstanceOf(Transaction::class)
        ->and($transaction->type)->toBe('debit')
        ->and($transaction->amount)->toBe('30.00')
        ->and($transaction->balance_after)->toBe('70.00');

    $user->refresh();
    expect($user->balance)->toBe('70.00');
});

test('prevents debit when insufficient balance', function () {
    $user = User::factory()->create(['balance' => 10.00]);
    $walletService = app(WalletService::class);

    $walletService->debit(
        user: $user,
        amount: 50.00,
        description: 'Test debit',
        reference: 'debit_ref_456'
    );
})->throws(Exception::class, 'Insufficient balance');

test('prevents credit with zero amount', function () {
    $user = User::factory()->create(['balance' => 10.00]);
    $walletService = app(WalletService::class);

    $walletService->credit(
        user: $user,
        amount: 0,
        description: 'Invalid credit'
    );
})->throws(Exception::class, 'Credit amount must be greater than zero');

test('prevents credit with negative amount', function () {
    $user = User::factory()->create(['balance' => 10.00]);
    $walletService = app(WalletService::class);

    $walletService->credit(
        user: $user,
        amount: -50.00,
        description: 'Invalid credit'
    );
})->throws(Exception::class, 'Credit amount must be greater than zero');

test('prevents debit with zero amount', function () {
    $user = User::factory()->create(['balance' => 100.00]);
    $walletService = app(WalletService::class);

    $walletService->debit(
        user: $user,
        amount: 0,
        description: 'Invalid debit'
    );
})->throws(Exception::class, 'Debit amount must be greater than zero');

test('can process toll deduction', function () {
    $user = User::factory()->create(['balance' => 100.00]);
    $walletService = app(WalletService::class);

    $transaction = $walletService->processTollDeduction(
        user: $user,
        tollAmount: 5.00,
        gateReference: 'GATE-001',
        gateMetadata: ['location' => 'Highway Exit 5']
    );

    expect($transaction->type)->toBe('debit')
        ->and($transaction->amount)->toBe('5.00')
        ->and($transaction->metadata['type'])->toBe('toll_payment')
        ->and($transaction->metadata['gate_reference'])->toBe('GATE-001');

    $user->refresh();
    expect($user->balance)->toBe('95.00');
});

test('toll deduction fails with insufficient balance', function () {
    $user = User::factory()->create(['balance' => 3.00]);
    $walletService = app(WalletService::class);

    $walletService->processTollDeduction(
        user: $user,
        tollAmount: 5.00,
        gateReference: 'GATE-002'
    );
})->throws(Exception::class, 'Insufficient balance');

test('can check if user can pass through toll', function () {
    $user = User::factory()->create(['balance' => 100.00]);
    $walletService = app(WalletService::class);

    expect($walletService->canPassThroughToll($user, 5.00))->toBeTrue()
        ->and($walletService->canPassThroughToll($user, 150.00))->toBeFalse();
});

test('correctly checks sufficient balance', function () {
    $user = User::factory()->create(['balance' => 50.00]);
    $walletService = app(WalletService::class);

    expect($walletService->hasSufficientBalance($user, 50.00))->toBeTrue()
        ->and($walletService->hasSufficientBalance($user, 50.01))->toBeFalse()
        ->and($walletService->hasSufficientBalance($user, 25.00))->toBeTrue();
});

test('correctly identifies low balance', function () {
    $walletService = app(WalletService::class);

    $lowBalanceUser = User::factory()->create(['balance' => 15.00]);
    $highBalanceUser = User::factory()->create(['balance' => 100.00]);

    expect($walletService->isBalanceLow($lowBalanceUser, 20.00))->toBeTrue()
        ->and($walletService->isBalanceLow($highBalanceUser, 20.00))->toBeFalse();
});

test('can get user balance', function () {
    $user = User::factory()->create(['balance' => 123.45]);
    $walletService = app(WalletService::class);

    expect($walletService->getBalance($user))->toBe(123.45);
});

test('can get user transactions', function () {
    $user = User::factory()->create(['balance' => 100.00]);
    $walletService = app(WalletService::class);

    // Create some transactions
    Transaction::factory()->count(5)->create(['user_id' => $user->id]);

    $transactions = $walletService->getTransactions($user);

    expect($transactions)->toHaveCount(5);
});

test('can limit transaction results', function () {
    $user = User::factory()->create(['balance' => 100.00]);
    $walletService = app(WalletService::class);

    Transaction::factory()->count(10)->create(['user_id' => $user->id]);

    $transactions = $walletService->getTransactions($user, 3);

    expect($transactions)->toHaveCount(3);
});

test('can get paginated transactions', function () {
    $user = User::factory()->create(['balance' => 100.00]);
    $walletService = app(WalletService::class);

    Transaction::factory()->count(25)->create(['user_id' => $user->id]);

    $paginated = $walletService->getTransactionsPaginated($user, 10);

    expect($paginated->count())->toBe(10)
        ->and($paginated->total())->toBe(25);
});

test('stores metadata with transaction', function () {
    $user = User::factory()->create(['balance' => 10.00]);
    $walletService = app(WalletService::class);

    $transaction = $walletService->credit(
        user: $user,
        amount: 50.00,
        description: 'Test with metadata',
        reference: 'meta_ref_123',
        metadata: ['source' => 'stripe', 'payment_id' => 'pi_123']
    );

    expect($transaction->metadata)->toBeArray()
        ->and($transaction->metadata['source'])->toBe('stripe')
        ->and($transaction->metadata['payment_id'])->toBe('pi_123');
});

test('daily transactions summary returns correct data', function () {
    $user = User::factory()->create(['balance' => 100.00]);
    $walletService = app(WalletService::class);

    // Create some transactions
    Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => 'credit',
        'amount' => 50.00,
        'created_at' => now(),
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'type' => 'debit',
        'amount' => 10.00,
        'created_at' => now(),
    ]);

    $summary = $walletService->getDailyTransactionsSummary($user, 7);

    expect($summary)->toBeArray()
        ->and(count($summary))->toBe(7);

    $todaySummary = collect($summary)->firstWhere('date', now()->toDateString());
    expect($todaySummary['credit_total'])->toBe(50.0)
        ->and($todaySummary['debit_total'])->toBe(10.0)
        ->and($todaySummary['count'])->toBe(2);
});
