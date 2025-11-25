<?php

namespace App\Http\Controllers;

use App\Models\DriverDocument;
use App\Services\DocumentVerificationService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct(
        protected DocumentVerificationService $verificationService
    ) {}

    /**
     * Upload and verify a document.
     */
    public function upload(Request $request)
    {
        $validated = $request->validate([
            'document_type' => ['required', 'in:license,national_id'],
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // 5MB max
            'user_data' => ['required', 'array'],
        ]);

        try {
            $file = $request->file('document');
            $fileExtension = $file->getClientOriginalExtension();
            $fileType = $fileExtension === 'pdf' ? 'pdf' : 'image';

            // Store the file
            $filePath = $file->store('documents', 'private');
            $fullPath = Storage::disk('private')->path($filePath);

            // Create document record
            $document = DriverDocument::create([
                'user_id' => $request->user()->id,
                'document_type' => $validated['document_type'],
                'file_path' => $filePath,
                'file_type' => $fileExtension,
                'verification_status' => 'pending',
            ]);

            // Extract text from document
            try {
                $extractedText = $this->verificationService->extractText($fullPath, $fileType);

                // Verify document based on type
                if ($validated['document_type'] === 'license') {
                    $verificationResult = $this->verificationService->verifyLicenseDocument(
                        $extractedText,
                        $validated['user_data']
                    );
                } else {
                    $verificationResult = $this->verificationService->verifyNationalIdDocument(
                        $extractedText,
                        $validated['user_data']
                    );
                }

                // Update document with verification results
                if ($verificationResult['verified']) {
                    $document->update([
                        'verification_status' => 'verified',
                        'extracted_data' => $verificationResult,
                        'verified_at' => now(),
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Document verified successfully',
                        'document' => $document,
                    ]);
                } else {
                    // Determine failure reason
                    $failureReasons = [];

                    if ($validated['document_type'] === 'license') {
                        if (! $verificationResult['license_number_found']) {
                            $failureReasons[] = 'License number not found or does not match';
                        }
                        if (isset($verificationResult['expiry_date_found']) && ! $verificationResult['expiry_date_found']) {
                            $failureReasons[] = 'License expiry date not found or does not match';
                        }
                    } else {
                        if (! $verificationResult['id_number_found']) {
                            $failureReasons[] = 'National ID number not found or does not match';
                        }
                        if (isset($verificationResult['date_of_birth_found']) && ! $verificationResult['date_of_birth_found']) {
                            $failureReasons[] = 'Date of birth not found or does not match';
                        }
                    }

                    $document->update([
                        'verification_status' => 'failed',
                        'extracted_data' => $verificationResult,
                        'failure_reason' => implode('. ', $failureReasons),
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Document verification failed',
                        'reasons' => $failureReasons,
                        'document' => $document,
                    ], 422);
                }
            } catch (Exception $e) {
                $document->update([
                    'verification_status' => 'failed',
                    'failure_reason' => 'Failed to process document: '.$e->getMessage(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to process document',
                    'error' => $e->getMessage(),
                ], 422);
            }
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's documents status.
     */
    public function status(Request $request)
    {
        $documents = DriverDocument::where('user_id', $request->user()->id)
            ->get()
            ->groupBy('document_type');

        $licenseDoc = $documents->get('license')?->first();
        $nationalIdDoc = $documents->get('national_id')?->first();

        return response()->json([
            'license' => $licenseDoc ? [
                'status' => $licenseDoc->verification_status,
                'verified' => $licenseDoc->isVerified(),
                'failure_reason' => $licenseDoc->failure_reason,
            ] : null,
            'national_id' => $nationalIdDoc ? [
                'status' => $nationalIdDoc->verification_status,
                'verified' => $nationalIdDoc->isVerified(),
                'failure_reason' => $nationalIdDoc->failure_reason,
            ] : null,
            'all_verified' => $licenseDoc?->isVerified() && $nationalIdDoc?->isVerified(),
        ]);
    }

    /**
     * Retry verification for a failed document.
     */
    public function retry(Request $request, DriverDocument $document)
    {
        // Ensure document belongs to the user
        if ($document->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $request->validate([
            'user_data' => ['required', 'array'],
        ]);

        try {
            $fullPath = Storage::disk('private')->path($document->file_path);
            $fileType = $document->file_type === 'pdf' ? 'pdf' : 'image';

            // Extract text
            $extractedText = $this->verificationService->extractText($fullPath, $fileType);

            // Verify based on document type
            if ($document->document_type === 'license') {
                $verificationResult = $this->verificationService->verifyLicenseDocument(
                    $extractedText,
                    $request->user_data
                );
            } else {
                $verificationResult = $this->verificationService->verifyNationalIdDocument(
                    $extractedText,
                    $request->user_data
                );
            }

            // Update verification status
            if ($verificationResult['verified']) {
                $document->update([
                    'verification_status' => 'verified',
                    'extracted_data' => $verificationResult,
                    'verified_at' => now(),
                    'failure_reason' => null,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Document verified successfully',
                    'document' => $document,
                ]);
            } else {
                $failureReasons = [];
                if ($document->document_type === 'license') {
                    if (! $verificationResult['license_number_found']) {
                        $failureReasons[] = 'License number not found or does not match';
                    }
                    if (isset($verificationResult['expiry_date_found']) && ! $verificationResult['expiry_date_found']) {
                        $failureReasons[] = 'License expiry date not found or does not match';
                    }
                } else {
                    if (! $verificationResult['id_number_found']) {
                        $failureReasons[] = 'National ID number not found or does not match';
                    }
                    if (isset($verificationResult['date_of_birth_found']) && ! $verificationResult['date_of_birth_found']) {
                        $failureReasons[] = 'Date of birth not found or does not match';
                    }
                }

                $document->update([
                    'verification_status' => 'failed',
                    'extracted_data' => $verificationResult,
                    'failure_reason' => implode('. ', $failureReasons),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Document verification failed',
                    'reasons' => $failureReasons,
                    'document' => $document,
                ], 422);
            }
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
