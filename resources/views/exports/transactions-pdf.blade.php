<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transaction History</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .meta {
            margin-bottom: 20px;
        }
        .meta p {
            margin: 3px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .credit {
            color: #16a34a;
        }
        .debit {
            color: #dc2626;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        .summary {
            margin-top: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Transaction History</h1>
        <p>Toll Collection System</p>
    </div>

    <div class="meta">
        <p><strong>Account Holder:</strong> {{ $user->name }}</p>
        <p><strong>Email:</strong> {{ $user->email }}</p>
        <p><strong>Current Balance:</strong> ${{ number_format($user->balance, 2) }}</p>
        <p><strong>Generated:</strong> {{ $generatedAt->format('F j, Y \a\t g:i A') }}</p>
    </div>

    @if($transactions->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transactions as $transaction)
                    <tr>
                        <td>{{ $transaction->created_at->format('M d, Y H:i') }}</td>
                        <td>{{ ucfirst($transaction->type) }}</td>
                        <td>{{ $transaction->description }}</td>
                        <td class="{{ $transaction->type }}">
                            {{ $transaction->type === 'credit' ? '+' : '-' }}${{ number_format($transaction->amount, 2) }}
                        </td>
                        <td>${{ number_format($transaction->balance_after, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="summary">
            <p><strong>Total Transactions:</strong> {{ $transactions->count() }}</p>
            <p><strong>Total Credits:</strong> ${{ number_format($transactions->where('type', 'credit')->sum('amount'), 2) }}</p>
            <p><strong>Total Debits:</strong> ${{ number_format($transactions->where('type', 'debit')->sum('amount'), 2) }}</p>
        </div>
    @else
        <p>No transactions found.</p>
    @endif

    <div class="footer">
        <p>This document was automatically generated. For questions, contact support.</p>
    </div>
</body>
</html>
