import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { index as vehiclesIndex, store } from '@/routes/vehicles';
import { useState, useEffect } from 'react';
import { getVehicleTypeOptions, getMakesByType, getModelsByMake } from '@/data/vehicle-data';
import { Car } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Dashboard',
        href: dashboard().url,
    },
    {
        title: 'My Vehicles',
        href: vehiclesIndex().url,
    },
    {
        title: 'Add Vehicle',
        href: '/vehicles/create',
    },
];

export default function CreateVehicle() {
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: '',
        vehicle_type: 'car',
        color: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const [availableMakes, setAvailableMakes] = useState<string[]>([]);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        const makes = getMakesByType(formData.vehicle_type);
        setAvailableMakes(makes);
        if (formData.make && !makes.includes(formData.make)) {
            setFormData((prev) => ({ ...prev, make: '', model: '' }));
            setAvailableModels([]);
        }
    }, [formData.vehicle_type]);

    useEffect(() => {
        if (formData.make) {
            const models = getModelsByMake(formData.vehicle_type, formData.make);
            setAvailableModels(models);
            if (formData.model && !models.includes(formData.model)) {
                setFormData((prev) => ({ ...prev, model: '' }));
            }
        } else {
            setAvailableModels([]);
        }
    }, [formData.make, formData.vehicle_type]);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(store().url, formData, {
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Vehicle" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Car className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Add New Vehicle</CardTitle>
                                    <CardDescription>
                                        Register a new vehicle to your account
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                                        <Select
                                            value={formData.vehicle_type}
                                            onValueChange={(value) =>
                                                handleInputChange('vehicle_type', value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select vehicle type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getVehicleTypeOptions().map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.vehicle_type} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="make">Vehicle Make *</Label>
                                        <Select
                                            value={formData.make}
                                            onValueChange={(value) =>
                                                handleInputChange('make', value)
                                            }
                                            disabled={!formData.vehicle_type || availableMakes.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select make" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableMakes.map((make) => (
                                                    <SelectItem key={make} value={make}>
                                                        {make}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.make} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="model">Vehicle Model *</Label>
                                        <Select
                                            value={formData.model}
                                            onValueChange={(value) =>
                                                handleInputChange('model', value)
                                            }
                                            disabled={!formData.make || availableModels.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableModels.map((model) => (
                                                    <SelectItem key={model} value={model}>
                                                        {model}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.model} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="year">Year *</Label>
                                        <Input
                                            id="year"
                                            type="number"
                                            min="1900"
                                            max={new Date().getFullYear() + 1}
                                            value={formData.year}
                                            onChange={(e) =>
                                                handleInputChange('year', e.target.value)
                                            }
                                            placeholder="e.g., 2020"
                                        />
                                        <InputError message={errors.year} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="color">Color (Optional)</Label>
                                        <Input
                                            id="color"
                                            value={formData.color}
                                            onChange={(e) =>
                                                handleInputChange('color', e.target.value)
                                            }
                                            placeholder="e.g., White"
                                        />
                                        <InputError message={errors.color} />
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(vehiclesIndex().url)}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Adding...' : 'Add Vehicle'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
