import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { countryCodes, getDefaultCountryCode } from '@/data/country-codes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

interface DriverProfile {
    license_number: string;
    license_expiry_date: string;
    phone_number: string;
    address: string;
    city: string;
    district: string;
    date_of_birth: string;
    id_number: string;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
}

export default function Profile({
    mustVerifyEmail,
    status,
    driverProfile,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    driverProfile?: DriverProfile | null;
}) {
    const { auth } = usePage<SharedData>().props;
    const isDriver = auth.user.role === 'driver';
    const defaultCountryCode = getDefaultCountryCode();

    const [countryCode, setCountryCode] = useState(defaultCountryCode.code);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emergencyCountryCode, setEmergencyCountryCode] = useState(defaultCountryCode.code);
    const [emergencyPhone, setEmergencyPhone] = useState('');

    useEffect(() => {
        if (driverProfile?.phone_number) {
            const phone = driverProfile.phone_number;
            const matchedCode = countryCodes.find(c => phone.startsWith(c.code));
            if (matchedCode) {
                setCountryCode(matchedCode.code);
                setPhoneNumber(phone.replace(matchedCode.code, '').trim());
            } else {
                setPhoneNumber(phone);
            }
        }

        if (driverProfile?.emergency_contact_phone) {
            const phone = driverProfile.emergency_contact_phone;
            const matchedCode = countryCodes.find(c => phone.startsWith(c.code));
            if (matchedCode) {
                setEmergencyCountryCode(matchedCode.code);
                setEmergencyPhone(phone.replace(matchedCode.code, '').trim());
            } else {
                setEmergencyPhone(phone);
            }
        }
    }, [driverProfile]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description={isDriver ? "Update your personal and contact information" : "Update your name and email address"}
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                {isDriver && driverProfile && (
                                    <>
                                        <div className="border-t pt-6 mt-6">
                                            <h3 className="text-lg font-semibold mb-4">Driver Information</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="license_number">
                                                        Driver's License Number *
                                                    </Label>
                                                    <Input
                                                        id="license_number"
                                                        name="license_number"
                                                        defaultValue={driverProfile.license_number}
                                                        placeholder="e.g., DL12345678"
                                                        required
                                                    />
                                                    <InputError message={errors.license_number} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="license_expiry_date">
                                                        License Expiry Date *
                                                    </Label>
                                                    <Input
                                                        id="license_expiry_date"
                                                        name="license_expiry_date"
                                                        type="date"
                                                        defaultValue={driverProfile.license_expiry_date}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        required
                                                    />
                                                    <InputError message={errors.license_expiry_date} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="id_number">National ID Number *</Label>
                                                    <Input
                                                        id="id_number"
                                                        name="id_number"
                                                        defaultValue={driverProfile.id_number}
                                                        placeholder="e.g., ID12345678"
                                                        required
                                                    />
                                                    <InputError message={errors.id_number} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                                                    <Input
                                                        id="date_of_birth"
                                                        name="date_of_birth"
                                                        type="date"
                                                        defaultValue={driverProfile.date_of_birth}
                                                        max={new Date().toISOString().split('T')[0]}
                                                        required
                                                    />
                                                    <InputError message={errors.date_of_birth} />
                                                </div>

                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="phone_number">Phone Number *</Label>
                                                    <div className="flex gap-2">
                                                        <Select
                                                            value={countryCode}
                                                            onValueChange={setCountryCode}
                                                        >
                                                            <SelectTrigger className="w-[140px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {countryCodes.map((country) => (
                                                                    <SelectItem
                                                                        key={country.code}
                                                                        value={country.code}
                                                                    >
                                                                        {country.flag} {country.code}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <input
                                                            type="hidden"
                                                            name="phone_number"
                                                            value={`${countryCode} ${phoneNumber}`}
                                                        />
                                                        <Input
                                                            id="phone_number"
                                                            type="tel"
                                                            className="flex-1"
                                                            value={phoneNumber}
                                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                                            placeholder="123 456 789"
                                                            required
                                                        />
                                                    </div>
                                                    <InputError message={errors.phone_number} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t pt-6 mt-6">
                                            <h3 className="text-lg font-semibold mb-4">Address Information</h3>

                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="address">Physical Address *</Label>
                                                    <Textarea
                                                        id="address"
                                                        name="address"
                                                        defaultValue={driverProfile.address}
                                                        placeholder="House number, street name"
                                                        rows={3}
                                                        required
                                                    />
                                                    <InputError message={errors.address} />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="city">City *</Label>
                                                        <Input
                                                            id="city"
                                                            name="city"
                                                            defaultValue={driverProfile.city}
                                                            placeholder="e.g., Lilongwe"
                                                            required
                                                        />
                                                        <InputError message={errors.city} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="district">District *</Label>
                                                        <Input
                                                            id="district"
                                                            name="district"
                                                            defaultValue={driverProfile.district}
                                                            placeholder="e.g., Lilongwe"
                                                            required
                                                        />
                                                        <InputError message={errors.district} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t pt-6 mt-6">
                                            <h3 className="text-lg font-semibold mb-4">Emergency Contact (Optional)</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="emergency_contact_name">
                                                        Contact Name
                                                    </Label>
                                                    <Input
                                                        id="emergency_contact_name"
                                                        name="emergency_contact_name"
                                                        defaultValue={driverProfile.emergency_contact_name || ''}
                                                        placeholder="Full name"
                                                    />
                                                    <InputError message={errors.emergency_contact_name} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="emergency_contact_phone">
                                                        Contact Phone
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Select
                                                            value={emergencyCountryCode}
                                                            onValueChange={setEmergencyCountryCode}
                                                        >
                                                            <SelectTrigger className="w-[140px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {countryCodes.map((country) => (
                                                                    <SelectItem
                                                                        key={country.code}
                                                                        value={country.code}
                                                                    >
                                                                        {country.flag} {country.code}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <input
                                                            type="hidden"
                                                            name="emergency_contact_phone"
                                                            value={emergencyPhone ? `${emergencyCountryCode} ${emergencyPhone}` : ''}
                                                        />
                                                        <Input
                                                            id="emergency_contact_phone"
                                                            type="tel"
                                                            className="flex-1"
                                                            value={emergencyPhone}
                                                            onChange={(e) => setEmergencyPhone(e.target.value)}
                                                            placeholder="123 456 789"
                                                        />
                                                    </div>
                                                    <InputError message={errors.emergency_contact_phone} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
