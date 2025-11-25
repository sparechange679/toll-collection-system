import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, DollarSign, Bell, FileText, Database } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
];

export default function AdminDashboard() {
    const stats = [
        {
            title: 'Total Users',
            value: '0',
            icon: Users,
            description: 'Registered system users',
        },
        {
            title: 'Active Vehicles',
            value: '0',
            icon: Car,
            description: 'Vehicles in the system',
        },
        {
            title: 'Revenue',
            value: 'MWK 0',
            icon: DollarSign,
            description: 'Total toll collections',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {stats.map((stat, index) => (
                        <Card key={index}>
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

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common administrative tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => router.visit('/admin/vehicles/users')}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">View Users & Vehicles</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    View registered users and their vehicles
                                </p>
                            </div>
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => router.visit('/admin/vehicles')}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">Vehicle Registry</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Browse all registered vehicles
                                </p>
                            </div>
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => router.visit('/admin/notifications/toll-rate')}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Bell className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">Send Toll Rate Notification</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Notify drivers about updated toll rates
                                </p>
                            </div>
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => router.visit('/admin/notifications')}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Bell className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">Notifications</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    View and manage notifications
                                </p>
                            </div>
                            <div
                                className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => router.visit('/admin/reports')}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">Reports</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    View revenue and toll gate usage reports
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
