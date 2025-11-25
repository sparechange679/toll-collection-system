import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Wallet, Receipt } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import LowBalanceAlert from '@/components/low-balance-alert';
import { useState } from 'react';
import TopUpModal from '@/components/top-up-modal';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Dashboard',
        href: dashboard().url,
    },
];

interface TransactionsSummaryItem {
    date: string;
    debit_total: number;
    credit_total: number;
    count: number;
}

interface PageProps {
    auth: {
        user: {
            balance: string;
        };
    };
    transactions_summary?: TransactionsSummaryItem[];
}

export default function DriverDashboard() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { auth, transactions_summary } = usePage<PageProps>().props;
    const [showTopUpModal, setShowTopUpModal] = useState(false);

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(parseFloat(amount));
    };

    const stats = [
        {
            title: 'Account Balance',
            value: formatCurrency(auth.user.balance),
            icon: Wallet,
            description: 'Available funds',
        },
        {
            title: 'My Vehicles',
            value: '0',
            icon: Car,
            description: 'Registered vehicles',
        },
        {
            title: 'Recent Trips',
            value: '0',
            icon: Receipt,
            description: 'This month',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Low Balance Alert */}
                {parseFloat(auth.user.balance) < 20 && (
                    <LowBalanceAlert balance={parseFloat(auth.user.balance)} threshold={20} />
                )}

                {/* Stats Grid */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {stats.map((stat, index) => (
                        <Card key={index} className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Transactions Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Spending (last 14 days)</CardTitle>
                        <CardDescription>
                            Daily totals of your wallet debits and credits
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions_summary && transactions_summary.length > 0 ? (
                            <div className="space-y-4">
                                {/* Simple bar chart using flex, scaled to max of debit+credit */}
                                {(() => {
                                    const points = transactions_summary;
                                    const maxValue = Math.max(
                                        1,
                                        ...points.map((p) => (p.debit_total + p.credit_total))
                                    );
                                    const barMaxHeight = 160; // px
                                    return (
                                        <div>
                                            <div className="flex items-end gap-2 h-[200px] border rounded-md p-3">
                                                {points.map((p, idx) => {
                                                    const debitHeight = Math.round((p.debit_total / maxValue) * barMaxHeight);
                                                    const creditHeight = Math.round((p.credit_total / maxValue) * barMaxHeight);
                                                    return (
                                                        <div key={idx} className="flex-1 flex flex-col items-center justify-end">
                                                            <div className="flex w-full items-end gap-1">
                                                                {/* Debit bar */}
                                                                <div
                                                                    title={`Debit ${p.date}: ${p.debit_total.toFixed(2)}`}
                                                                    className="flex-1 rounded-sm"
                                                                    style={{
                                                                        height: `${debitHeight}px`,
                                                                        backgroundColor: 'var(--color-chart-1)',
                                                                    }}
                                                                />
                                                                {/* Credit bar */}
                                                                <div
                                                                    title={`Credit ${p.date}: ${p.credit_total.toFixed(2)}`}
                                                                    className="flex-1 rounded-sm opacity-80"
                                                                    style={{
                                                                        height: `${creditHeight}px`,
                                                                        backgroundColor: 'var(--color-chart-2)',
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="mt-2 text-[10px] text-muted-foreground">
                                                                {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* Legend */}
                                            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'var(--color-chart-1)' }} />
                                                    <span>Debits</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'var(--color-chart-2)' }} />
                                                    <span>Credits</span>
                                                </div>
                                                <div className="ml-auto text-xs">
                                                    Max daily total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(maxValue)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="py-6 text-sm text-muted-foreground">
                                No transaction data for the past 14 days yet. Start driving to see your spending here.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Manage your account and vehicles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => setShowTopUpModal(true)}
                            >
                                <h3 className="font-semibold mb-2">Add Funds</h3>
                                <p className="text-sm text-muted-foreground">
                                    Top up your account balance
                                </p>
                            </div>
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => router.visit('/vehicles')}
                            >
                                <h3 className="font-semibold mb-2">My Vehicles</h3>
                                <p className="text-sm text-muted-foreground">
                                    View and manage vehicles
                                </p>
                            </div>
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => router.visit('/wallet/transactions')}
                            >
                                <h3 className="font-semibold mb-2">Transaction History</h3>
                                <p className="text-sm text-muted-foreground">
                                    View past transactions
                                </p>
                            </div>
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => router.visit('/settings/profile')}
                            >
                                <h3 className="font-semibold mb-2">Profile Settings</h3>
                                <p className="text-sm text-muted-foreground">
                                    Update your information
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <TopUpModal open={showTopUpModal} onClose={() => setShowTopUpModal(false)} />
        </AppLayout>
    );
}
