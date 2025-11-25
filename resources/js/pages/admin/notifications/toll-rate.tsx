import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { useState } from 'react';
import { Bell } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Toll Rate Notification',
        href: '/admin/notifications/toll-rate',
    },
];

export default function TollRateNotification() {
    const [formData, setFormData] = useState({
        previous_rate: '',
        new_rate: '',
        effective_date: '',
        reason: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

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

        router.post('/admin/notifications/toll-rate', formData, {
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onSuccess: () => {
                setFormData({
                    previous_rate: '',
                    new_rate: '',
                    effective_date: '',
                    reason: '',
                });
                setProcessing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Send Toll Rate Notification" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="max-w-2xl mx-auto w-full">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Bell className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Send Toll Rate Update Notification</CardTitle>
                                    <CardDescription>
                                        Notify all drivers about updated toll rates
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="previous_rate">Previous Rate (MWK) *</Label>
                                        <Input
                                            id="previous_rate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.previous_rate}
                                            onChange={(e) =>
                                                handleInputChange('previous_rate', e.target.value)
                                            }
                                            placeholder="e.g., 500.00"
                                            required
                                        />
                                        <InputError message={errors.previous_rate} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="new_rate">New Rate (MWK) *</Label>
                                        <Input
                                            id="new_rate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.new_rate}
                                            onChange={(e) =>
                                                handleInputChange('new_rate', e.target.value)
                                            }
                                            placeholder="e.g., 600.00"
                                            required
                                        />
                                        <InputError message={errors.new_rate} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="effective_date">Effective Date *</Label>
                                        <Input
                                            id="effective_date"
                                            type="date"
                                            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                            value={formData.effective_date}
                                            onChange={(e) =>
                                                handleInputChange('effective_date', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError message={errors.effective_date} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="reason">Reason (Optional)</Label>
                                        <Textarea
                                            id="reason"
                                            value={formData.reason}
                                            onChange={(e) =>
                                                handleInputChange('reason', e.target.value)
                                            }
                                            placeholder="Explain the reason for the rate change..."
                                            rows={4}
                                        />
                                        <InputError message={errors.reason} />
                                    </div>
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">Preview Message:</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {formData.previous_rate && formData.new_rate && formData.effective_date ? (
                                            <>
                                                The toll rates will be updated from MWK {formData.previous_rate} to MWK{' '}
                                                {formData.new_rate} effective {formData.effective_date}.
                                                {formData.reason && ` Reason: ${formData.reason}`}
                                            </>
                                        ) : (
                                            'Fill in the form to preview the notification message...'
                                        )}
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit('/admin/notifications')}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Sending...' : 'Send Notification to All Drivers'}
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
