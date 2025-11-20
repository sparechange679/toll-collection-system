import { useState } from 'react';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import OtpVerificationModal from '@/components/otp-verification-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import AuthLayout from '@/layouts/auth-layout';
import { User, Briefcase, ShieldCheck } from 'lucide-react';

export default function Register() {
    const [selectedRole, setSelectedRole] = useState<'staff' | 'driver'>('driver');
    const [showOtpModal, setShowOtpModal] = useState(false);

    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />

            <OtpVerificationModal
                open={showOtpModal}
                onOpenChange={setShowOtpModal}
            />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <input type="hidden" name="role" value={selectedRole} />

                        <div className="grid gap-6">
                            {/* Role Selection */}
                            <div className="grid gap-3">
                                <Label>Select Account Type</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Card
                                        className={`cursor-pointer transition-all hover:border-primary ${
                                            selectedRole === 'driver'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border'
                                        }`}
                                        onClick={() => setSelectedRole('driver')}
                                    >
                                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                            <User className={`h-8 w-8 mb-2 ${
                                                selectedRole === 'driver'
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground'
                                            }`} />
                                            <h3 className="font-semibold">Driver</h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Road user
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card
                                        className={`cursor-pointer transition-all hover:border-primary ${
                                            selectedRole === 'staff'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border'
                                        }`}
                                        onClick={() => setSelectedRole('staff')}
                                    >
                                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                            <Briefcase className={`h-8 w-8 mb-2 ${
                                                selectedRole === 'staff'
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground'
                                            }`} />
                                            <h3 className="font-semibold">Staff</h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Toll operator
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <InputError message={errors.role} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <TextLink href={login()} tabIndex={6}>
                                    Log in
                                </TextLink>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        or
                                    </span>
                                </div>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowOtpModal(true)}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    ADMIN
                                </button>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Requires verification
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
