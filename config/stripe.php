<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Stripe Keys
    |--------------------------------------------------------------------------
    |
    | The Stripe publishable and secret keys from your Stripe account.
    |
    */

    'key' => env('STRIPE_KEY'),

    'secret' => env('STRIPE_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Stripe Webhook Secret
    |--------------------------------------------------------------------------
    |
    | The webhook secret for verifying Stripe webhook signatures.
    |
    */

    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    |
    | The default currency for payments.
    |
    */

    'currency' => env('STRIPE_CURRENCY', 'usd'),

];
