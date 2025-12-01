<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toll Receipt</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            border: 1px solid #e0e0e0;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #4CAF50;
        }
        .header h1 {
            color: #4CAF50;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 5px 0 0 0;
        }
        .receipt-details {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #555;
        }
        .detail-value {
            color: #333;
        }
        .total-section {
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .total-section .detail-row {
            border-bottom-color: rgba(255,255,255,0.3);
            color: white;
        }
        .total-section .detail-label,
        .total-section .detail-value {
            color: white;
        }
        .total-amount {
            font-size: 24px;
            font-weight: bold;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            background: #4CAF50;
            color: white;
            font-size: 14px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Toll Payment Receipt</h1>
            <p>{{ $data['timestamp'] }}</p>
            <span class="status-badge">✓ PAID</span>
        </div>

        <div class="receipt-details">
            <h2 style="margin-top: 0; color: #333;">Driver Information</h2>
            <div class="detail-row">
                <span class="detail-label">Driver Name:</span>
                <span class="detail-value">{{ $data['user_name'] }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Vehicle:</span>
                <span class="detail-value">{{ $data['vehicle_registration'] }} - {{ $data['vehicle_make_model'] }}</span>
            </div>
        </div>

        <div class="receipt-details">
            <h2 style="margin-top: 0; color: #333;">Transaction Details</h2>
            <div class="detail-row">
                <span class="detail-label">Toll Gate:</span>
                <span class="detail-value">{{ $data['toll_gate'] }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Toll Amount:</span>
                <span class="detail-value">${{ number_format($data['toll_amount'], 2) }}</span>
            </div>
            @if ($data['fine_amount'] > 0)
            <div class="detail-row">
                <span class="detail-label">Overweight Fine:</span>
                <span class="detail-value" style="color: #d32f2f;">${{ number_format($data['fine_amount'], 2) }}</span>
            </div>
            @endif
        </div>

        <div class="total-section">
            <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value total-amount">${{ number_format($data['total_amount'], 2) }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">New Balance:</span>
                <span class="detail-value" style="font-size: 18px; font-weight: 600;">${{ number_format($data['new_balance'], 2) }}</span>
            </div>
        </div>

        @if ($data['is_overweight'])
        <div class="warning">
            <strong>⚠️ Overweight Vehicle Notice</strong><br>
            Your vehicle exceeded the weight limit. An overweight fine of ${{ number_format($data['fine_amount'], 2) }} has been applied.
        </div>
        @endif

        @if ($data['new_balance'] < 500)
        <div class="warning">
            <strong>💰 Low Balance Alert</strong><br>
            Your wallet balance is low (${{ number_format($data['new_balance'], 2) }}). Please top up to avoid being unable to pass toll gates.
        </div>
        @endif

        <div class="footer">
            <p>Thank you for using our toll collection system!</p>
            <p style="font-size: 12px; color: #999;">
                This is an automated receipt. Please do not reply to this email.<br>
                For support, contact us through the app.
            </p>
        </div>
    </div>
</body>
</html>
