import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OtpVerificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function OtpVerificationModal({
    open,
    onOpenChange,
}: OtpVerificationModalProps) {
    const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Request OTP when modal opens
    useEffect(() => {
        if (open) {
            requestOtp();
            setOtpCode(['', '', '', '', '', '']);
            setError('');
        }
    }, [open]);

    const requestOtp = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/otp/request');
            if (response.data.success) {
                setGeneratedOtp(response.data.otp_code); // For development only
                setExpiresAt(response.data.expires_at);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otpCode];
        newOtp[index] = value;
        setOtpCode(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        const newOtp = pastedData.split('').map((char) =>
            /^\d$/.test(char) ? char : ''
        );
        setOtpCode([...newOtp, ...Array(6 - newOtp.length).fill('')]);

        // Focus last filled input
        const lastIndex = Math.min(newOtp.length, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleVerify = async () => {
        const code = otpCode.join('');

        if (code.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/otp/verify', {
                otp_code: code,
            });

            if (response.data.success) {
                // Close modal and redirect to admin registration
                onOpenChange(false);
                router.visit('/register/admin');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP code');
            setOtpCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Access Verification</DialogTitle>
                    <DialogDescription>
                        To access the admin panel, please enter the passkey...
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Development: Show generated OTP */}
                    {generatedOtp && (
                        <Alert className="bg-primary/10 text-primary border-primary">
                            <AlertDescription className="text-center font-mono text-lg font-semibold">
                                Dev OTP: {generatedOtp}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* OTP Input */}
                    <div className="flex justify-center gap-2">
                        {otpCode.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) =>
                                    handleOtpChange(index, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="h-14 w-12 text-center text-2xl font-semibold"
                                disabled={loading}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Expires At */}
                    {expiresAt && !error && (
                        <p className="text-xs text-center text-muted-foreground">
                            Code expires at {new Date(expiresAt).toLocaleTimeString()}
                        </p>
                    )}
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        type="button"
                        onClick={handleVerify}
                        disabled={loading || otpCode.join('').length !== 6}
                        className="w-full bg-primary hover:bg-primary/90"
                    >
                        {loading && <Spinner />}
                        Enter admin panel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
