<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];

        if ($this->user()->isDriver()) {
            $rules = array_merge($rules, [
                'license_number' => ['required', 'string', 'max:255'],
                'license_expiry_date' => ['required', 'date', 'after:today'],
                'phone_number' => ['required', 'string', 'max:255'],
                'address' => ['required', 'string'],
                'city' => ['required', 'string', 'max:255'],
                'district' => ['required', 'string', 'max:255'],
                'date_of_birth' => ['required', 'date', 'before:today'],
                'id_number' => ['required', 'string', 'max:255'],
                'emergency_contact_name' => ['nullable', 'string', 'max:255'],
                'emergency_contact_phone' => ['nullable', 'string', 'max:255'],
            ]);
        }

        return $rules;
    }
}
