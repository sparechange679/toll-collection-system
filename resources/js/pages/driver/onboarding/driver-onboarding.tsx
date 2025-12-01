import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { CheckCircle2, User, FileText, Car, ChevronLeft, ChevronRight, Upload, X, AlertCircle, Weight } from 'lucide-react';
import {
    getVehicleTypeOptions,
    getMakesByType,
    getModelsByMake,
} from '@/data/vehicle-data';
import { getVehicleWeightLimit, formatWeight } from '@/lib/vehicle-data';
import { countryCodes, getDefaultCountryCode } from '@/data/country-codes';

interface FormData {
    // Personal Details
    license_number: string;
    license_expiry_date: string;
    country_code: string;
    phone_number: string;
    emergency_country_code: string;
    emergency_contact_phone: string;
    address: string;
    city: string;
    district: string;
    date_of_birth: string;
    id_number: string;
    emergency_contact_name: string;

    // Vehicle Details (registration_number removed - auto-generated)
    make: string;
    model: string;
    year: string;
    vehicle_type: string;
    color: string;
    weight: number;
}

interface DocumentStatus {
    status: 'pending' | 'verified' | 'failed' | null;
    verified: boolean;
    failure_reason?: string;
}

interface DocumentsStatus {
    license: DocumentStatus | null;
    national_id: DocumentStatus | null;
    all_verified: boolean;
}

