<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOtpVerified
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isVerified = $request->session()->get('admin_otp_verified', false);
        $verifiedAt = $request->session()->get('admin_otp_verified_at');

        // Check if OTP is verified
        if (! $isVerified || ! $verifiedAt) {
            return redirect()->route('register')->with('error', 'You must verify OTP before accessing admin registration.');
        }

        // Check if verification is still valid (within 10 minutes)
        $verifiedTime = \Carbon\Carbon::parse($verifiedAt);
        if (\Carbon\Carbon::now()->diffInMinutes($verifiedTime) > 10) {
            // Verification expired
            $request->session()->forget(['admin_otp_verified', 'admin_otp_verified_at', 'otp_session_id']);

            return redirect()->route('register')->with('error', 'OTP verification expired. Please verify again.');
        }

        return $next($request);
    }
}
