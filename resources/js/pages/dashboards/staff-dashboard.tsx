import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Receipt, Clock } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Staff Dashboard',
        href: dashboard().url,
    },
];

export default function StaffDashboard() {
    const stats = [
        {
            title: 'Vehicles Processed',
            value: '0',
            icon: Car,
            description: 'Today',
        },
        {
            title: 'Collections',
            value: 'MWK 0',
            icon: Receipt,
            description: 'This shift',
        },
        {
            title: 'Active Time',
            value: '0h 0m',
            icon: Clock,
            description: 'Current shift',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff Dashboard" />

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

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common toll booth operations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                                <h3 className="font-semibold mb-2">Process Vehicle</h3>
                                <p className="text-sm text-muted-foreground">
                                    Record toll transaction
                                </p>
                            </div>
                            <div className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                                <h3 className="font-semibold mb-2">View Queue</h3>
                                <p className="text-sm text-muted-foreground">
                                    Check waiting vehicles
                                </p>
                            </div>
                            <div className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                                <h3 className="font-semibold mb-2">Shift Report</h3>
                                <p className="text-sm text-muted-foreground">
                                    View current shift summary
                                </p>
                            </div>
                            <div className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                                <h3 className="font-semibold mb-2">Vehicle Lookup</h3>
                                <p className="text-sm text-muted-foreground">
                                    Search vehicle information
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