export default function DriverOnboarding() {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const defaultCountryCode = getDefaultCountryCode();

    // Document upload state
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
    const [uploadingLicense, setUploadingLicense] = useState(false);
    const [uploadingNationalId, setUploadingNationalId] = useState(false);
    const [documentsStatus, setDocumentsStatus] = useState<DocumentsStatus>({
        license: null,
        national_id: null,
        all_verified: false,
    });

    const [formData, setFormData] = useState<FormData>({
        license_number: '',
        license_expiry_date: '',
        country_code: defaultCountryCode.code,
        phone_number: '',
        emergency_country_code: defaultCountryCode.code,
        emergency_contact_phone: '',
        address: '',
        city: '',
        district: '',
        date_of_birth: '',
        id_number: '',
        emergency_contact_name: '',
        make: '',
        model: '',
        year: '',
        vehicle_type: 'car',
        color: '',
        weight: getVehicleWeightLimit('car'),
    });

    // State for cascading vehicle dropdowns
    const [availableMakes, setAvailableMakes] = useState<string[]>([]);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    // Update available makes when vehicle type changes
    useEffect(() => {
        const makes = getMakesByType(formData.vehicle_type);
        setAvailableMakes(makes);
        // Auto-fill weight capacity based on vehicle type
        const weightLimit = getVehicleWeightLimit(formData.vehicle_type);
        if (formData.make && !makes.includes(formData.make)) {
            setFormData((prev) => ({ ...prev, make: '', model: '', weight: weightLimit }));
            setAvailableModels([]);
        } else {
            setFormData((prev) => ({ ...prev, weight: weightLimit }));
        }
    }, [formData.vehicle_type]);

    // Update available models when make changes
    useEffect(() => {
        if (formData.make) {
            const models = getModelsByMake(formData.vehicle_type, formData.make);
            setAvailableModels(models);
            if (formData.model && !models.includes(formData.model)) {
                setFormData((prev) => ({ ...prev, model: '' }));
            }
        } else {
            setAvailableModels([]);
        }
    }, [formData.make, formData.vehicle_type]);

    // Check document status on mount and when entering step 2
    useEffect(() => {
        if (currentStep === 2) {
            checkDocumentStatus();
        }
    }, [currentStep]);

    const totalSteps = 3;
    const progress = (currentStep / totalSteps) * 100;

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const checkDocumentStatus = async () => {
        try {
            const response = await axios.get('/documents/status');
            setDocumentsStatus(response.data);
        } catch (error) {
            console.error('Failed to check document status:', error);
        }
    };

    const uploadDocument = async (file: File, documentType: 'license' | 'national_id') => {
        const setUploading = documentType === 'license' ? setUploadingLicense : setUploadingNationalId;
        setUploading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('document', file);
            formDataToSend.append('document_type', documentType);
            formDataToSend.append('user_data[license_number]', formData.license_number);
            formDataToSend.append('user_data[license_expiry_date]', formData.license_expiry_date);
            formDataToSend.append('user_data[id_number]', formData.id_number);
            formDataToSend.append('user_data[date_of_birth]', formData.date_of_birth);

            await axios.post('/documents/upload', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Refresh document status
            await checkDocumentStatus();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to upload document';
            setErrors((prev) => ({ ...prev, [documentType]: errorMessage }));
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, documentType: 'license' | 'national_id') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setErrors((prev) => ({
                ...prev,
                [documentType]: 'Please upload a PDF or image file (JPG, PNG)',
            }));
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({
                ...prev,
                [documentType]: 'File size must be less than 5MB',
            }));
            return;
        }

        if (documentType === 'license') {
            setLicenseFile(file);
        } else {
            setNationalIdFile(file);
        }

        // Auto-upload
        await uploadDocument(file, documentType);
    };

    const validateStep1 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.license_number.trim()) {
            newErrors.license_number = 'License number is required';
        }
        if (!formData.license_expiry_date) {
            newErrors.license_expiry_date = 'License expiry date is required';
        }
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = 'Phone number is required';
        }
        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }
        if (!formData.district.trim()) {
            newErrors.district = 'District is required';
        }
        if (!formData.date_of_birth) {
            newErrors.date_of_birth = 'Date of birth is required';
        }
        if (!formData.id_number.trim()) {
            newErrors.id_number = 'ID number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        if (!documentsStatus.all_verified) {
            setErrors({
                documents: 'Both license and national ID documents must be verified before proceeding',
            });
            return false;
        }
        return true;
    };

    const validateStep3 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.make.trim()) {
            newErrors.make = 'Vehicle make is required';
        }
        if (!formData.model.trim()) {
            newErrors.model = 'Vehicle model is required';
        }
        if (!formData.year.trim()) {
            newErrors.year = 'Year is required';
        }
        if (!formData.vehicle_type) {
            newErrors.vehicle_type = 'Vehicle type is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        setCurrentStep(Math.max(1, currentStep - 1));
    };

    const handleSubmit = async () => {
        if (!validateStep3()) return;

        setLoading(true);
        setErrors({});

        try {
            await axios.post('/onboarding/complete', formData);
            router.visit('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({
                    submit: err.response?.data?.message || 'An error occurred. Please try again.',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Complete Your Profile" />

            <div className="container max-w-4xl mx-auto py-8 px-4">
                {/* Progress Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold">Complete Your Profile</h1>
                        <span className="text-sm text-muted-foreground">
                            Step {currentStep} of {totalSteps}
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step 1: Personal Details */}
                {currentStep === 1 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Personal Details</CardTitle>
                                    <CardDescription>
                                        Please provide your personal and contact information
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="license_number">
                                        Driver's License Number *
                                    </Label>
                                    <Input
                                        id="license_number"
                                        value={formData.license_number}
                                        onChange={(e) =>
                                            handleInputChange('license_number', e.target.value)
                                        }
                                        placeholder="e.g., DL12345678"
                                    />
                                    <InputError message={errors.license_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="license_expiry_date">
                                        License Expiry Date *
                                    </Label>
                                    <Input
                                        id="license_expiry_date"
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.license_expiry_date}
                                        onChange={(e) =>
                                            handleInputChange('license_expiry_date', e.target.value)
                                        }
                                    />
                                    <InputError message={errors.license_expiry_date} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="id_number">National ID Number *</Label>
                                    <Input
                                        id="id_number"
                                        value={formData.id_number}
                                        onChange={(e) =>
                                            handleInputChange('id_number', e.target.value)
                                        }
                                        placeholder="e.g., ID12345678"
                                    />
                                    <InputError message={errors.id_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        max={new Date().toISOString().split('T')[0]}
                                        value={formData.date_of_birth}
                                        onChange={(e) =>
                                            handleInputChange('date_of_birth', e.target.value)
                                        }
                                    />
                                    <InputError message={errors.date_of_birth} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Phone Number *</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={formData.country_code}
                                            onValueChange={(value) =>
                                                handleInputChange('country_code', value)
                                            }
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {countryCodes.map((country) => (
                                                    <SelectItem
                                                        key={country.code}
                                                        value={country.code}
                                                    >
                                                        {country.flag} {country.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            id="phone_number"
                                            type="tel"
                                            className="flex-1"
                                            value={formData.phone_number}
                                            onChange={(e) =>
                                                handleInputChange('phone_number', e.target.value)
                                            }
                                            placeholder="123 456 789"
                                        />
                                    </div>
                                    <InputError message={errors.phone_number} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Physical Address *</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) =>
                                        handleInputChange('address', e.target.value)
                                    }
                                    placeholder="House number, street name"
                                    rows={3}
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) =>
                                            handleInputChange('city', e.target.value)
                                        }
                                        placeholder="e.g., Lilongwe"
                                    />
                                    <InputError message={errors.city} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="district">District *</Label>
                                    <Input
                                        id="district"
                                        value={formData.district}
                                        onChange={(e) =>
                                            handleInputChange('district', e.target.value)
                                        }
                                        placeholder="e.g., Lilongwe"
                                    />
                                    <InputError message={errors.district} />
                                </div>
                            </div>

                            <div className="border-t pt-6 mt-6">
                                <h3 className="font-semibold mb-4">Emergency Contact (Optional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_name">
                                            Contact Name
                                        </Label>
                                        <Input
                                            id="emergency_contact_name"
                                            value={formData.emergency_contact_name}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'emergency_contact_name',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Full name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_phone">
                                            Contact Phone
                                        </Label>
                                        <div className="flex gap-2">
                                            <Select
                                                value={formData.emergency_country_code}
                                                onValueChange={(value) =>
                                                    handleInputChange('emergency_country_code', value)
                                                }
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {countryCodes.map((country) => (
                                                        <SelectItem
                                                            key={country.code}
                                                            value={country.code}
                                                        >
                                                            {country.flag} {country.code}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                id="emergency_contact_phone"
                                                type="tel"
                                                className="flex-1"
                                                value={formData.emergency_contact_phone}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'emergency_contact_phone',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="123 456 789"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleNext} className="min-w-[120px]">
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Document Verification */}
                {currentStep === 2 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Document Verification</CardTitle>
                                    <CardDescription>
                                        Upload your license and national ID for automatic verification
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Documents will be automatically verified. Please ensure the text is clear and readable.
                                    Supported formats: PDF, JPG, PNG (max 5MB)
                                </AlertDescription>
                            </Alert>

                            {/* Driver's License Upload */}
                            <div className="space-y-3">
                                <Label>Driver's License *</Label>
                                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                                    documentsStatus.license?.verified ? 'border-green-500 bg-green-50 dark:bg-green-950' :
                                    documentsStatus.license?.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                                    'border-gray-300'
                                }`}>
                                    {!licenseFile && !documentsStatus.license ? (
                                        <div>
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="mt-4">
                                                <label htmlFor="license-upload" className="cursor-pointer">
                                                    <span className="text-primary hover:underline">Upload license document</span>
                                                    <input
                                                        id="license-upload"
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileSelect(e, 'license')}
                                                        disabled={uploadingLicense}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : uploadingLicense ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Spinner />
                                            <p className="text-sm">Uploading and verifying...</p>
                                        </div>
                                    ) : documentsStatus.license?.verified ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="font-medium">License Verified</span>
                                        </div>
                                    ) : documentsStatus.license?.status === 'failed' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-center gap-2 text-red-600">
                                                <X className="h-5 w-5" />
                                                <span className="font-medium">Verification Failed</span>
                                            </div>
                                            <p className="text-sm text-red-600">{documentsStatus.license.failure_reason}</p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setLicenseFile(null);
                                                    setDocumentsStatus(prev => ({ ...prev, license: null }));
                                                }}
                                            >
                                                Upload Again
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Spinner />
                                            <span className="text-sm">Verifying...</span>
                                        </div>
                                    )}
                                </div>
                                <InputError message={errors.license} />
                            </div>

                            {/* National ID Upload */}
                            <div className="space-y-3">
                                <Label>National ID *</Label>
                                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                                    documentsStatus.national_id?.verified ? 'border-green-500 bg-green-50 dark:bg-green-950' :
                                    documentsStatus.national_id?.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                                    'border-gray-300'
                                }`}>
                                    {!nationalIdFile && !documentsStatus.national_id ? (
                                        <div>
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="mt-4">
                                                <label htmlFor="national-id-upload" className="cursor-pointer">
                                                    <span className="text-primary hover:underline">Upload national ID</span>
                                                    <input
                                                        id="national-id-upload"
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileSelect(e, 'national_id')}
                                                        disabled={uploadingNationalId}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : uploadingNationalId ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Spinner />
                                            <p className="text-sm">Uploading and verifying...</p>
                                        </div>
                                    ) : documentsStatus.national_id?.verified ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="font-medium">National ID Verified</span>
                                        </div>
                                    ) : documentsStatus.national_id?.status === 'failed' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-center gap-2 text-red-600">
                                                <X className="h-5 w-5" />
                                                <span className="font-medium">Verification Failed</span>
                                            </div>
                                            <p className="text-sm text-red-600">{documentsStatus.national_id.failure_reason}</p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setNationalIdFile(null);
                                                    setDocumentsStatus(prev => ({ ...prev, national_id: null }));
                                                }}
                                            >
                                                Upload Again
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Spinner />
                                            <span className="text-sm">Verifying...</span>
                                        </div>
                                    )}
                                </div>
                                <InputError message={errors.national_id} />
                            </div>

                            {errors.documents && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.documents}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={handleBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={!documentsStatus.all_verified}
                                    className="min-w-[120px]"
                                >
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Vehicle Details */}
                {currentStep === 3 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Car className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Vehicle Details</CardTitle>
                                    <CardDescription>
                                        Provide information about your primary vehicle
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {errors.submit && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.submit}</AlertDescription>
                                </Alert>
                            )}

                            <Alert className="bg-muted/50">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    Vehicle registration number will be automatically generated. Weight will be measured at toll stations.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                                    <Select
                                        value={formData.vehicle_type}
                                        onValueChange={(value) =>
                                            handleInputChange('vehicle_type', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vehicle type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getVehicleTypeOptions().map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.vehicle_type} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="make">Vehicle Make *</Label>
                                    <Select
                                        value={formData.make}
                                        onValueChange={(value) =>
                                            handleInputChange('make', value)
                                        }
                                        disabled={!formData.vehicle_type || availableMakes.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select make" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableMakes.map((make) => (
                                                <SelectItem key={make} value={make}>
                                                    {make}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.make} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="model">Vehicle Model *</Label>
                                    <Select
                                        value={formData.model}
                                        onValueChange={(value) =>
                                            handleInputChange('model', value)
                                        }
                                        disabled={!formData.make || availableModels.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableModels.map((model) => (
                                                <SelectItem key={model} value={model}>
                                                    {model}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.model} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="year">Year *</Label>
                                    <Input
                                        id="year"
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear() + 1}
                                        value={formData.year}
                                        onChange={(e) =>
                                            handleInputChange('year', e.target.value)
                                        }
                                        placeholder="e.g., 2020"
                                    />
                                    <InputError message={errors.year} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="color">Color (Optional)</Label>
                                    <Input
                                        id="color"
                                        value={formData.color}
                                        onChange={(e) =>
                                            handleInputChange('color', e.target.value)
                                        }
                                        placeholder="e.g., White"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="weight" className="flex items-center gap-2">
                                        <Weight className="h-4 w-4" />
                                        Weight Capacity
                                    </Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        value={formData.weight}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Maximum capacity: {formatWeight(formData.weight)} (auto-filled based on vehicle type)
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={handleBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="min-w-[120px]"
                                >
                                    {loading && <Spinner />}
                                    Complete Setup
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
