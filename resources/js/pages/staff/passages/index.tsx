import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface TollGate {
    id: number;
    name: string;
    location: string;
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
    created_at: string;
    rejection_reason?: string;
    user?: { id: number; name: string; email: string };
    vehicle?: {
        id: number;
        registration_number: string;
        make: string;
        model: string;
    };
    staff?: { id: number; name: string };
}

interface PaginatedPassages {
    data: TollPassage[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    passages: PaginatedPassages;
    tollGates: TollGate[];
    filters: {
        toll_gate_id?: string;
        status?: string;
        date_from: string;
        date_to: string;
    };
}

export default function PassageLogs({ passages, tollGates, filters }: Props) {
    const [filterTollGate, setFilterTollGate] = useState(
        filters.toll_gate_id || '',
    );
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from);
    const [filterDateTo, setFilterDateTo] = useState(filters.date_to);

    const applyFilters: FormEventHandler = (e) => {
        e.preventDefault();
        router.get('/staff/passages', {
            toll_gate_id: filterTollGate || undefined,
            status: filterStatus || undefined,
            date_from: filterDateFrom,
            date_to: filterDateTo,
        });
    };

    const resetFilters = () => {
        setFilterTollGate('');
        setFilterStatus('');
        setFilterDateFrom(new Date().toISOString().split('T')[0]);
        setFilterDateTo(new Date().toISOString().split('T')[0]);
        router.get('/staff/passages');
    };

    const getStatusBadgeVariant = (status: string) => {
        if (status === 'success') return 'default';
        if (status === 'cash_payment') return 'secondary';
        if (status === 'manual_override') return 'outline';
        return 'destructive';
    };

    const goToPage = (page: number) => {
        router.get('/staff/passages', {
            page,
            toll_gate_id: filterTollGate || undefined,
            status: filterStatus || undefined,
            date_from: filterDateFrom,
            date_to: filterDateTo,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { label: 'Staff Dashboard', url: '/staff/dashboard' },
                { label: 'Passage Logs', url: '/staff/passages' },
            ]}
        >
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Passage Logs</h1>
                    <p className="text-muted-foreground">
                        View and filter all vehicle passages
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={applyFilters} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label>Toll Gate</Label>
                                    <Select
                                        value={filterTollGate}
                                        onValueChange={setFilterTollGate}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Gates" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Gates</SelectItem>
                                            {tollGates.map((gate) => (
                                                <SelectItem
                                                    key={gate.id}
                                                    value={gate.id.toString()}
                                                >
                                                    {gate.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={filterStatus}
                                        onValueChange={setFilterStatus}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Status</SelectItem>
                                            <SelectItem value="success">Success</SelectItem>
                                            <SelectItem value="rejected_insufficient_funds">
                                                Rejected - Insufficient Funds
                                            </SelectItem>
                                            <SelectItem value="rejected_unregistered">
                                                Rejected - Unregistered
                                            </SelectItem>
                                            <SelectItem value="cash_payment">
                                                Cash Payment
                                            </SelectItem>
                                            <SelectItem value="manual_override">
                                                Manual Override
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Date From</Label>
                                    <Input
                                        type="date"
                                        value={filterDateFrom}
                                        onChange={(e) =>
                                            setFilterDateFrom(e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>Date To</Label>
                                    <Input
                                        type="date"
                                        value={filterDateTo}
                                        onChange={(e) => setFilterDateTo(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">Apply Filters</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetFilters}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Passages List */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Passages</CardTitle>
                                <CardDescription>
                                    Showing {passages.data.length} of {passages.total}{' '}
                                    passages
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {passages.data.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No passages found
                                </p>
                            ) : (
                                passages.data.map((passage) => (
                                    <div
                                        key={passage.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                        onClick={() =>
                                            router.visit(`/staff/passages/${passage.id}`)
                                        }
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={getStatusBadgeVariant(
                                                        passage.status,
                                                    )}
                                                >
                                                    {passage.status
                                                        .replace(/_/g, ' ')
                                                        .toUpperCase()}
                                                </Badge>
                                                {passage.is_overweight && (
                                                    <Badge variant="destructive">
                                                        OVERWEIGHT
                                                    </Badge>
                                                )}
                                                <Badge variant="outline">
                                                    {passage.payment_method}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-medium mt-1">
                                                {passage.vehicle
                                                    ? `${passage.vehicle.make} ${passage.vehicle.model} (${passage.vehicle.registration_number})`
                                                    : 'Unregistered Vehicle'}
                                            </p>
                                            {passage.user && (
                                                <p className="text-xs text-muted-foreground">
                                                    Driver: {passage.user.name}
                                                </p>
                                            )}
                                            {passage.staff && (
                                                <p className="text-xs text-muted-foreground">
                                                    Processed by: {passage.staff.name}
                                                </p>
                                            )}
                                            {passage.rejection_reason && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    {passage.rejection_reason}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">
                                                ₱{passage.total_amount}
                                            </p>
                                            {passage.fine_amount !== '0.00' && (
                                                <p className="text-xs text-red-600">
                                                    Fine: ₱{passage.fine_amount}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    passage.scanned_at,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {passages.last_page > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToPage(passages.current_page - 1)}
                                    disabled={passages.current_page === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {passages.current_page} of {passages.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToPage(passages.current_page + 1)}
                                    disabled={
                                        passages.current_page === passages.last_page
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
