import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { create, destroy, edit } from '@/routes/vehicles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Dashboard',
        href: dashboard().url,
    },
    {
        title: 'My Vehicles',
        href: '/vehicles',
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
}

interface PageProps {
    vehicles: Vehicle[];
    canAddMore: boolean;
}

export default function VehiclesIndex() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { vehicles, canAddMore, flash } = usePage<PageProps & { flash: { success?: string; error?: string } }>().props;
    const [deletingId, setDeletingId] = useState<number | null>(null);

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

    const handleDelete = (vehicleId: number) => {
        if (confirm('Are you sure you want to remove this vehicle?')) {
            setDeletingId(vehicleId);
            router.delete(destroy(vehicleId).url, {
                onFinish: () => setDeletingId(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Vehicles" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">My Vehicles</h1>
                        <p className="text-muted-foreground">
                            Manage your registered vehicles ({vehicles.length}/3)
                        </p>
                    </div>
                    {canAddMore && (
                        <Link href={create().url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Vehicle
                            </Button>
                        </Link>
                    )}
                </div>

                {flash?.success && (
                    <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800">
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {!canAddMore && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            You have reached the maximum limit of 3 vehicles. Remove a vehicle to add a new one.
                        </AlertDescription>
                    </Alert>
                )}

                {vehicles.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <Car className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Vehicles Registered</h3>
                        <p className="text-muted-foreground mb-4">
                            Add your first vehicle to start using the toll collection system.
                        </p>
                        <Link href={create().url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Your First Vehicle
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {vehicles.map((vehicle) => (
                            <Card key={vehicle.id} className="relative">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Car className="h-5 w-5 text-muted-foreground" />
                                            <CardTitle className="text-lg">
                                                {vehicle.make} {vehicle.model}
                                            </CardTitle>
                                        </div>
                                        <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
                                            {vehicle.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {vehicle.registration_number}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Type:</span>
                                            <span className="font-medium">
                                                {getVehicleTypeLabel(vehicle.vehicle_type)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Year:</span>
                                            <span className="font-medium">{vehicle.year}</span>
                                        </div>
                                        {vehicle.color && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Color:</span>
                                                <span className="font-medium">{vehicle.color}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Link href={edit(vehicle.id).url} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleDelete(vehicle.id)}
                                            disabled={deletingId === vehicle.id}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
