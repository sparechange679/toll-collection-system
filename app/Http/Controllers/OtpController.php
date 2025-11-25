<?php

namespace App\Http\Controllers;

use App\Models\OtpVerification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OtpController extends Controller
{
    /**
     * Request OTP for admin registration.
     */
    public function requestOtp(Request $request)
    {
        // Generate 6-digit OTP
        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Generate unique session ID
        $sessionId = Str::uuid()->toString();

        // Delete any existing unverified OTPs for this session (cleanup)
        OtpVerification::where('created_at', '<', Carbon::now()->subMinutes(10))->delete();

        // Create OTP record
        $otp = OtpVerification::create([
            'session_id' => $sessionId,
            'otp_code' => $otpCode,
            'purpose' => 'admin_registration',
            'expires_at' => Carbon::now()->addMinutes(5),
        ]);

        // Store session ID in session
        $request->session()->put('otp_session_id', $sessionId);

        // In production, you would send this via email/SMS
        // For development, we'll return it in the response
        return response()->json([
            'success' => true,
            'session_id' => $sessionId,
            'otp_code' => $otpCode, // Remove this in production!
            'expires_at' => $otp->expires_at->toDateTimeString(),
            'message' => 'OTP generated successfully. Please enter the code to continue.',
        ]);
    }

    /**
     * Verify OTP code.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'otp_code' => 'required|string|size:6',
        ]);

        $sessionId = $request->session()->get('otp_session_id');

        if (! $sessionId) {
            return response()->json([
                'success' => false,
                'message' => 'No OTP session found. Please request a new OTP.',
            ], 400);
        }

        $otp = OtpVerification::where('session_id', $sessionId)
            ->where('purpose', 'admin_registration')
            ->first();

        if (! $otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP session.',
            ], 400);
        }

        if ($otp->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired. Please request a new one.',
            ], 400);
        }

        if ($otp->is_verified) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has already been used.',
            ], 400);
        }

        if (! $otp->isValid($request->otp_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP code. Please try again.',
            ], 400);
        }

        // Mark OTP as verified
        $otp->markAsVerified();

        // Store verification status in session
        $request->session()->put('admin_otp_verified', true);
        $request->session()->put('admin_otp_verified_at', Carbon::now()->toDateTimeString());

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully. You can now proceed to admin registration.',
        ]);
    }

    /**
     * Check if OTP is verified for current session.
     */
    public function checkVerification(Request $request)
    {
        $isVerified = $request->session()->get('admin_otp_verified', false);
        $verifiedAt = $request->session()->get('admin_otp_verified_at');

        // Check if verification is still valid (within 10 minutes)
        if ($isVerified && $verifiedAt) {
            $verifiedTime = Carbon::parse($verifiedAt);
            if (Carbon::now()->diffInMinutes($verifiedTime) > 10) {
                // Verification expired
                $request->session()->forget(['admin_otp_verified', 'admin_otp_verified_at', 'otp_session_id']);
                $isVerified = false;
            }
        }

        return response()->json([
            'verified' => $isVerified,
            'verified_at' => $verifiedAt,
        ]);
    }
}
