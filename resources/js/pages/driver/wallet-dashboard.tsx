import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState } from 'react';
import TopUpModal from '@/components/top-up-modal';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Wallet',
        href: '/wallet',
    },
];

interface Transaction {
    id: number;
    type: 'credit' | 'debit';
    amount: string;
    description: string;
    balance_after: string;
    created_at: string;
    reference?: string;
}

interface WalletData {
    balance: string;
    recent_transactions: Transaction[];
}

export default function WalletDashboard() {
    const { wallet } = usePage().props as unknown as { wallet: WalletData };
    const [showTopUpModal, setShowTopUpModal] = useState(false);

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(parseFloat(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wallet" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Balance Card */}
                <Card className="relative overflow-hidden border-sidebar-border/70 bg-gradient-to-br from-primary/10 to-primary/5 dark:border-sidebar-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Available Balance
                            </CardTitle>
                            <div className="mt-2 text-4xl font-bold">
                                {formatCurrency(wallet.balance)}
                            </div>
                        </div>
                        <Wallet className="h-12 w-12 text-primary/50" />
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Button
                            onClick={() => setShowTopUpModal(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Top Up Wallet
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.visit('/wallet/transactions')}
                        >
                            View All Transactions
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>
                            Your latest wallet activity
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {wallet.recent_transactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No transactions yet. Top up your wallet to get started!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {wallet.recent_transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`rounded-full p-2 ${
                                                transaction.type === 'credit'
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                                {transaction.type === 'credit' ? (
                                                    <ArrowUpRight className="h-4 w-4" />
                                                ) : (
                                                    <ArrowDownRight className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{transaction.description}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(transaction.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold ${
                                                transaction.type === 'credit'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {transaction.type === 'credit' ? '+' : '-'}
                                                {formatCurrency(transaction.amount)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Balance: {formatCurrency(transaction.balance_after)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <TopUpModal
                open={showTopUpModal}
                onClose={() => setShowTopUpModal(false)}
            />
        </AppLayout>
    );
}
