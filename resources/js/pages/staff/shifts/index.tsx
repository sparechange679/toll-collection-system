import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface TollGate {
    id: number;
    name: string;
    location: string;
}

interface ShiftLog {
    id: number;
    clock_in_at: string;
    clock_out_at?: string;
    total_passages: number;
    successful_passages: number;
    rejected_passages: number;
    manual_overrides: number;
    cash_payments: number;
    total_revenue: string;
    cash_collected: string;
    toll_gate: TollGate;
}

interface Props {
    currentShift?: ShiftLog;
    recentShifts: ShiftLog[];
    tollGates: TollGate[];
}

export default function ShiftManagement({
    currentShift,
    recentShifts,
    tollGates,
}: Props) {
    const [showClockIn, setShowClockIn] = useState(false);
    const [showClockOut, setShowClockOut] = useState(false);

    const clockInForm = useForm({
        toll_gate_id: tollGates[0]?.id.toString() || '',
    });

    const clockOutForm = useForm({
        notes: '',
        handover_notes: '',
        pending_issues: [] as string[],
    });

    const handleClockIn = () => {
        clockInForm.post('/staff/shifts/clock-in', {
            onSuccess: () => {
                setShowClockIn(false);
                clockInForm.reset();
            },
        });
    };

    const handleClockOut = () => {
        clockOutForm.post('/staff/shifts/clock-out', {
            onSuccess: () => {
                setShowClockOut(false);
                clockOutForm.reset();
            },
        });
    };

    const formatDuration = (clockIn: string, clockOut?: string) => {
        const start = new Date(clockIn);
        const end = clockOut ? new Date(clockOut) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { label: 'Staff Dashboard', url: '/staff/dashboard' },
                { label: 'Shift Management', url: '/staff/shifts' },
            ]}
        >
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Shift Management</h1>
                        <p className="text-muted-foreground">
                            Clock in/out and view your shift history
                        </p>
                    </div>
                    <div>
                        {!currentShift ? (
                            <Button onClick={() => setShowClockIn(true)} size="lg">
                                Clock In
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                onClick={() => setShowClockOut(true)}
                                size="lg"
                            >
                                Clock Out
                            </Button>
                        )}
                    </div>
                </div>

                {/* Current Shift */}
                {currentShift && (
                    <Card className="border-green-500 bg-green-50 dark:bg-green-900/10">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-green-700 dark:text-green-400">
                                        Active Shift
                                    </CardTitle>
                                    <CardDescription>
                                        {currentShift.toll_gate.name} -{' '}
                                        {currentShift.toll_gate.location}
                                    </CardDescription>
                                </div>
                                <Badge variant="default" className="bg-green-600">
                                    ACTIVE
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Clock In</p>
                                    <p className="font-medium">
                                        {new Date(
                                            currentShift.clock_in_at,
                                        ).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Duration</p>
                                    <p className="font-medium">
                                        {formatDuration(currentShift.clock_in_at)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Revenue</p>
                                    <p className="font-medium">
                                        ₱{currentShift.total_revenue}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Passages</p>
                                    <p className="font-medium">
                                        {currentShift.total_passages}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Shifts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Shifts</CardTitle>
                        <CardDescription>Your shift history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentShifts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No shift history yet
                                </p>
                            ) : (
                                recentShifts.map((shift) => (
                                    <div
                                        key={shift.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                        onClick={() =>
                                            router.visit(`/staff/shifts/${shift.id}`)
                                        }
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {shift.toll_gate.name}
                                                </p>
                                                {!shift.clock_out_at && (
                                                    <Badge variant="default">ACTIVE</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(
                                                    shift.clock_in_at,
                                                ).toLocaleDateString()}{' '}
                                                {new Date(
                                                    shift.clock_in_at,
                                                ).toLocaleTimeString()}{' '}
                                                -{' '}
                                                {shift.clock_out_at
                                                    ? new Date(
                                                          shift.clock_out_at,
                                                      ).toLocaleTimeString()
                                                    : 'Ongoing'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {shift.total_passages} passages •{' '}
                                                {shift.successful_passages} successful •{' '}
                                                {shift.rejected_passages} rejected
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">
                                                ₱{shift.total_revenue}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDuration(
                                                    shift.clock_in_at,
                                                    shift.clock_out_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Clock In Dialog */}
            <Dialog open={showClockIn} onOpenChange={setShowClockIn}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clock In</DialogTitle>
                        <DialogDescription>
                            Select a toll gate to start your shift
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Toll Gate</Label>
                            <Select
                                value={clockInForm.data.toll_gate_id}
                                onValueChange={(value) =>
                                    clockInForm.setData('toll_gate_id', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {tollGates.map((gate) => (
                                        <SelectItem
                                            key={gate.id}
                                            value={gate.id.toString()}
                                        >
                                            {gate.name} - {gate.location}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowClockIn(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleClockIn}
                            disabled={clockInForm.processing}
                        >
                            {clockInForm.processing ? 'Clocking In...' : 'Clock In'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clock Out Dialog */}
            <Dialog open={showClockOut} onOpenChange={setShowClockOut}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Clock Out</DialogTitle>
                        <DialogDescription>
                            End your shift and leave handover notes for the next staff
                            member
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="notes">Shift Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={clockOutForm.data.notes}
                                onChange={(e) =>
                                    clockOutForm.setData('notes', e.target.value)
                                }
                                placeholder="Any notes about your shift..."
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="handover_notes">
                                Handover Notes (Optional)
                            </Label>
                            <Textarea
                                id="handover_notes"
                                value={clockOutForm.data.handover_notes}
                                onChange={(e) =>
                                    clockOutForm.setData('handover_notes', e.target.value)
                                }
                                placeholder="Important information for the next shift..."
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                This will be shown to the next staff member who clocks in
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowClockOut(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleClockOut}
                            disabled={clockOutForm.processing}
                        >
                            {clockOutForm.processing ? 'Clocking Out...' : 'Clock Out'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
