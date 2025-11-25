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
    base_toll_rate: string;
    overweight_fine_rate: string;
    weight_limit_kg: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    tollGate: TollGate;
}

export function CashPaymentModal({ open, onClose, tollGate }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        toll_gate_id: tollGate.id,
        amount: tollGate.base_toll_rate,
        vehicle_weight_kg: '0',
        vehicle_registration: '',
        driver_name: '',
        driver_contact: '',
        notes: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/staff/transactions/cash-payment', {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const calculateRecommendedAmount = () => {
        const weight = parseFloat(data.vehicle_weight_kg) || 0;
        const weightLimit = parseFloat(tollGate.weight_limit_kg);
        const baseToll = parseFloat(tollGate.base_toll_rate);
        const overweightFine = parseFloat(tollGate.overweight_fine_rate);

        if (weight > weightLimit) {
            return (baseToll + overweightFine).toFixed(2);
        }
        return baseToll;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Cash Payment</DialogTitle>
                    <DialogDescription>
                        Process a cash payment for an unregistered vehicle or RFID issue
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="amount">Amount (₱) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            required
                        />
                        {errors.amount && (
                            <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Recommended: ₱{calculateRecommendedAmount()}
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="vehicle_weight_kg">Vehicle Weight (kg) *</Label>
                        <Input
                            id="vehicle_weight_kg"
                            type="number"
                            step="0.01"
                            value={data.vehicle_weight_kg}
                            onChange={(e) => {
                                setData('vehicle_weight_kg', e.target.value);
                                // Auto-update amount based on weight
                                const weight = parseFloat(e.target.value) || 0;
                                if (weight > parseFloat(tollGate.weight_limit_kg)) {
                                    setData(
                                        'amount',
                                        (
                                            parseFloat(tollGate.base_toll_rate) +
                                            parseFloat(tollGate.overweight_fine_rate)
                                        ).toFixed(2),
                                    );
                                } else {
                                    setData('amount', tollGate.base_toll_rate);
                                }
                            }}
                            required
                        />
                        {parseFloat(data.vehicle_weight_kg) >
                            parseFloat(tollGate.weight_limit_kg) && (
                            <p className="text-sm text-red-600 mt-1">
                                Overweight! Fine of ₱{tollGate.overweight_fine_rate} applies
                            </p>
                        )}
                        {errors.vehicle_weight_kg && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.vehicle_weight_kg}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="vehicle_registration">
                            Vehicle Registration (Optional)
                        </Label>
                        <Input
                            id="vehicle_registration"
                            value={data.vehicle_registration}
                            onChange={(e) => setData('vehicle_registration', e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="driver_name">Driver Name (Optional)</Label>
                        <Input
                            id="driver_name"
                            value={data.driver_name}
                            onChange={(e) => setData('driver_name', e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="driver_contact">Driver Contact (Optional)</Label>
                        <Input
                            id="driver_contact"
                            value={data.driver_contact}
                            onChange={(e) => setData('driver_contact', e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Processing...' : 'Process Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
