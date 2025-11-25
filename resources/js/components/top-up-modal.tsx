import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2 } from 'lucide-react';
import axios from 'axios';

interface TopUpModalProps {
    open: boolean;
    onClose: () => void;
}

const QUICK_AMOUNTS = [10, 25, 50, 100];

export default function TopUpModal({ open, onClose }: TopUpModalProps) {
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString());
        setError('');
    };

    const handleTopUp = async () => {
        const numAmount = parseFloat(amount);

        if (!amount || isNaN(numAmount)) {
            setError('Please enter a valid amount');
            return;
        }

        if (numAmount < 5) {
            setError('Minimum top-up amount is $5');
            return;
        }

        if (numAmount > 1000) {
            setError('Maximum top-up amount is $1000');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/wallet/top-up', {
                amount: numAmount,
            });

            // Redirect to Stripe Checkout
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create payment session');
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setAmount('');
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Top Up Wallet</DialogTitle>
                    <DialogDescription>
                        Add funds to your wallet using a credit or debit card
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Quick Amount Buttons */}
                    <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                            Quick Amounts
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                            {QUICK_AMOUNTS.map((quickAmount) => (
                                <Button
                                    key={quickAmount}
                                    variant={amount === quickAmount.toString() ? 'default' : 'outline'}
                                    onClick={() => handleQuickAmount(quickAmount)}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    ${quickAmount}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Amount Input */}
                    <div>
                        <Label htmlFor="amount">Custom Amount ($)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setError('');
                            }}
                            min="5"
                            max="1000"
                            step="0.01"
                            disabled={loading}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Minimum: $5 | Maximum: $1000
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="bg-muted/50 p-3 rounded-md space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                Secure payment via Stripe
                            </span>
                        </div>
                        {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) >= 5 && (
                            <div className="text-sm font-medium">
                                You will be charged: ${parseFloat(amount).toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTopUp}
                        disabled={loading || !amount}
                        className="gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4" />
                                Continue to Payment
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
