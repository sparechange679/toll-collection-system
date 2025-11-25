import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Car, Download, Filter } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Vehicle Registry',
        href: '/admin/vehicles',
    },
];

interface Vehicle {
    id: number;
    registration_number: string;
    make: string;
    model: string;
    year: number;
    vehicle_type: string;
    color: string | null;
    is_active: boolean;
    user: {
        name: string;
        email: string;
    };
}

interface PageProps {
    vehicles: {
        data: Vehicle[];
        current_page: number;
        last_page: number;
        total: number;
    };
    statistics: {
        total: number;
        active: number;
        inactive: number;
        by_type: Array<{ vehicle_type: string; count: number }>;
    };
    filters: {
        search?: string;
        vehicle_type?: string;
        status?: string;
    };
}

export default function VehiclesIndex() {
    const { vehicles, statistics, filters } = usePage<PageProps>().props;

    // Use optional chaining and fallbacks to avoid runtime errors when filters are missing
    const [search, setSearch] = useState(filters?.search ?? '');
    // Use 'all' as the UI sentinel value instead of empty string to satisfy Radix Select
    const [vehicleType, setVehicleType] = useState(filters?.vehicle_type && filters.vehicle_type !== '' ? filters.vehicle_type : 'all');
    const [status, setStatus] = useState(filters?.status && filters.status !== '' ? filters.status : 'all');

    // Provide safe defaults to prevent blank page if backend doesn't send data
    const vehiclesData = vehicles ?? {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const stats = statistics ?? {
        total: 0,
        active: 0,
        inactive: 0,
        by_type: [] as Array<{ vehicle_type: string; count: number }>,
    };

    const handleFilter = () => {
        const params: Record<string, string> = {};
        if (search) {
            params.search = search;
        }
        if (vehicleType && vehicleType !== 'all') {
            params.vehicle_type = vehicleType;
        }
        if (status && status !== 'all') {
            params.status = status;
        }
        router.get('/admin/vehicles', params, { preserveState: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (vehicleType && vehicleType !== 'all') {
            params.set('vehicle_type', vehicleType);
        }
        if (status && status !== 'all') {
            params.set('status', status);
        }
        const qs = params.toString();
        window.location.href = `/admin/vehicles/export${qs ? `?${qs}` : ''}`;
    };

    const getVehicleTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            car: 'Car',
            motorcycle: 'Motorcycle',
            truck: 'Truck',
            bus: 'Bus',
            van: 'Van',
        };
        return types[type] || type;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Registry" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Vehicle Registry</h1>
                        <p className="text-muted-foreground">
                            Browse and manage all registered vehicles
                        </p>
                    </div>
                    <Button onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export to CSV
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Search and filter vehicles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by registration, make, model, or owner..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>
                            <Select value={vehicleType} onValueChange={setVehicleType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Vehicle Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="car">Car</SelectItem>
                                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                    <SelectItem value="truck">Truck</SelectItem>
                                    <SelectItem value="bus">Bus</SelectItem>
                                    <SelectItem value="van">Van</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleFilter}>
                                <Filter className="mr-2 h-4 w-4" />
                                Apply
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Vehicles Table */}
                <Card>
                    <CardHeader>
                    <CardTitle>Registered Vehicles ({vehiclesData.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {vehiclesData.data.length === 0 ? (
                            <div className="text-center py-12">
                                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No vehicles found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {vehiclesData.data.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">
                                                    {vehicle.make} {vehicle.model}
                                                </h3>
                                                <Badge
                                                    variant={
                                                        vehicle.is_active ? 'default' : 'secondary'
                                                    }
                                                >
                                                    {vehicle.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                                <div>
                                                    <span className="font-medium">Reg:</span>{' '}
                                                    {vehicle.registration_number}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Type:</span>{' '}
                                                    {getVehicleTypeLabel(vehicle.vehicle_type)}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Year:</span>{' '}
                                                    {vehicle.year}
                                                </div>
                                                {vehicle.color && (
                                                    <div>
                                                        <span className="font-medium">Color:</span>{' '}
                                                        {vehicle.color}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 text-sm">
                                                <span className="font-medium">Owner:</span>{' '}
                                                {vehicle.user
                                                    ? `${vehicle.user.name} (${vehicle.user.email})`
                                                    : '—'}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination */}
                                {vehiclesData.last_page > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-4">
                                        {Array.from(
                                            { length: vehiclesData.last_page },
                                            (_, i) => i + 1
                                        ).map((page) => (
                                            <Link
                                                key={page}
                                                href={`/admin/vehicles?page=${page}${search ? `&search=${search}` : ''}${vehicleType && vehicleType !== 'all' ? `&vehicle_type=${vehicleType}` : ''}${status && status !== 'all' ? `&status=${status}` : ''}`}
                                            >
                                                <Button
                                                    variant={
                                                        page === vehiclesData.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                >
                                                    {page}
                                                </Button>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
