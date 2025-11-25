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

export function ManualOverrideModal({ open, onClose, tollGate }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        toll_gate_id: tollGate.id,
        reason: '',
        rfid_tag: '',
        vehicle_weight_kg: '0',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/staff/transactions/manual-override', {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manual Override</DialogTitle>
                    <DialogDescription>
                        Manually open the gate for emergency vehicles, VIPs, or system errors
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="reason">Reason *</Label>
                        <Textarea
                            id="reason"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="e.g., Emergency vehicle, System error, VIP, etc."
                            rows={3}
                            required
                        />
                        {errors.reason && (
                            <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="rfid_tag">RFID Tag (Optional)</Label>
                        <Input
                            id="rfid_tag"
                            value={data.rfid_tag}
                            onChange={(e) => setData('rfid_tag', e.target.value)}
                            placeholder="If available"
                        />
                        {errors.rfid_tag && (
                            <p className="text-sm text-red-600 mt-1">{errors.rfid_tag}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="vehicle_weight_kg">
                            Vehicle Weight (kg) (Optional)
                        </Label>
                        <Input
                            id="vehicle_weight_kg"
                            type="number"
                            step="0.01"
                            value={data.vehicle_weight_kg}
                            onChange={(e) => setData('vehicle_weight_kg', e.target.value)}
                        />
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Warning:</strong> Manual overrides are logged and will be
                            reviewed by management. Only use for legitimate reasons.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            {processing ? 'Processing...' : 'Override & Open Gate'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
