<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wallet Top-Up Confirmation</title>
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
            border-bottom: 2px solid #10b981;
        }
        .header h1 {
            color: #10b981;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 5px 0 0 0;
        }
        .success-icon {
            text-align: center;
            margin: 20px 0;
        }
        .success-icon .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #10b981;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: white;
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
        .amount-section {
            background: #10b981;
            color: white;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
        }
        .amount-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        .amount-value {
            font-size: 36px;
            font-weight: bold;
        }
        .balance-section {
            background: white;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
        }
        .balance-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .balance-value {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
        }
        .info-box {
            background: #e0f2fe;
            border: 1px solid #0ea5e9;
            color: #0c4a6e;
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
            background: #10b981;
            color: white;
            font-size: 14px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Wallet Top-Up Successful</h1>
            <p>{{ $data['timestamp'] }}</p>
            <span class="status-badge">✓ COMPLETED</span>
        </div>

        <div class="success-icon">
            <div class="checkmark">✓</div>
        </div>

        <div class="receipt-details">
            <h2 style="margin-top: 0; color: #333;">Account Information</h2>
            <div class="detail-row">
                <span class="detail-label">Account Holder:</span>
                <span class="detail-value">{{ $data['user_name'] }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ $data['user_email'] }}</span>
            </div>
        </div>

        <div class="amount-section">
            <div class="amount-label">Amount Added</div>
            <div class="amount-value">${{ number_format($data['amount'], 2) }}</div>
        </div>

        <div class="balance-section">
            <div class="balance-label">New Wallet Balance</div>
            <div class="balance-value">${{ number_format($data['new_balance'], 2) }}</div>
        </div>

        <div class="receipt-details">
            <h2 style="margin-top: 0; color: #333;">Transaction Details</h2>
            <div class="detail-row">
                <span class="detail-label">Transaction Reference:</span>
                <span class="detail-value">{{ $data['reference'] }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">Stripe (Card)</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #10b981; font-weight: 600;">Completed</span>
            </div>
        </div>

        <div class="info-box">
            <strong>ℹ️ What's Next?</strong><br>
            Your wallet has been successfully topped up. You can now use your balance to pay for toll gates and other services.
        </div>

        <div class="footer">
            <p>Thank you for using our toll collection system!</p>
            <p style="font-size: 12px; color: #999;">
                This is an automated confirmation email. Please do not reply to this email.<br>
                For support, contact us through the app.
            </p>
        </div>
    </div>
</body>
</html>
