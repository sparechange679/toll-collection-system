import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { useState, useEffect, useRef } from 'react';
import { Activity, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Staff Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Toll Gate Monitor',
        href: '/staff/toll-gate-monitor',
    },
];

interface TollGateActivity {
    id: number;
    timestamp: string;
    toll_gate: string;
    driver_name: string;
    vehicle: string;
    rfid_tag: string;
    status: string;
    total_amount: number;
    toll_amount: number;
    fine_amount: number;
    is_overweight: boolean;
    vehicle_weight_kg: number | null;
    payment_method: string;
}

interface Props {
    initialActivity: TollGateActivity[];
}

export default function TollGateMonitor({ initialActivity }: Props) {
    const [activity, setActivity] = useState<TollGateActivity[]>(initialActivity);
    const [isPolling, setIsPolling] = useState(true);
    const [latestTimestamp, setLatestTimestamp] = useState<string | null>(
        initialActivity[0]?.timestamp || null
    );
    const logEndRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Auto-scroll to bottom when new activity arrives
    useEffect(() => {
        if (autoScroll && logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activity, autoScroll]);

    // Poll for updates every 2 seconds
    useEffect(() => {
        if (!isPolling) return;

        const interval = setInterval(async () => {
            try {
                const params = new URLSearchParams();
                if (latestTimestamp) {
                    params.append('since', latestTimestamp);
                }

                const response = await fetch(`/staff/toll-gate-monitor/updates?${params}`);
                const data = await response.json();

                if (data.activity && data.activity.length > 0) {
                    setActivity((prev) => [...data.activity.reverse(), ...prev].slice(0, 50));
                    setLatestTimestamp(data.latest_timestamp);
                }
            } catch (error) {
                console.error('Failed to fetch updates:', error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isPolling, latestTimestamp]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'successful':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'successful':
                return <Badge className="bg-green-500">Success</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Toll Gate Monitor" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Activity className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Toll Gate Activity Monitor</CardTitle>
                                    <CardDescription>
                                        Real-time toll gate passage activity (updates every 2 seconds)
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setAutoScroll(!autoScroll)}
                                    className={`text-sm px-3 py-1 rounded ${
                                        autoScroll
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'}
                                </button>
                                <button
                                    onClick={() => setIsPolling(!isPolling)}
                                    className={`text-sm px-3 py-1 rounded ${
                                        isPolling
                                            ? 'bg-green-500 text-white'
                                            : 'bg-red-500 text-white'
                                    }`}
                                >
                                    {isPolling ? '● Live' : '○ Paused'}
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto border rounded-md bg-black text-green-400 font-mono text-sm p-4 space-y-2">
                            {activity.length === 0 ? (
                                <div className="text-gray-500">
                                    No activity yet. Waiting for toll gate scans...
                                </div>
                            ) : (
                                activity.map((log) => (
                                    <div
                                        key={log.id}
                                        className="border-b border-gray-800 pb-2 mb-2 last:border-0"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-gray-500">[{log.timestamp}]</span>
                                            {getStatusIcon(log.status)}
                                            <span className="font-bold">{log.toll_gate}</span>
                                            {getStatusBadge(log.status)}
                                        </div>
                                        <div className="pl-4 space-y-1 text-xs">
                                            <div>
                                                <span className="text-blue-400">RFID:</span>{' '}
                                                {log.rfid_tag}
                                            </div>
                                            <div>
                                                <span className="text-blue-400">Driver:</span>{' '}
                                                {log.driver_name}
                                            </div>
                                            <div>
                                                <span className="text-blue-400">Vehicle:</span>{' '}
                                                {log.vehicle}
                                            </div>
                                            {log.vehicle_weight_kg !== null && log.vehicle_weight_kg !== undefined && (
                                                <div>
                                                    <span className="text-blue-400">Weight:</span>{' '}
                                                    {Number(log.vehicle_weight_kg).toFixed(2)} kg
                                                    {log.is_overweight && (
                                                        <span className="text-yellow-400 ml-2">
                                                            ⚠️ OVERWEIGHT
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-blue-400">Amount:</span> $
                                                {Number(log.total_amount).toFixed(2)} (Toll: $
                                                {Number(log.toll_amount).toFixed(2)}
                                                {log.fine_amount > 0 && (
                                                    <span className="text-red-400">
                                                        {' '}
                                                        + Fine: ${Number(log.fine_amount).toFixed(2)}
                                                    </span>
                                                )}
                                                )
                                            </div>
                                            <div>
                                                <span className="text-blue-400">Payment:</span>{' '}
                                                {log.payment_method}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
