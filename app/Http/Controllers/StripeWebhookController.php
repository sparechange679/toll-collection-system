<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\WalletService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function __construct(
        protected WalletService $walletService
    ) {}

    /**
     * Handle Stripe webhook events.
     */
    public function handle(Request $request)
    {
        Stripe::setApiKey(config('stripe.secret'));

        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('stripe.webhook_secret');

        try {
            // Verify webhook signature if webhook secret is configured
            if ($webhookSecret) {
                $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            } else {
                $event = json_decode($payload);
            }

            // Handle the event
            switch ($event->type) {
                case 'checkout.session.completed':
                    $this->handleCheckoutSessionCompleted($event->data->object);
                    break;

                case 'payment_intent.succeeded':
                    Log::info('Payment Intent Succeeded', ['event' => $event]);
                    break;

                case 'payment_intent.payment_failed':
                    Log::warning('Payment Intent Failed', ['event' => $event]);
                    break;

                default:
                    Log::info('Unhandled Stripe Event', ['type' => $event->type]);
            }

            return response()->json(['success' => true]);
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe Webhook Signature Verification Failed', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Invalid signature'], 400);
        } catch (Exception $e) {
            Log::error('Stripe Webhook Error', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle checkout session completed event.
     */
    protected function handleCheckoutSessionCompleted($session): void
    {
        try {
            // Get user from metadata
            $userId = $session->metadata->user_id ?? $session->client_reference_id;

            if (! $userId) {
                Log::error('No user ID in Stripe session', ['session' => $session]);

                return;
            }

            $user = User::find($userId);

            if (! $user) {
                Log::error('User not found for Stripe payment', ['user_id' => $userId]);

                return;
            }

            // Get amount from metadata
            $amount = $session->metadata->amount ?? null;

            if (! $amount) {
                Log::error('No amount in Stripe session metadata', ['session' => $session]);

                return;
            }

            // Check if payment is successful
            if ($session->payment_status !== 'paid') {
                Log::warning('Session not paid yet', ['session' => $session]);

                return;
            }

            // Credit user's wallet
            $transaction = $this->walletService->credit(
                user: $user,
                amount: (float) $amount,
                description: 'Wallet top-up via Stripe',
                reference: $session->id,
                metadata: [
                    'payment_intent' => $session->payment_intent ?? null,
                    'customer_email' => $session->customer_details->email ?? null,
                ]
            );

            Log::info('Wallet credited successfully', [
                'user_id' => $user->id,
                'amount' => $amount,
                'transaction_id' => $transaction->id,
            ]);
        } catch (Exception $e) {
            Log::error('Failed to credit wallet', [
                'error' => $e->getMessage(),
                'session' => $session,
            ]);
        }
    }
}
