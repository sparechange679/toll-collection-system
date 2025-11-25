<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser as PdfParser;

class DocumentVerificationService
{
    /**
     * Extract text from a document (PDF or image).
     *
     * @throws Exception
     */
    public function extractText(string $filePath, string $fileType): string
    {
        if ($fileType === 'pdf') {
            return $this->extractTextFromPdf($filePath);
        }

        return $this->extractTextFromImage($filePath);
    }

    /**
     * Extract text from PDF using smalot/pdfparser.
     *
     * @throws Exception
     */
    protected function extractTextFromPdf(string $filePath): string
    {
        try {
            $parser = new PdfParser;
            $pdf = $parser->parseFile($filePath);
            $text = $pdf->getText();

            return $this->cleanText($text);
        } catch (Exception $e) {
            Log::error('PDF text extraction failed', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to extract text from PDF: '.$e->getMessage());
        }
    }

    /**
     * Extract text from image using Tesseract OCR.
     *
     * @throws Exception
     */
    protected function extractTextFromImage(string $filePath): string
    {
        try {
            // Check if Tesseract is installed
            $tesseractPath = $this->findTesseractPath();

            if (! $tesseractPath) {
                throw new Exception('Tesseract OCR is not installed. Please install it to process image documents.');
            }

            // Run Tesseract OCR
            $outputFile = storage_path('app/temp/'.uniqid('ocr_', true));
            $command = sprintf(
                '%s %s %s',
                escapeshellarg($tesseractPath),
                escapeshellarg($filePath),
                escapeshellarg($outputFile)
            );

            exec($command.' 2>&1', $output, $returnCode);

            if ($returnCode !== 0) {
                throw new Exception('Tesseract OCR failed: '.implode("\n", $output));
            }

            // Read the output file
            $textFile = $outputFile.'.txt';
            if (! file_exists($textFile)) {
                throw new Exception('OCR output file not found');
            }

            $text = file_get_contents($textFile);
            unlink($textFile); // Clean up

            return $this->cleanText($text);
        } catch (Exception $e) {
            Log::error('Image OCR failed', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Find Tesseract executable path.
     */
    protected function findTesseractPath(): ?string
    {
        // Common Tesseract paths
        $possiblePaths = [
            'tesseract',                                    // In PATH
            '/usr/bin/tesseract',                           // Linux
            '/usr/local/bin/tesseract',                     // macOS/Linux
            'C:\\Program Files\\Tesseract-OCR\\tesseract.exe', // Windows
            'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe', // Windows 32-bit
        ];

        foreach ($possiblePaths as $path) {
            if (@is_executable($path) || @exec("where $path 2>NUL") || @exec("which $path 2>/dev/null")) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Clean extracted text.
     */
    protected function cleanText(string $text): string
    {
        // Remove extra whitespace and normalize
        $text = preg_replace('/\s+/', ' ', $text);

        return trim($text);
    }

    /**
     * Verify license document.
     */
    public function verifyLicenseDocument(string $extractedText, array $userData): array
    {
        $licenseNumber = $userData['license_number'] ?? '';
        $expiryDate = $userData['license_expiry_date'] ?? '';

        // Normalize for comparison
        $normalizedText = strtoupper(str_replace([' ', '-', '_'], '', $extractedText));
        $normalizedLicense = strtoupper(str_replace([' ', '-', '_'], '', $licenseNumber));

        // Check if license number exists in the text
        $licenseFound = str_contains($normalizedText, $normalizedLicense);

        // Check expiry date (try multiple formats)
        $expiryFound = $this->isFound($expiryDate, $extractedText);

        return [
            'verified' => $licenseFound && ($expiryFound || ! $expiryDate),
            'license_number_found' => $licenseFound,
            'expiry_date_found' => $expiryFound,
            'extracted_license' => $this->extractLicenseNumber($extractedText),
            'extracted_dates' => $this->extractDates($extractedText),
        ];
    }

    /**
     * Verify national ID document.
     */
    public function verifyNationalIdDocument(string $extractedText, array $userData): array
    {
        $idNumber = $userData['id_number'] ?? '';
        $dateOfBirth = $userData['date_of_birth'] ?? '';

        // Normalize for comparison
        $normalizedId = strtoupper(str_replace([' ', '-', '_'], '', $idNumber));

        // Check if ID number exists in the text
        $idFound = str_contains(strtoupper(str_replace([' ', '-', '_'], '', $extractedText)), $normalizedId);

        // Check date of birth (try multiple formats)
        $dobFound = $this->isFound($dateOfBirth, $extractedText);

        return [
            'verified' => $idFound && ($dobFound || ! $dateOfBirth),
            'id_number_found' => $idFound,
            'date_of_birth_found' => $dobFound,
            'extracted_id' => $this->extractIdNumber($extractedText),
            'extracted_dates' => $this->extractDates($extractedText),
        ];
    }

    /**
     * Extract potential license numbers from text.
     */
    protected function extractLicenseNumber(string $text): ?string
    {
        // Try to match common license number patterns
        // Format: DL followed by numbers, or just alphanumeric
        if (preg_match('/\b(DL|DLNO|LICENSE|LIC)[:\s]*([A-Z0-9]{5,15})\b/i', $text, $matches)) {
            return $matches[2];
        }

        // Try to match any alphanumeric sequence of 6-15 characters
        if (preg_match('/\b([A-Z]{2}\d{6,13})\b/i', $text, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Extract potential ID numbers from text.
     */
    protected function extractIdNumber(string $text): ?string
    {
        // Try to match common ID number patterns
        if (preg_match('/\b(ID|IDNO|NATIONAL)[:\s]*([A-Z0-9]{5,15})\b/i', $text, $matches)) {
            return $matches[2];
        }

        // Try to match any alphanumeric sequence
        if (preg_match('/\b([A-Z]{2}\d{6,13})\b/i', $text, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Extract all dates from text.
     */
    protected function extractDates(string $text): array
    {
        $dates = [];

        // Match various date formats
        $patterns = [
            '/\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/',     // YYYY-MM-DD or YYYY/MM/DD
            '/\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/',     // DD-MM-YYYY or DD/MM/YYYY
            '/\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i', // D Month YYYY
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                $dates = array_merge($dates, $matches[1]);
            }
        }

        return array_unique($dates);
    }

    public function isFound(mixed $dateOfBirth, string $extractedText): bool
    {
        $dobFound = false;
        if ($dateOfBirth) {
            $dobFormats = [
                date('Y-m-d', strtotime($dateOfBirth)),
                date('d/m/Y', strtotime($dateOfBirth)),
                date('m/d/Y', strtotime($dateOfBirth)),
                date('d-m-Y', strtotime($dateOfBirth)),
                date('Y', strtotime($dateOfBirth)), // Just the year
            ];

            foreach ($dobFormats as $format) {
                if (str_contains($extractedText, $format)) {
                    $dobFound = true;
                    break;
                }
            }
        }

        return $dobFound;
    }
}
