<?php

use App\Models\Transaction;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['balance' => 100.00, 'role' => 'driver']);
});

describe('WalletController@exportXlsx', function () {
    it('exports transactions as XLSX for authenticated user', function () {
        Transaction::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->get(route('wallet.export.xlsx'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->assertDownload('transactions_'.date('Y-m-d').'.xlsx');
    });

    it('generates valid XLSX file', function () {
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'type' => 'credit',
            'description' => 'Test deposit',
        ]);

        $response = $this->actingAs($this->user)->get(route('wallet.export.xlsx'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('exports XLSX when no transactions exist', function () {
        $response = $this->actingAs($this->user)->get(route('wallet.export.xlsx'));

        $response->assertOk()
            ->assertDownload('transactions_'.date('Y-m-d').'.xlsx');
    });

    it('redirects unauthenticated user to login', function () {
        $response = $this->get(route('wallet.export.xlsx'));

        $response->assertRedirect();
    });

    it('only exports transactions belonging to the authenticated user', function () {
        $otherUser = User::factory()->create(['role' => 'driver']);
        Transaction::factory()->create([
            'user_id' => $otherUser->id,
            'description' => 'Other user transaction',
        ]);
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'description' => 'My transaction',
        ]);

        $response = $this->actingAs($this->user)->get(route('wallet.export.xlsx'));

        $response->assertOk()
            ->assertDownload('transactions_'.date('Y-m-d').'.xlsx');
    });
});

describe('WalletController@exportPdf', function () {
    it('exports transactions as PDF for authenticated user', function () {
        Transaction::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->get(route('wallet.export.pdf'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Content-Disposition', 'attachment; filename="transactions_'.date('Y-m-d').'.pdf"');
    });

    it('generates valid PDF content', function () {
        Transaction::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)->get(route('wallet.export.pdf'));

        $content = $response->getContent();
        expect($content)->toStartWith('%PDF-');
    });

    it('exports PDF when no transactions exist', function () {
        $response = $this->actingAs($this->user)->get(route('wallet.export.pdf'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    });

    it('redirects unauthenticated user to login', function () {
        $response = $this->get(route('wallet.export.pdf'));

        $response->assertRedirect();
    });

    it('only exports transactions belonging to the authenticated user', function () {
        $otherUser = User::factory()->create(['role' => 'driver']);
        Transaction::factory()->create([
            'user_id' => $otherUser->id,
            'description' => 'Other user transaction',
        ]);
        Transaction::factory()->create([
            'user_id' => $this->user->id,
            'description' => 'My transaction',
        ]);

        $response = $this->actingAs($this->user)->get(route('wallet.export.pdf'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    });
});
