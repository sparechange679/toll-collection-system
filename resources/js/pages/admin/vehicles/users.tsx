import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Car, Search, CheckCircle, XCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Users & Vehicles',
        href: '/admin/vehicles/users',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    onboarding_completed: boolean;
    vehicles_count: number;
    vehicles: Array<{
        id: number;
        registration_number: string;
        make: string;
        model: string;
        year: number;
        vehicle_type: string;
        is_active: boolean;
    }>;
    driver_profile?: {
        phone_number: string;
        city: string;
        district: string;
    };
}

interface PageProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        total: number;
    };
    statistics: {
        total_users: number;
        active_users: number;
        total_vehicles: number;
        users_with_vehicles: number;
    };
    filters: {
        search?: string;
    };
}

export default function UsersVehicles() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { users, statistics, filters } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get('/admin/vehicles/users', { search }, { preserveState: true });
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
            <Head title="Users & Vehicles" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Users & Vehicles</h1>
                        <p className="text-muted-foreground">
                            View all registered users and their vehicles
                        </p>
                    </div>
                    <Link href="/admin/vehicles">
                        <Button variant="outline">
                            <Car className="mr-2 h-4 w-4" />
                            View All Vehicles
                        </Button>
                    </Link>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_users}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {statistics.active_users}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_vehicles}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Drivers with Vehicles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.users_with_vehicles}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Users</CardTitle>
                        <CardDescription>Search by name or email</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Users List */}
                <div className="space-y-4">
                    {users.data.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No users found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        users.data.map((user) => (
                            <Card key={user.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle>{user.name}</CardTitle>
                                                {user.onboarding_completed ? (
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                )}
                                            </div>
                                            <CardDescription>
                                                {user.email}
                                                {user.driver_profile && (
                                                    <span className="ml-4">
                                                        {user.driver_profile.phone_number} •{' '}
                                                        {user.driver_profile.city},{' '}
                                                        {user.driver_profile.district}
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline">
                                            {user.vehicles_count} Vehicle
                                            {user.vehicles_count !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {user.vehicles.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No vehicles registered
                                        </p>
                                    ) : (
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                            {user.vehicles.map((vehicle) => (
                                                <div
                                                    key={vehicle.id}
                                                    className="border rounded-lg p-3 space-y-2"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm">
                                                            {vehicle.make} {vehicle.model}
                                                        </span>
                                                        <Badge
                                                            variant={
                                                                vehicle.is_active
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {vehicle.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground space-y-1">
                                                        <div>{vehicle.registration_number}</div>
                                                        <div>
                                                            {getVehicleTypeLabel(
                                                                vehicle.vehicle_type
                                                            )}{' '}
                                                            • {vehicle.year}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}

                    {/* Pagination */}
                    {users.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            {Array.from({ length: users.last_page }, (_, i) => i + 1).map(
                                (page) => (
                                    <Link
                                        key={page}
                                        href={`/admin/vehicles/users?page=${page}${search ? `&search=${search}` : ''}`}
                                    >
                                        <Button
                                            variant={
                                                page === users.current_page ? 'default' : 'outline'
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
            </div>
        </AppLayout>
    );
}
