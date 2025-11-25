import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface TollGate {
    id: number;
    name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    tollGate: TollGate;
}

export function IncidentReportModal({ open, onClose, tollGate }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        toll_gate_id: tollGate.id,
        incident_type: '',
        severity: '',
        title: '',
        description: '',
        action_taken: '',
        occurred_at: new Date().toISOString().slice(0, 16),
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/staff/incidents', {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Report Incident</DialogTitle>
                    <DialogDescription>
                        Report hardware failures, accidents, or other incidents at the toll gate
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="incident_type">Incident Type *</Label>
                            <Select
                                value={data.incident_type}
                                onValueChange={(value) => setData('incident_type', value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hardware_failure">
                                        Hardware Failure
                                    </SelectItem>
                                    <SelectItem value="vehicle_breakdown">
                                        Vehicle Breakdown
                                    </SelectItem>
                                    <SelectItem value="accident">Accident</SelectItem>
                                    <SelectItem value="vandalism">Vandalism</SelectItem>
                                    <SelectItem value="power_outage">Power Outage</SelectItem>
                                    <SelectItem value="suspicious_activity">
                                        Suspicious Activity
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.incident_type && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.incident_type}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="severity">Severity *</Label>
                            <Select
                                value={data.severity}
                                onValueChange={(value) => setData('severity', value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.severity && (
                                <p className="text-sm text-red-600 mt-1">{errors.severity}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Brief summary of the incident"
                            required
                        />
                        {errors.title && (
                            <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Detailed description of what happened"
                            rows={4}
                            required
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="action_taken">Action Taken (Optional)</Label>
                        <Textarea
                            id="action_taken"
                            value={data.action_taken}
                            onChange={(e) => setData('action_taken', e.target.value)}
                            placeholder="What steps have you taken to address this?"
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label htmlFor="occurred_at">Occurred At *</Label>
                        <Input
                            id="occurred_at"
                            type="datetime-local"
                            value={data.occurred_at}
                            onChange={(e) => setData('occurred_at', e.target.value)}
                            required
                        />
                    </div>

                    {data.severity === 'critical' && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                <strong>Critical Incident:</strong> Management will be notified
                                immediately. Consider contacting your supervisor directly if urgent
                                action is required.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            {processing ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
