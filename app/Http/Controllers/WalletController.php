<?php

namespace App\Http\Controllers;

use App\Services\WalletService;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class WalletController extends Controller
{
    public function __construct(
        protected WalletService $walletService
    ) {}

    /**
     * Show wallet dashboard page.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('driver/wallet-dashboard', [
            'wallet' => [
                'balance' => $user->balance,
                'recent_transactions' => $this->walletService->getTransactions($user, 10),
            ],
        ]);
    }

    /**
     * Show paginated transaction history page.
     */
    public function transactions(Request $request)
    {
        $transactions = $this->walletService->getTransactionsPaginated(
            $request->user(),
            $request->input('per_page', 20)
        );

        return Inertia::render('driver/transaction-history', [
            'transactions' => $transactions,
        ]);
    }

    /**
     * Create a Stripe Checkout session for wallet top-up.
     */
    public function createTopUpSession(Request $request)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:5', 'max:1000'],
        ]);

        try {
            Stripe::setApiKey(config('stripe.secret'));

            $user = $request->user();
            $amountInCents = (int) ($validated['amount'] * 100); // Convert to cents

            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => config('stripe.currency', 'usd'),
                        'product_data' => [
                            'name' => 'Wallet Top-up',
                            'description' => "Add {$validated['amount']} to your wallet",
                        ],
                        'unit_amount' => $amountInCents,
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => route('wallet.success').'?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('wallet.cancel'),
                'client_reference_id' => $user->id,
                'metadata' => [
                    'user_id' => $user->id,
                    'amount' => $validated['amount'],
                    'type' => 'wallet_topup',
                ],
            ]);

            return response()->json([
                'session_id' => $session->id,
                'url' => $session->url,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create checkout session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle successful payment redirect from Stripe.
     */
    public function success(Request $request)
    {
        $sessionId = $request->query('session_id');

        if (! $sessionId) {
            return redirect()->route('dashboard')->with('error', 'Invalid payment session');
        }

        try {
            Stripe::setApiKey(config('stripe.secret'));
            $session = Session::retrieve($sessionId);

            if ($session->payment_status === 'paid') {
                $user = $request->user();
                $amount = $session->metadata->amount ?? null;

                if ($amount && $user) {
                    // Check if this session was already processed to prevent double-crediting
                    $existingTransaction = \App\Models\Transaction::where('reference', $sessionId)->first();

                    if (! $existingTransaction) {
                        // Credit the user's wallet
                        $this->walletService->credit(
                            user: $user,
                            amount: (float) $amount,
                            description: 'Wallet top-up via Stripe',
                            reference: $sessionId,
                            metadata: [
                                'payment_intent' => $session->payment_intent ?? null,
                                'customer_email' => $session->customer_details->email ?? null,
                            ]
                        );
                    }
                }

                return redirect()->route('dashboard')->with('success', 'Wallet topped up successfully!');
            }

            return redirect()->route('dashboard')->with('error', 'Payment not completed');
        } catch (Exception $e) {
            return redirect()->route('dashboard')->with('error', 'Failed to verify payment');
        }
    }

    /**
     * Handle cancelled payment redirect from Stripe.
     */
    public function cancel()
    {
        return redirect()->route('dashboard')->with('info', 'Payment cancelled');
    }

    /**
     * Get low balance status.
     */
    public function checkBalance(Request $request)
    {
        $user = $request->user();
        $threshold = $request->input('threshold', 20.00);

        return response()->json([
            'balance' => $user->balance,
            'is_low' => $this->walletService->isBalanceLow($user, $threshold),
            'threshold' => $threshold,
        ]);
    }

    /**
     * Export transactions as XLSX.
     */
    public function exportXlsx(Request $request)
    {
        $user = $request->user();
        $transactions = $user->transactions()->orderBy('created_at', 'desc')->get();

        $filename = 'transactions_'.date('Y-m-d').'.xlsx';

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Transactions');

        // Header row
        $sheet->setCellValue('A1', 'Date');
        $sheet->setCellValue('B1', 'Type');
        $sheet->setCellValue('C1', 'Description');
        $sheet->setCellValue('D1', 'Amount');
        $sheet->setCellValue('E1', 'Balance After');
        $sheet->setCellValue('F1', 'Reference');

        // Style header
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);

        // Data rows
        $row = 2;
        foreach ($transactions as $transaction) {
            $sheet->setCellValue("A{$row}", $transaction->created_at->format('Y-m-d H:i:s'));
            $sheet->setCellValue("B{$row}", ucfirst($transaction->type));
            $sheet->setCellValue("C{$row}", $transaction->description);
            $sheet->setCellValue("D{$row}", ($transaction->type === 'credit' ? '+' : '-').number_format($transaction->amount, 2));
            $sheet->setCellValue("E{$row}", number_format($transaction->balance_after, 2));
            $sheet->setCellValue("F{$row}", $transaction->reference ?? 'N/A');
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);

        $tempFile = tempnam(sys_get_temp_dir(), 'xlsx');
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Export transactions as PDF.
     */
    public function exportPdf(Request $request)
    {
        $user = $request->user();
        $transactions = $user->transactions()->orderBy('created_at', 'desc')->get();

        $filename = 'transactions_'.date('Y-m-d').'.pdf';

        // Generate HTML for PDF
        $html = view('exports.transactions-pdf', [
            'transactions' => $transactions,
            'user' => $user,
            'generatedAt' => now(),
        ])->render();

        // Use Dompdf
        $dompdf = new \Dompdf\Dompdf;
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
