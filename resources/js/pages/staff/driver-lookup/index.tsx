import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Vehicle {
    id: number;
    registration_number: string;
    make: string;
    model: string;
    year: number;
    vehicle_type: string;
    color: string;
    rfid_tag: string;
    is_active: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
    balance: string;
}

interface DriverProfile {
    license_number: string;
    phone_number: string;
    address: string;
    city: string;
}

interface TollPassage {
    id: number;
    status: string;
    total_amount: string;
    scanned_at: string;
    toll_gate: { name: string };
}

interface SearchResult {
    vehicle: Vehicle;
    user: User;
    driver_profile: DriverProfile;
    balance: string;
    recent_passages: TollPassage[];
}

interface Props {
    searchResult?: SearchResult;
}

export default function DriverLookup({ searchResult }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        rfid_tag: '',
        registration_number: '',
    });

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        post('/staff/driver-lookup/search');
    };

    const getStatusBadgeVariant = (status: string) => {
        if (status === 'success') return 'default';
        if (status === 'cash_payment') return 'secondary';
        if (status === 'manual_override') return 'outline';
        return 'destructive';
    };

    return (
        <AppLayout
            breadcrumbs={[
                { label: 'Staff Dashboard', url: '/staff/dashboard' },
                { label: 'Driver Lookup', url: '/staff/driver-lookup' },
            ]}
        >
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Driver Lookup</h1>
                    <p className="text-muted-foreground">
                        Search for drivers by RFID tag or vehicle registration
                    </p>
                </div>

                {/* Search Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search</CardTitle>
                        <CardDescription>
                            Enter either RFID tag or registration number
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="rfid_tag">RFID Tag</Label>
                                    <Input
                                        id="rfid_tag"
                                        value={data.rfid_tag}
                                        onChange={(e) =>
                                            setData('rfid_tag', e.target.value)
                                        }
                                        placeholder="Enter RFID tag"
                                    />
                                    {errors.rfid_tag && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.rfid_tag}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="registration_number">
                                        Registration Number
                                    </Label>
                                    <Input
                                        id="registration_number"
                                        value={data.registration_number}
                                        onChange={(e) =>
                                            setData('registration_number', e.target.value)
                                        }
                                        placeholder="e.g., ABC-1234"
                                    />
                                    {errors.registration_number && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.registration_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {errors.error && (
                                <p className="text-sm text-red-600">{errors.error}</p>
                            )}
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Searching...' : 'Search'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Search Results */}
                {searchResult && (
                    <div className="space-y-6">
                        {/* Driver Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Driver Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Name
                                            </p>
                                            <p className="font-medium">
                                                {searchResult.user.name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Email
                                            </p>
                                            <p className="font-medium">
                                                {searchResult.user.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Phone
                                            </p>
                                            <p className="font-medium">
                                                {searchResult.driver_profile.phone_number}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                License Number
                                            </p>
                                            <p className="font-medium">
                                                {searchResult.driver_profile
                                                    .license_number}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Address
                                            </p>
                                            <p className="font-medium">
                                                {searchResult.driver_profile.address}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {searchResult.driver_profile.city}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Wallet Balance
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₱{searchResult.user.balance}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vehicle Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Registration
                                            </p>
                                            <p className="font-medium text-lg">
                                                {
                                                    searchResult.vehicle
                                                        .registration_number
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Vehicle
                                            </p>
                                            <p className="font-medium">
                                                {searchResult.vehicle.make}{' '}
                                                {searchResult.vehicle.model} (
                                                {searchResult.vehicle.year})
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Type
                                            </p>
                                            <p className="font-medium">
                                                {searchResult.vehicle.vehicle_type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                RFID Tag
                                            </p>
                                            <p className="font-medium font-mono">
                                                {searchResult.vehicle.rfid_tag}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Color
                                            </p>
                                            <p className="font-medium">
                                                {searchResult.vehicle.color}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Status
                                            </p>
                                            <Badge
                                                variant={
                                                    searchResult.vehicle.is_active
                                                        ? 'default'
                                                        : 'destructive'
                                                }
                                            >
                                                {searchResult.vehicle.is_active
                                                    ? 'ACTIVE'
                                                    : 'INACTIVE'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Passages */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Passages</CardTitle>
                                <CardDescription>
                                    Last 10 toll gate passages
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {searchResult.recent_passages.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No recent passages
                                        </p>
                                    ) : (
                                        searchResult.recent_passages.map((passage) => (
                                            <div
                                                key={passage.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div>
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
                                                        <span className="text-sm">
                                                            {passage.toll_gate.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(
                                                            passage.scanned_at,
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                                <p className="font-bold">
                                                    ₱{passage.total_amount}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
