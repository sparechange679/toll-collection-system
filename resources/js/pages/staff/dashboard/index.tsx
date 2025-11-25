import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { CashPaymentModal } from '@/components/staff/cash-payment-modal';
import { ManualOverrideModal } from '@/components/staff/manual-override-modal';
import { IncidentReportModal } from '@/components/staff/incident-report-modal';

interface TollGate {
    id: number;
    name: string;
    location: string;
    gate_status: string;
    rfid_scanner_status: string;
    weight_sensor_status: string;
    base_toll_rate: string;
    overweight_fine_rate: string;
    weight_limit_kg: string;
}

interface ShiftLog {
    id: number;
    clock_in_at: string;
    toll_gate: TollGate;
}

interface TodayStats {
    total_revenue: string;
    total_passages: number;
    successful_passages: number;
    rejected_passages: number;
    cash_payments: number;
    manual_overrides: number;
    overweight_violations: number;
}

interface TollPassage {
    id: number;
    status: string;
    toll_amount: string;
    fine_amount: string;
    total_amount: string;
    vehicle_weight_kg: string;
    is_overweight: boolean;
    payment_method: string;
    scanned_at: string;
    rejection_reason?: string;
    user?: { name: string; email: string };
    vehicle?: { registration_number: string; make: string; model: string };
}

interface Incident {
    id: number;
    title: string;
    incident_type: string;
    severity: string;
    status: string;
    occurred_at: string;
}

interface HandoverNote {
    id: number;
    notes: string;
    created_at: string;
    from_staff: { name: string };
}

interface Props {
    error?: string;
    tollGate: TollGate;
    currentShift?: ShiftLog;
    todayStats: TodayStats;
    recentPassages: TollPassage[];
    unresolvedIncidents: Incident[];
    unreadHandoverNotes: HandoverNote[];
}

export default function StaffDashboard({
    error,
    tollGate,
    currentShift,
    todayStats,
    recentPassages: initialPassages,
    unresolvedIncidents,
    unreadHandoverNotes,
}: Props) {
    const [recentPassages, setRecentPassages] = useState(initialPassages);
    const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());
    const [showCashPayment, setShowCashPayment] = useState(false);
    const [showManualOverride, setShowManualOverride] = useState(false);
    const [showIncidentReport, setShowIncidentReport] = useState(false);

    // Poll for updates every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetch(
                `/staff/dashboard/updates?toll_gate_id=${tollGate.id}&since=${lastUpdate}`,
            )
                .then((res) => res.json())
                .then((data) => {
                    if (data.newPassages && data.newPassages.length > 0) {
                        setRecentPassages((prev) => [
                            ...data.newPassages,
                            ...prev,
                        ].slice(0, 20));
                    }
                    setLastUpdate(data.timestamp);
                })
                .catch(console.error);
        }, 5000);

        return () => clearInterval(interval);
    }, [tollGate.id, lastUpdate]);

    if (error) {
        return (
            <AppLayout breadcrumbs={[{ label: 'Staff Dashboard', url: '/staff/dashboard' }]}>
                <div className="p-6">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        );
    }

    const getStatusBadgeVariant = (status: string) => {
        if (status === 'success') return 'default';
        if (status === 'cash_payment') return 'secondary';
        if (status === 'manual_override') return 'outline';
        return 'destructive';
    };

    const getStatusColor = (status: string) => {
        if (status === 'operational') return 'text-green-600';
        if (status === 'offline') return 'text-red-600';
        if (status === 'error') return 'text-red-600';
        if (status === 'open') return 'text-green-600';
        if (status === 'closed') return 'text-gray-600';
        if (status === 'malfunction') return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Staff Dashboard', url: '/staff/dashboard' }]}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{tollGate.name}</h1>
                        <p className="text-muted-foreground">{tollGate.location}</p>
                    </div>
                    <div className="flex gap-2">
                        {!currentShift ? (
                            <Button onClick={() => router.visit('/staff/shifts')}>
                                Clock In
                            </Button>
                        ) : (
                            <Button variant="destructive" onClick={() => router.visit('/staff/shifts')}>
                                Clock Out
                            </Button>
                        )}
                    </div>
                </div>

                {/* Alerts */}
                {unreadHandoverNotes.length > 0 && (
                    <Alert>
                        <AlertDescription>
                            You have {unreadHandoverNotes.length} unread handover note(s) from the previous shift.
                        </AlertDescription>
                    </Alert>
                )}

                {unresolvedIncidents.length > 0 && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            There are {unresolvedIncidents.length} unresolved incident(s) requiring attention.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Gate Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gate Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Gate</p>
                                <p className={`font-medium ${getStatusColor(tollGate.gate_status)}`}>
                                    {tollGate.gate_status.toUpperCase()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">RFID Scanner</p>
                                <p className={`font-medium ${getStatusColor(tollGate.rfid_scanner_status)}`}>
                                    {tollGate.rfid_scanner_status.toUpperCase()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Weight Sensor</p>
                                <p className={`font-medium ${getStatusColor(tollGate.weight_sensor_status)}`}>
                                    {tollGate.weight_sensor_status.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Revenue</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">₱{todayStats.total_revenue}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Passages</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{todayStats.total_passages}</p>
                            <p className="text-xs text-muted-foreground">
                                {todayStats.successful_passages} successful
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Rejections</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{todayStats.rejected_passages}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Violations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{todayStats.overweight_violations}</p>
                            <p className="text-xs text-muted-foreground">Overweight</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={() => setShowCashPayment(true)}>
                                Cash Payment
                            </Button>
                            <Button variant="outline" onClick={() => setShowManualOverride(true)}>
                                Manual Override
                            </Button>
                            <Button variant="destructive" onClick={() => setShowIncidentReport(true)}>
                                Report Incident
                            </Button>
                            <Button variant="secondary" onClick={() => router.visit('/staff/driver-lookup')}>
                                Driver Lookup
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Passages - Live Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Passages</CardTitle>
                        <CardDescription>Live feed of vehicles passing through</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {recentPassages.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No passages yet today</p>
                            ) : (
                                recentPassages.map((passage) => (
                                    <div
                                        key={passage.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getStatusBadgeVariant(passage.status)}>
                                                    {passage.status.replace(/_/g, ' ').toUpperCase()}
                                                </Badge>
                                                {passage.is_overweight && (
                                                    <Badge variant="destructive">OVERWEIGHT</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium mt-1">
                                                {passage.vehicle
                                                    ? `${passage.vehicle.make} ${passage.vehicle.model} (${passage.vehicle.registration_number})`
                                                    : 'Unregistered Vehicle'}
                                            </p>
                                            {passage.user && (
                                                <p className="text-xs text-muted-foreground">
                                                    {passage.user.name}
                                                </p>
                                            )}
                                            {passage.rejection_reason && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    {passage.rejection_reason}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">₱{passage.total_amount}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(passage.scanned_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            <CashPaymentModal
                open={showCashPayment}
                onClose={() => setShowCashPayment(false)}
                tollGate={tollGate}
            />
            <ManualOverrideModal
                open={showManualOverride}
                onClose={() => setShowManualOverride(false)}
                tollGate={tollGate}
            />
            <IncidentReportModal
                open={showIncidentReport}
                onClose={() => setShowIncidentReport(false)}
                tollGate={tollGate}
            />
        </AppLayout>
    );
}
