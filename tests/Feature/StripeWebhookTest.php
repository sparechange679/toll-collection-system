<?php

use App\Models\Transaction;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['balance' => 50.00, 'role' => 'driver']);
    config(['stripe.webhook_secret' => null]); // Disable signature verification for tests
});

describe('StripeWebhookController@handle', function () {
    it('handles checkout.session.completed event and credits wallet', function () {
        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_'.uniqid(),
                    'payment_status' => 'paid',
                    'metadata' => [
                        'user_id' => $this->user->id,
                        'amount' => '25.00',
                        'type' => 'wallet_topup',
                    ],
                    'client_reference_id' => $this->user->id,
                    'payment_intent' => 'pi_test_123',
                    'customer_details' => [
                        'email' => 'test@example.com',
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/stripe/webhook', $payload);

        $response->assertOk();

        $this->user->refresh();
        expect($this->user->balance)->toBe('75.00');
    });

    it('does not credit wallet if payment is not paid', function () {
        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_unpaid_'.uniqid(),
                    'payment_status' => 'unpaid',
                    'metadata' => [
                        'user_id' => $this->user->id,
                        'amount' => '25.00',
                    ],
                ],
            ],
        ];

        $this->postJson('/stripe/webhook', $payload);

        $this->user->refresh();
        expect($this->user->balance)->toBe('50.00');
    });

    it('does not credit wallet if user_id is missing', function () {
        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_no_user_'.uniqid(),
                    'payment_status' => 'paid',
                    'metadata' => [
                        'amount' => '25.00',
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/stripe/webhook', $payload);

        $response->assertOk();
    });

    it('does not credit wallet if amount is missing', function () {
        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_no_amount_'.uniqid(),
                    'payment_status' => 'paid',
                    'metadata' => [
                        'user_id' => $this->user->id,
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/stripe/webhook', $payload);

        $this->user->refresh();
        expect($this->user->balance)->toBe('50.00');
    });

    it('handles payment_intent.succeeded event', function () {
        $payload = [
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test_123',
                    'amount' => 5000,
                ],
            ],
        ];

        $response = $this->postJson('/stripe/webhook', $payload);

        $response->assertOk();
    });

    it('handles unknown event types gracefully', function () {
        $payload = [
            'type' => 'unknown.event.type',
            'data' => ['object' => []],
        ];

        $response = $this->postJson('/stripe/webhook', $payload);

        $response->assertOk();
    });

    it('does not credit wallet for non-existent user', function () {
        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_invalid_user_'.uniqid(),
                    'payment_status' => 'paid',
                    'metadata' => [
                        'user_id' => 99999,
                        'amount' => '25.00',
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/stripe/webhook', $payload);

        $response->assertOk();
        expect(Transaction::where('user_id', 99999)->count())->toBe(0);
    });
});
