import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';
import { useState } from 'react';
import TopUpModal from './top-up-modal';

interface LowBalanceAlertProps {
    balance: number;
    threshold?: number;
}

export default function LowBalanceAlert({ balance, threshold = 20 }: LowBalanceAlertProps) {
    const [showTopUpModal, setShowTopUpModal] = useState(false);

    if (balance >= threshold) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <>
            <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertTitle className="text-orange-900 dark:text-orange-100">
                    Low Balance Warning
                </AlertTitle>
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                    <div className="flex items-center justify-between gap-4">
                        <span>
                            Your wallet balance is low ({formatCurrency(balance)}). Top up now to
                            avoid interruptions at toll gates.
                        </span>
                        <Button
                            size="sm"
                            onClick={() => setShowTopUpModal(true)}
                            className="gap-2 shrink-0"
                        >
                            <Plus className="h-3 w-3" />
                            Top Up
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>

            <TopUpModal open={showTopUpModal} onClose={() => setShowTopUpModal(false)} />
        </>
    );
}
