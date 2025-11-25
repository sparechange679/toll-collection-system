import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Users, Car, DollarSign, TrendingUp } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Reports',
        href: '/admin/reports',
    },
];

interface PageProps {
    filters: {
        date_from: string;
        date_to: string;
    };
    revenue: {
        total: number;
        daily: Array<{ date: string; total: number }>;
    };
    transactions: {
        total: number;
        by_type: Array<{ type: string; count: number; total: number }>;
    };
    users: {
        total_drivers: number;
        active_drivers: number;
    };
    vehicles: {
        total: number;
        active: number;
        by_type: Array<{ vehicle_type: string; count: number }>;
    };
    top_users: Array<{
        user_id: number;
        total_spent: number;
        transaction_count: number;
        user: { name: string; email: string };
    }>;
}

export default function ReportsIndex() {
    const { filters, revenue, transactions, users, vehicles, top_users } =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        usePage<PageProps>().props;

    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);

    const handleFilterChange = () => {
        router.get(
            '/admin/reports',
            { date_from: dateFrom, date_to: dateTo },
            { preserveState: true }
        );
    };

    const handleExport = (type: 'revenue' | 'usage') => {
        window.location.href = `/admin/reports/export/${type}?date_from=${dateFrom}&date_to=${dateTo}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports & Analytics" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                        <p className="text-muted-foreground">
                            View revenue and toll gate usage statistics
                        </p>
                    </div>
                </div>

                {/* Date Range Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter by Date Range</CardTitle>
                        <CardDescription>Select a date range to view reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="date_from">From Date</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="date_to">To Date</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <Button onClick={handleFilterChange}>Apply Filter</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(revenue.total)}</div>
                            <p className="text-xs text-muted-foreground">
                                {transactions.total} transactions
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.active_drivers}</div>
                            <p className="text-xs text-muted-foreground">
                                of {users.total_drivers} total drivers
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{vehicles.active}</div>
                            <p className="text-xs text-muted-foreground">
                                of {vehicles.total} total vehicles
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(
                                    transactions.total > 0 ? revenue.total / transactions.total : 0
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">per toll transaction</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Export Buttons */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Report</CardTitle>
                            <CardDescription>
                                Export detailed revenue data with user information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => handleExport('revenue')} className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Export Revenue Report (CSV)
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Toll Gate Usage Report</CardTitle>
                            <CardDescription>
                                Export toll usage data with vehicle details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => handleExport('usage')} className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Export Usage Report (CSV)
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Users */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 10 Revenue Generators</CardTitle>
                        <CardDescription>Users with highest toll payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {top_users.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No transaction data available for this period
                                </p>
                            ) : (
                                top_users.map((user, index) => (
                                    <div
                                        key={user.user_id}
                                        className="flex items-center justify-between border-b pb-4 last:border-0"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.user.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">
                                                {formatCurrency(user.total_spent)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {user.transaction_count} transactions
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Vehicle Types Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicles by Type</CardTitle>
                        <CardDescription>Distribution of registered vehicles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {vehicles.by_type.map((type) => (
                                <div
                                    key={type.vehicle_type}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <span className="font-medium capitalize">
                                        {type.vehicle_type}
                                    </span>
                                    <span className="text-2xl font-bold">{type.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
