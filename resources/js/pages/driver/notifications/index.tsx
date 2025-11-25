import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, User } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

interface Notification {
    id: number;
    is_read: boolean;
    read_at: string | null;
    notification: {
        id: number;
        type: string;
        title: string;
        message: string;
        data: {
            previous_rate?: number;
            new_rate?: number;
            effective_date?: string;
            reason?: string;
        } | null;
        sent_at: string;
        creator: {
            name: string;
            email: string;
        } | null;
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
}

export default function NotificationsIndex() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { notifications } = usePage<PageProps>().props;

    const formatMoney = (value: unknown): string => {
        const num =
            typeof value === 'number'
                ? value
                : typeof value === 'string'
                  ? parseFloat(value)
                  : NaN;
        if (Number.isFinite(num)) {
            return num.toFixed(2);
        }
        return '—';
    };

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

    const renderNotificationContent = (notification: Notification['notification']) => {
        if (notification.type === 'toll_rate' && notification.data) {
            return (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <div className="grid gap-2 md:grid-cols-2 rounded-lg border bg-muted/50 p-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Previous Rate</p>
                            <p className="text-lg font-semibold">
                                MWK {formatMoney(notification.data.previous_rate)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">New Rate</p>
                            <p className="text-lg font-semibold text-green-600">
                                MWK {formatMoney(notification.data.new_rate)}
                            </p>
                        </div>
                        {notification.data.effective_date && (
                            <div className="md:col-span-2">
                                <p className="text-xs text-muted-foreground">Effective Date</p>
                                <p className="font-medium">
                                    {formatDate(notification.data.effective_date)}
                                </p>
                            </div>
                        )}
                        {notification.data.reason && (
                            <div className="md:col-span-2">
                                <p className="text-xs text-muted-foreground">Reason</p>
                                <p className="text-sm">{notification.data.reason}</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return <p className="text-sm text-muted-foreground">{notification.message}</p>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground">
                            View all your notifications and updates
                        </p>
                    </div>
                </div>

                {notifications.data.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                        <p className="text-muted-foreground">
                            You don't have any notifications at the moment.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {notifications.data.map((item) => (
                            <Card key={item.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <CardTitle className="text-lg">
                                                    {item.notification.title}
                                                </CardTitle>
                                                <Badge className={getTypeColor(item.notification.type)}>
                                                    {item.notification.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <CardDescription className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(item.notification.sent_at)}
                                                </span>
                                                {item.notification.creator && (
                                                    <span className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5" />
                                                        Sent by {item.notification.creator.name}
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>{renderNotificationContent(item.notification)}</CardContent>
                            </Card>
                        ))}

                        {notifications.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map(
                                    (page) => (
                                        <Link key={page} href={`/notifications?page=${page}`}>
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
