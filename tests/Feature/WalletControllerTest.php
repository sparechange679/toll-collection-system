<?php

use App\Models\Transaction;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['balance' => 100.00, 'role' => 'driver']);
});

describe('WalletController@index', function () {
    it('displays wallet dashboard for authenticated user', function () {
        $response = $this->actingAs($this->user)->get(route('wallet.index'));

        $response->assertOk();
    });

    it('redirects unauthenticated user to login', function () {
        $response = $this->get(route('wallet.index'));

        $response->assertRedirect();
    });
});

describe('WalletController@transactions', function () {
    it('displays transaction history page', function () {
        Transaction::factory()->count(5)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->get(route('wallet.transactions'));

        $response->assertOk();
    });

    it('paginates transactions', function () {
        Transaction::factory()->count(30)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->get(route('wallet.transactions', ['per_page' => 10]));

        $response->assertOk();
    });
});

describe('WalletController@createTopUpSession', function () {
    it('validates minimum top-up amount', function () {
        $response = $this->actingAs($this->user)->postJson(route('wallet.top-up'), [
            'amount' => 2, // Below min of 5
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['amount']);
    });

    it('validates maximum top-up amount', function () {
        $response = $this->actingAs($this->user)->postJson(route('wallet.top-up'), [
            'amount' => 1500, // Above max of 1000
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['amount']);
    });

    it('requires amount to be provided', function () {
        $response = $this->actingAs($this->user)->postJson(route('wallet.top-up'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['amount']);
    });

    it('requires amount to be numeric', function () {
        $response = $this->actingAs($this->user)->postJson(route('wallet.top-up'), [
            'amount' => 'invalid',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['amount']);
    });
});

describe('WalletController@checkBalance', function () {
    it('returns current balance and low balance status', function () {
        $response = $this->actingAs($this->user)->getJson(route('wallet.balance.check'));

        $response->assertOk()
            ->assertJsonStructure(['balance', 'is_low', 'threshold']);
    });

    it('correctly identifies low balance', function () {
        $lowBalanceUser = User::factory()->create(['balance' => 10.00, 'role' => 'driver']);

        $response = $this->actingAs($lowBalanceUser)->getJson(route('wallet.balance.check', ['threshold' => 20]));

        $response->assertOk()
            ->assertJson(['is_low' => true]);
    });

    it('correctly identifies sufficient balance', function () {
        $response = $this->actingAs($this->user)->getJson(route('wallet.balance.check', ['threshold' => 20]));

        $response->assertOk()
            ->assertJson(['is_low' => false]);
    });

    it('accepts custom threshold', function () {
        $response = $this->actingAs($this->user)->getJson(route('wallet.balance.check', ['threshold' => 150]));

        $response->assertOk()
            ->assertJson(['is_low' => true, 'threshold' => 150]);
    });
});

describe('WalletController@success', function () {
    it('redirects when session_id is missing', function () {
        $response = $this->actingAs($this->user)->get(route('wallet.success'));

        $response->assertRedirect(route('dashboard'));
    });
});

describe('WalletController@cancel', function () {
    it('redirects to dashboard with info message', function () {
        $response = $this->actingAs($this->user)->get(route('wallet.cancel'));

        $response->assertRedirect(route('dashboard'));
    });
});
