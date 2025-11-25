import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowUpRight, ArrowDownRight, Search, Filter, Download, FileText } from 'lucide-react';
import { useState } from 'react';
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
    {
        title: 'Transactions',
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
    metadata?: never;
}

interface PaginatedTransactions {
    data: Transaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function TransactionHistory() {
    const { transactions } = usePage().props as unknown as {
        transactions: PaginatedTransactions;
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

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

    const filteredTransactions = transactions.data.filter((transaction) => {
        const matchesSearch = transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const handlePageChange = (page: number) => {
        router.visit(`/wallet/transactions?page=${page}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaction History" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Transaction History</CardTitle>
                                <CardDescription>
                                    View all your wallet transactions
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => window.location.href = '/wallet/export/xlsx'}
                                >
                                    <Download className="h-4 w-4" />
                                    Export Excel
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => window.location.href = '/wallet/export/pdf'}
                                >
                                    <FileText className="h-4 w-4" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="credit">Credits Only</SelectItem>
                                    <SelectItem value="debit">Debits Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-lg font-medium">No transactions found</p>
                                <p className="text-sm mt-1">
                                    {searchTerm || typeFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Your transaction history will appear here'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Transactions List */}
                                <div className="space-y-3">
                                    {filteredTransactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div
                                                    className={`rounded-full p-2 ${
                                                        transaction.type === 'credit'
                                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                    }`}
                                                >
                                                    {transaction.type === 'credit' ? (
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">
                                                        {transaction.description}
                                                    </p>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                                                        <span>{formatDate(transaction.created_at)}</span>
                                                        {transaction.reference && (
                                                            <span className="text-xs font-mono">
                                                                Ref: {transaction.reference.substring(0, 20)}...
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p
                                                    className={`font-semibold ${
                                                        transaction.type === 'credit'
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}
                                                >
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

                                {/* Pagination */}
                                {transactions.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-6">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {transactions.data.length} of {transactions.total}{' '}
                                            transactions
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(transactions.current_page - 1)}
                                                disabled={transactions.current_page === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(transactions.current_page + 1)}
                                                disabled={transactions.current_page === transactions.last_page}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
