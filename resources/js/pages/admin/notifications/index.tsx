import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Eye } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { Alert, AlertDescription } from '@/components/ui/alert';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Notifications',
        href: '/admin/notifications',
    },
];

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    recipients_count: number;
    created_at: string;
    sent_at: string;
    creator: {
        name: string;
        email: string;
    };
}

interface PageProps {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function NotificationsIndex() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { notifications, flash } = usePage<PageProps>().props;

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            toll_rate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            alert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return colors[type] || colors.general;
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
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground">
                            Manage and track all system notifications
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/notifications/toll-rate">
                            <Button>
                                <Bell className="mr-2 h-4 w-4" />
                                Send Toll Rate Update
                            </Button>
                        </Link>
                    </div>
                </div>

                {flash?.success && (
                    <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800">
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}

                {notifications.data.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Notifications Sent</h3>
                        <p className="text-muted-foreground mb-4">
                            Start by sending a toll rate update to all drivers.
                        </p>
                        <Link href="/admin/notifications/toll-rate">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Send First Notification
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {notifications.data.map((notification) => (
                            <Card key={notification.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg">
                                                    {notification.title}
                                                </CardTitle>
                                                <Badge className={getTypeColor(notification.type)}>
                                                    {notification.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                Sent by {notification.creator.name} on{' '}
                                                {formatDate(notification.sent_at)}
                                            </CardDescription>
                                        </div>
                                        <Link href={`/admin/notifications/${notification.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-muted-foreground">
                                            <strong className="text-foreground">
                                                {notification.recipients_count}
                                            </strong>{' '}
                                            recipients
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {notifications.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map(
                                    (page) => (
                                        <Link
                                            key={page}
                                            href={`/admin/notifications?page=${page}`}
                                        >
                                            <Button
                                                variant={
                                                    page === notifications.current_page
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="sm"
                                            >
                                                {page}
                                            </Button>
                                        </Link>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
