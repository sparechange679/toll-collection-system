# Toll Collection System - UML Diagrams & Documentation

## Table of Contents
1. [Sequence Diagrams](#sequence-diagrams)
2. [Activity Diagrams](#activity-diagrams)
3. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram)
4. [Data Dictionary](#data-dictionary)

---

## Sequence Diagrams

### 1. Driver Registration & Onboarding

```mermaid
sequenceDiagram
    participant D as Driver
    participant UI as Web Interface
    participant Auth as Auth System
    participant DB as Database
    participant OCR as OCR Service

    D->>UI: Access Registration Page
    UI->>D: Display Registration Form
    D->>UI: Submit Registration Details
    UI->>Auth: Create User Account
    Auth->>DB: Store User (role: driver)
    DB-->>Auth: User Created
    Auth-->>UI: Registration Success
    UI->>D: Redirect to Onboarding

    D->>UI: Upload Documents (License, ID)
    UI->>OCR: Process Documents
    OCR->>OCR: Extract Data (Name, License #, etc)
    OCR-->>UI: Extracted Data
    UI->>DB: Store Driver Profile & Documents
    DB-->>UI: Profile Created

    D->>UI: Add Vehicle Details + RFID Tag
    UI->>DB: Store Vehicle
    DB-->>UI: Vehicle Registered
    UI->>D: Onboarding Complete
```

### 2. RFID Scan & Automatic Toll Collection

```mermaid
sequenceDiagram
    participant A as Arduino/RFID Scanner
    participant API as API Endpoint
    participant TGS as TollGateService
    participant DB as Database
    participant Gate as Physical Gate
    participant N as Notification Service
    participant D as Driver

    A->>API: POST /api/rfid-scan<br/>{rfid_tag, weight_kg}
    API->>TGS: processRfidScan()
    TGS->>DB: Find Vehicle by RFID
    DB-->>TGS: Vehicle Found
    TGS->>DB: Get User & Balance
    DB-->>TGS: User Data

    alt Sufficient Balance & Valid
        TGS->>TGS: Calculate Toll + Fine (if overweight)
        TGS->>DB: Debit User Wallet
        TGS->>DB: Create Transaction Record
        TGS->>DB: Create Toll Passage (status: success)
        TGS-->>API: {success: true, gate_action: "open"}
        API->>A: Response: OPEN GATE
        A->>Gate: Trigger Gate Open
        Gate-->>A: Gate Opened

        opt If Overweight
            TGS->>N: Send Overweight Notification
            N->>D: "Fine of ₱200 applied"
        end
    else Insufficient Balance
        TGS->>DB: Create Toll Passage (status: rejected)
        TGS->>N: Send Low Balance Notification
        N->>D: "Insufficient balance, please top up"
        TGS-->>API: {success: false, gate_action: "closed"}
        API->>A: Response: KEEP GATE CLOSED
    end
```

### 3. Staff Cash Payment Processing

```mermaid
sequenceDiagram
    participant S as Staff Member
    participant UI as Staff Dashboard
    participant C as ManualTransactionController
    participant TGS as TollGateService
    participant DB as Database
    participant Gate as Physical Gate

    S->>UI: Click "Cash Payment"
    UI->>S: Display Cash Payment Modal
    S->>UI: Enter Details<br/>(amount, weight, vehicle info)
    UI->>C: POST /staff/transactions/cash-payment
    C->>TGS: processCashPayment()

    TGS->>TGS: Check if Overweight<br/>Calculate Total
    TGS->>DB: Create Manual Transaction Record
    TGS->>DB: Create Toll Passage (status: cash_payment)
    DB-->>TGS: Records Created
    TGS-->>C: {success: true, gate_action: "open"}
    C-->>UI: Success Response
    UI->>Gate: Signal Gate Open
    UI->>S: "Payment processed successfully"
```

### 4. Staff Manual Override

```mermaid
sequenceDiagram
    participant S as Staff Member
    participant UI as Staff Dashboard
    participant C as ManualTransactionController
    participant TGS as TollGateService
    participant DB as Database
    participant Gate as Physical Gate
    participant Admin as Admin Dashboard

    S->>UI: Click "Manual Override"
    UI->>S: Display Override Modal<br/>+ Warning Message
    S->>UI: Enter Reason (emergency/VIP/error)
    UI->>C: POST /staff/transactions/manual-override
    C->>TGS: processManualOverride()

    TGS->>DB: Create Toll Passage<br/>(status: manual_override, amount: 0)
    TGS->>DB: Log Override (staff_id, reason)
    DB-->>TGS: Override Logged
    TGS-->>C: {success: true, gate_action: "open"}
    C-->>UI: Success
    UI->>Gate: Open Gate
    UI->>S: "Override applied"

    Note over DB,Admin: All overrides logged<br/>for management review
```

### 5. Staff Shift Management (Clock In/Out)

```mermaid
sequenceDiagram
    participant S as Staff Member
    participant UI as Shift Page
    participant SC as ShiftController
    participant DB as Database

    rect rgb(200, 255, 200)
        Note over S,DB: Clock In Process
        S->>UI: Navigate to /staff/shifts
        UI->>S: Show Clock In Button
        S->>UI: Click "Clock In"
        UI->>S: Display Toll Gate Selection
        S->>UI: Select Gate
        UI->>SC: POST /staff/shifts/clock-in
        SC->>DB: Check for Active Shift
        DB-->>SC: No Active Shift
        SC->>DB: Create Shift Log<br/>(clock_in_at: now)
        DB-->>SC: Shift Created
        SC-->>UI: Redirect to Dashboard
    end

    rect rgb(255, 200, 200)
        Note over S,DB: Clock Out Process
        S->>UI: Click "Clock Out"
        UI->>S: Display Handover Notes Form
        S->>UI: Enter Notes & Handover Info
        UI->>SC: POST /staff/shifts/clock-out
        SC->>DB: Get Shift Passages (calculate stats)
        DB-->>SC: Passage Data
        SC->>SC: Calculate Total Revenue,<br/>Passages, Cash Collected
        SC->>DB: Update Shift Log<br/>(clock_out_at, statistics)
        SC->>DB: Create Handover Note (if provided)
        DB-->>SC: Shift Ended
        SC-->>UI: Success
        UI->>S: "Shift ended successfully"
    end
```

### 6. Driver Wallet Top-Up (Stripe)

```mermaid
sequenceDiagram
    participant D as Driver
    participant UI as Wallet Page
    participant WC as WalletController
    participant Stripe as Stripe API
    participant WH as Webhook Handler
    participant DB as Database

    D->>UI: Navigate to /wallet
    UI->>D: Display Balance & Top-Up Button
    D->>UI: Click "Top Up" (enter amount)
    UI->>WC: POST /wallet/top-up
    WC->>Stripe: Create Checkout Session
    Stripe-->>WC: Session URL
    WC-->>UI: Redirect to Stripe
    UI->>D: Stripe Checkout Page

    D->>Stripe: Complete Payment
    Stripe->>WH: POST /stripe/webhook<br/>(checkout.session.completed)
    WH->>WH: Verify Webhook Signature
    WH->>DB: Add Credit to User Balance
    WH->>DB: Create Transaction Record<br/>(type: credit)
    DB-->>WH: Balance Updated
    WH-->>Stripe: 200 OK

    Stripe->>D: Redirect to /wallet/success
    UI->>D: "Top-up successful!<br/>New balance: ₱500"
```

### 7. Incident Reporting by Staff

```mermaid
sequenceDiagram
    participant S as Staff Member
    participant UI as Dashboard
    participant IC as IncidentController
    participant DB as Database
    participant N as Notification Service
    participant Admin as Admin

    S->>UI: Click "Report Incident"
    UI->>S: Display Incident Form
    S->>UI: Fill Details<br/>(type, severity, description)
    UI->>IC: POST /staff/incidents
    IC->>DB: Create Incident Record<br/>(status: reported)
    DB-->>IC: Incident Created

    alt Critical Severity
        IC->>N: Send Critical Alert
        N->>Admin: Immediate Notification<br/>"Critical incident at Gate X"
    end

    IC-->>UI: Success
    UI->>S: "Incident reported successfully"

    Note over Admin: Admin can view & manage<br/>incidents in admin panel
```

### 8. Driver Lookup by Staff

```mermaid
sequenceDiagram
    participant S as Staff Member
    participant UI as Lookup Page
    participant DLC as DriverLookupController
    participant TGS as TollGateService
    participant DB as Database

    S->>UI: Navigate to /staff/driver-lookup
    UI->>S: Display Search Form
    S->>UI: Enter RFID or Registration #
    UI->>DLC: POST /staff/driver-lookup/search
    DLC->>TGS: lookupDriver(rfid_tag)
    TGS->>DB: Find Vehicle by RFID
    DB-->>TGS: Vehicle Found
    TGS->>DB: Get User, Driver Profile, Recent Passages
    DB-->>TGS: Complete Driver Data
    TGS-->>DLC: Driver Information
    DLC-->>UI: Render Results
    UI->>S: Display:<br/>- Driver Info<br/>- Vehicle Details<br/>- Balance<br/>- Recent Passages
```

### 9. Admin Revenue Reports

```mermaid
sequenceDiagram
    participant A as Admin
    participant UI as Admin Dashboard
    participant RC as ReportController
    participant DB as Database

    A->>UI: Navigate to /admin/reports
    UI->>A: Display Date Range Filters
    A->>UI: Select Date Range
    UI->>RC: GET /admin/reports?date_from&date_to
    RC->>DB: Query Transactions (type: debit)
    RC->>DB: Query Passages & Statistics
    RC->>DB: Query Top Revenue Generators
    DB-->>RC: Aggregated Data
    RC->>RC: Calculate:<br/>- Total Revenue<br/>- Daily Revenue<br/>- Vehicle Stats<br/>- Violations
    RC-->>UI: Render Report
    UI->>A: Display Charts & Statistics

    opt Export Report
        A->>UI: Click "Export CSV"
        UI->>RC: GET /admin/reports/export/revenue
        RC->>DB: Get Transaction Details
        RC->>RC: Generate CSV File
        RC-->>UI: Download CSV
        UI->>A: File Downloaded
    end
```

### 10. Document Verification (OCR)

```mermaid
sequenceDiagram
    participant D as Driver
    participant UI as Onboarding Page
    participant DC as DocumentController
    participant OCR as OCR Service (Vision API)
    participant DB as Database

    D->>UI: Upload License/ID Document
    UI->>DC: POST /documents/upload
    DC->>DC: Store File in Storage
    DC->>OCR: Send Document Image
    OCR->>OCR: Extract Text:<br/>- Name<br/>- ID Number<br/>- License Number<br/>- Expiry Date
    OCR-->>DC: Extracted Data (JSON)

    DC->>DC: Validate Extracted Data
    alt Validation Success
        DC->>DB: Update Document<br/>(status: verified)
        DC->>DB: Update Driver Profile<br/>(license_number, id_number)
        DC-->>UI: {status: "verified"}
        UI->>D: "Document verified ✓"
    else Validation Failed
        DC->>DB: Update Document<br/>(status: failed, reason)
        DC-->>UI: {status: "failed"}
        UI->>D: "Verification failed. Please retry."
        D->>UI: Click "Retry"
        UI->>DC: POST /documents/{id}/retry
    end
```

---

## Activity Diagrams

### 1. RFID Scan & Toll Collection Process

```mermaid
flowchart TD
    Start([Vehicle Approaches Gate]) --> ScanRFID[Arduino Scans RFID Tag]
    ScanRFID --> MeasureWeight[Weight Sensor Measures Vehicle]
    MeasureWeight --> SendData[Send Data to API<br/>rfid_tag + weight_kg]
    SendData --> FindVehicle{Vehicle Found<br/>in Database?}

    FindVehicle -->|No| RejectUnreg[Create Rejection Record<br/>Status: Unregistered]
    RejectUnreg --> KeepClosed1[Keep Gate Closed]
    KeepClosed1 --> NotifyStaff1[Alert Staff<br/>Unregistered Vehicle]
    NotifyStaff1 --> End1([End - Manual Intervention])

    FindVehicle -->|Yes| CheckActive{Vehicle<br/>Active?}
    CheckActive -->|No| RejectInactive[Reject - Inactive Vehicle]
    RejectInactive --> KeepClosed1

    CheckActive -->|Yes| GetUser[Get Vehicle Owner]
    GetUser --> CalcToll[Calculate Base Toll: ₱50]
    CalcToll --> CheckWeight{Weight ><br/>Limit?}

    CheckWeight -->|Yes - Overweight| AddFine[Add Fine: ₱200<br/>Total = ₱250]
    CheckWeight -->|No| SetTotal1[Total = ₱50]

    AddFine --> CheckBalance{Balance >=<br/>Total Amount?}
    SetTotal1 --> CheckBalance

    CheckBalance -->|No| RejectBalance[Create Rejection Record<br/>Status: Insufficient Funds]
    RejectBalance --> SendNotif[Send Low Balance Notification]
    SendNotif --> KeepClosed2[Keep Gate Closed]
    KeepClosed2 --> End2([End - Top-Up Required])

    CheckBalance -->|Yes| DebitWallet[Debit User Wallet]
    DebitWallet --> CreateTrans[Create Transaction Record<br/>Type: Debit]
    CreateTrans --> CreatePassage[Create Toll Passage<br/>Status: Success]
    CreatePassage --> CheckOverweight{Was<br/>Overweight?}

    CheckOverweight -->|Yes| SendFinNotif[Send Overweight Fine Notification]
    SendFinNotif --> OpenGate
    CheckOverweight -->|No| OpenGate[Signal Gate to Open]

    OpenGate --> GateOpens[Physical Gate Opens]
    GateOpens --> VehiclePasses[Vehicle Passes Through]
    VehiclePasses --> GateCloses[Gate Closes Automatically]
    GateCloses --> End3([End - Success])
```

### 2. Staff Cash Payment Process

```mermaid
flowchart TD
    Start([Unregistered Vehicle Arrives]) --> StaffClick[Staff Clicks 'Cash Payment']
    StaffClick --> EnterWeight[Enter Vehicle Weight]
    EnterWeight --> CheckWeight{Weight ><br/>Limit?}

    CheckWeight -->|Yes| CalcOverweight[Calculate:<br/>Toll ₱50 + Fine ₱200 = ₱250]
    CheckWeight -->|No| CalcNormal[Calculate: Toll = ₱50]

    CalcOverweight --> DisplayAmount[Display Recommended Amount]
    CalcNormal --> DisplayAmount

    DisplayAmount --> EnterDetails[Staff Enters:<br/>- Amount<br/>- Vehicle Registration Optional<br/>- Driver Info Optional]
    EnterDetails --> CollectCash[Staff Collects Cash]
    CollectCash --> SubmitForm[Submit Cash Payment Form]

    SubmitForm --> CreateManual[Create Manual Transaction<br/>Type: Cash Payment]
    CreateManual --> CreatePassage[Create Toll Passage<br/>Status: Cash Payment]
    CreatePassage --> OpenGate[Signal Gate Open]
    OpenGate --> UpdateShift[Update Shift Log<br/>cash_collected += amount<br/>cash_payments += 1]
    UpdateShift --> Success[Display Success Message]
    Success --> End([End])
```

### 3. Staff Manual Override Process

```mermaid
flowchart TD
    Start([Emergency/Special Situation]) --> StaffClick[Staff Clicks 'Manual Override']
    StaffClick --> ShowWarning[Display Warning:<br/>'All overrides are logged<br/>and reviewed by management']
    ShowWarning --> EnterReason[Staff Enters Reason:<br/>- Emergency Vehicle<br/>- VIP<br/>- System Error<br/>- Other]

    EnterReason --> OptRFID{RFID Tag<br/>Available?}
    OptRFID -->|Yes| EnterRFID[Enter RFID Tag]
    OptRFID -->|No| SkipRFID[Skip RFID]

    EnterRFID --> Submit
    SkipRFID --> Submit[Submit Override Request]

    Submit --> CreatePassage[Create Toll Passage:<br/>- Status: Manual Override<br/>- Amount: ₱0<br/>- Override Reason Logged<br/>- Staff ID Recorded]
    CreatePassage --> OpenGate[Signal Gate Open]
    OpenGate --> LogAudit[Log Override in Audit Trail<br/>For Management Review]
    LogAudit --> UpdateShift[Update Shift Log<br/>manual_overrides += 1]
    UpdateShift --> Success[Display Success Message]
    Success --> End([End])
```

### 4. Staff Shift Management (Clock In/Out)

```mermaid
flowchart TD
    Start([Staff Arrives for Shift]) --> CheckActive{Has Active<br/>Shift?}

    CheckActive -->|Yes| AlreadyActive[Display Error:<br/>'Already clocked in']
    AlreadyActive --> EndError([End - Error])

    CheckActive -->|No| ShowGates[Display Available Toll Gates]
    ShowGates --> SelectGate[Staff Selects Toll Gate]
    SelectGate --> ClockIn[Create Shift Log:<br/>- clock_in_at: now<br/>- toll_gate_id<br/>- Initialize counters to 0]
    ClockIn --> ShiftActive[Shift Status: ACTIVE]
    ShiftActive --> WorkShift[Staff Monitors Gate<br/>Processes Transactions]

    WorkShift --> ReadyClockOut{Ready to<br/>Clock Out?}
    ReadyClockOut -->|No| WorkShift

    ReadyClockOut -->|Yes| ShowClockOut[Display Clock Out Form]
    ShowClockOut --> EnterNotes[Enter Optional:<br/>- Shift Notes<br/>- Handover Notes<br/>- Pending Issues]
    EnterNotes --> CalculateStats[Calculate Shift Statistics:<br/>- Total Passages<br/>- Successful/Rejected<br/>- Cash Collected<br/>- Total Revenue<br/>- Duration]

    CalculateStats --> UpdateShift[Update Shift Log:<br/>- clock_out_at: now<br/>- All statistics]
    UpdateShift --> HasHandover{Handover Notes<br/>Provided?}

    HasHandover -->|Yes| CreateHandover[Create Handover Note<br/>For Next Shift Staff]
    HasHandover -->|No| SkipHandover[Skip Handover Note]

    CreateHandover --> GenerateReport
    SkipHandover --> GenerateReport[Generate Shift Report]
    GenerateReport --> Success[Clock Out Success]
    Success --> End([End - Shift Completed])
```

### 5. Driver Registration & Onboarding

```mermaid
flowchart TD
    Start([Driver Accesses System]) --> RegPage[Navigate to Registration Page]
    RegPage --> FillForm[Fill Registration Form:<br/>- Name<br/>- Email<br/>- Password]
    FillForm --> Submit1[Submit Registration]
    Submit1 --> CreateUser[Create User Account<br/>Role: Driver<br/>onboarding_completed: false]
    CreateUser --> RedirectOnboard[Redirect to Onboarding]

    RedirectOnboard --> Step1[Step 1: Upload License]
    Step1 --> UploadLicense[Upload License Document]
    UploadLicense --> OCRLicense[OCR Processing:<br/>Extract License Number,<br/>Expiry Date]

    OCRLicense --> LicenseValid{Verification<br/>Success?}
    LicenseValid -->|No| RetryLicense[Show Error + Retry Button]
    RetryLicense --> UploadLicense

    LicenseValid -->|Yes| Step2[Step 2: Upload ID]
    Step2 --> UploadID[Upload Government ID]
    UploadID --> OCRID[OCR Processing:<br/>Extract ID Number,<br/>Name, DOB]

    OCRID --> IDValid{Verification<br/>Success?}
    IDValid -->|No| RetryID[Show Error + Retry Button]
    RetryID --> UploadID

    IDValid -->|Yes| Step3[Step 3: Driver Profile]
    Step3 --> FillProfile[Fill Driver Profile:<br/>- Address<br/>- Phone<br/>- Emergency Contact]
    FillProfile --> SaveProfile[Save Driver Profile]

    SaveProfile --> Step4[Step 4: Add Vehicle]
    Step4 --> FillVehicle[Enter Vehicle Details:<br/>- Registration Number<br/>- Make/Model<br/>- RFID Tag<br/>- Vehicle Type<br/>- Weight]
    FillVehicle --> SaveVehicle[Save Vehicle]
    SaveVehicle --> Complete[Mark onboarding_completed: true]
    Complete --> Success[Redirect to Dashboard]
    Success --> End([End - Can Now Use System])
```

### 6. Incident Reporting & Management

```mermaid
flowchart TD
    Start([Incident Occurs at Gate]) --> StaffReports[Staff Clicks 'Report Incident']
    StaffReports --> SelectType[Select Incident Type:<br/>- Hardware Failure<br/>- Vehicle Breakdown<br/>- Accident<br/>- Vandalism<br/>- Power Outage<br/>- Suspicious Activity<br/>- Other]

    SelectType --> SelectSeverity[Select Severity:<br/>- Low<br/>- Medium<br/>- High<br/>- Critical]
    SelectSeverity --> FillDetails[Fill Details:<br/>- Title<br/>- Description<br/>- Action Taken<br/>- Occurred At]

    FillDetails --> Submit[Submit Incident Report]
    Submit --> CreateIncident[Create Incident Record:<br/>- Status: Reported<br/>- reported_by: Staff ID<br/>- Timestamp]

    CreateIncident --> CheckSeverity{Severity =<br/>Critical?}
    CheckSeverity -->|Yes| NotifyAdmin[Send Immediate<br/>Notification to Admin]
    CheckSeverity -->|No| SkipNotif[No Immediate Notification]

    NotifyAdmin --> UpdateShift
    SkipNotif --> UpdateShift[Update Shift Log<br/>incidents_reported += 1]
    UpdateShift --> StaffSuccess[Display Success to Staff]

    StaffSuccess --> AdminReview[Admin Reviews Incident<br/>in Admin Dashboard]
    AdminReview --> Acknowledge[Admin Updates Status:<br/>Acknowledged]
    Acknowledge --> TakeAction[Admin/Maintenance<br/>Takes Action]
    TakeAction --> InProgress[Update Status:<br/>In Progress]
    InProgress --> Resolved{Issue<br/>Resolved?}

    Resolved -->|No| TakeAction
    Resolved -->|Yes| MarkResolved[Update Status: Resolved<br/>resolved_by: User ID<br/>resolved_at: Timestamp<br/>resolution_notes]
    MarkResolved --> End([End - Incident Closed])
```

### 7. Driver Lookup by Staff

```mermaid
flowchart TD
    Start([Staff Needs Driver Info]) --> Navigate[Navigate to Driver Lookup]
    Navigate --> ShowSearch[Display Search Form]
    ShowSearch --> EnterSearch[Enter Either:<br/>- RFID Tag<br/>OR<br/>- Registration Number]

    EnterSearch --> Submit[Submit Search]
    Submit --> FindVehicle{Vehicle<br/>Found?}

    FindVehicle -->|No| ShowError[Display Error:<br/>'Driver not found']
    ShowError --> TryAgain{Try Again?}
    TryAgain -->|Yes| ShowSearch
    TryAgain -->|No| End1([End])

    FindVehicle -->|Yes| GetData[Retrieve from DB:<br/>- Vehicle Details<br/>- User/Driver Profile<br/>- Current Balance<br/>- Recent Passages Last 10]

    GetData --> DisplayResults[Display All Information:<br/><br/>Driver Section:<br/>- Name, Email, Phone<br/>- License Number<br/>- Address<br/>- Wallet Balance<br/><br/>Vehicle Section:<br/>- Registration, Make/Model<br/>- RFID Tag<br/>- Type, Color<br/>- Active Status<br/><br/>Recent Passages:<br/>- Date/Time<br/>- Toll Gate<br/>- Amount<br/>- Status]

    DisplayResults --> StaffAction{Staff Action?}
    StaffAction -->|New Search| ShowSearch
    StaffAction -->|View More| ViewPassages[Navigate to Full Passage History]
    StaffAction -->|Done| End2([End])

    ViewPassages --> End2
```

### 8. Wallet Top-Up (Stripe Payment)

```mermaid
flowchart TD
    Start([Driver Checks Balance]) --> LowBalance{Balance<br/>Low?}
    LowBalance -->|No| End1([End - No Action])

    LowBalance -->|Yes| NavigateWallet[Navigate to /wallet]
    NavigateWallet --> ShowBalance[Display Current Balance<br/>& Top-Up Button]
    ShowBalance --> ClickTopUp[Click 'Top Up']
    ClickTopUp --> EnterAmount[Enter Top-Up Amount<br/>Min: ₱100]

    EnterAmount --> ValidAmount{Amount<br/>Valid?}
    ValidAmount -->|No| ShowError[Show Error:<br/>'Minimum ₱100']
    ShowError --> EnterAmount

    ValidAmount -->|Yes| CreateSession[Backend Creates<br/>Stripe Checkout Session]
    CreateSession --> RedirectStripe[Redirect to<br/>Stripe Payment Page]
    RedirectStripe --> ChoosePayment[Driver Chooses Payment:<br/>- Credit Card<br/>- GCash<br/>- Other Methods]

    ChoosePayment --> EnterDetails[Enter Payment Details]
    EnterDetails --> SubmitPayment[Submit Payment]
    SubmitPayment --> StripeProcess[Stripe Processes Payment]

    StripeProcess --> PaymentSuccess{Payment<br/>Success?}

    PaymentSuccess -->|No| ShowFailure[Display Failure Message]
    ShowFailure --> Retry{Retry?}
    Retry -->|Yes| ChoosePayment
    Retry -->|No| End2([End - Payment Failed])

    PaymentSuccess -->|Yes| StripeWebhook[Stripe Sends Webhook:<br/>checkout.session.completed]
    StripeWebhook --> VerifyWebhook[Backend Verifies<br/>Webhook Signature]
    VerifyWebhook --> UpdateBalance[Credit User Balance:<br/>balance += amount]
    UpdateBalance --> CreateTransaction[Create Transaction Record:<br/>Type: Credit]
    CreateTransaction --> RedirectSuccess[Redirect to /wallet/success]
    RedirectSuccess --> ShowSuccess[Display Success:<br/>'Top-up successful!<br/>New balance: ₱XXX']
    ShowSuccess --> End3([End - Balance Updated])
```

---

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ vehicles : "owns"
    users ||--o{ transactions : "has"
    users ||--o{ toll_passages : "driver"
    users ||--o{ shift_logs : "staff member"
    users ||--o{ manual_transactions : "processed by"
    users ||--o{ incidents : "reported by"
    users ||--o{ incidents : "resolved by"
    users ||--o{ handover_notes : "sends"
    users ||--o{ handover_notes : "receives"
    users ||--o{ notification_recipients : "receives"
    users ||--|| driver_profiles : "has"
    users ||--o{ driver_documents : "has"

    vehicles ||--o{ toll_passages : "passes through"

    toll_gates ||--o{ toll_passages : "records"
    toll_gates ||--o{ shift_logs : "operates"
    toll_gates ||--o{ manual_transactions : "occurs at"
    toll_gates ||--o{ incidents : "occurs at"
    toll_gates ||--o{ handover_notes : "belongs to"

    shift_logs ||--o| handover_notes : "has"

    notifications ||--o{ notification_recipients : "sent to"

    users {
        bigint id PK
        string name
        string email UK
        string password
        datetime email_verified_at
        string remember_token
        string role "driver/staff/admin"
        boolean onboarding_completed
        decimal balance
        datetime created_at
        datetime updated_at
    }

    driver_profiles {
        bigint id PK
        bigint user_id FK
        string license_number UK
        date license_expiry_date
        string phone_number
        text address
        string city
        string district
        date date_of_birth
        string id_number UK
        string emergency_contact_name
        string emergency_contact_phone
        datetime created_at
        datetime updated_at
    }

    driver_documents {
        bigint id PK
        bigint user_id FK
        string document_type "license/id"
        string file_path
        string file_type
        string verification_status "pending/verified/failed"
        text extracted_data
        text failure_reason
        datetime verified_at
        datetime created_at
        datetime updated_at
    }

    vehicles {
        bigint id PK
        bigint user_id FK
        string registration_number UK
        string make
        string model
        integer year
        string vehicle_type "car/truck/bus/motorcycle"
        string color
        decimal weight
        string rfid_tag UK
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    toll_gates {
        bigint id PK
        string name
        string location
        string gate_identifier UK
        decimal base_toll_rate
        decimal overweight_fine_rate
        decimal weight_limit_kg
        boolean is_active
        string gate_status "open/closed/malfunction"
        string rfid_scanner_status "operational/offline/error"
        string weight_sensor_status "operational/offline/error"
        datetime last_heartbeat
        json hardware_info
        datetime created_at
        datetime updated_at
    }

    toll_passages {
        bigint id PK
        bigint toll_gate_id FK
        bigint user_id FK "nullable"
        bigint vehicle_id FK "nullable"
        bigint staff_id FK "nullable"
        string rfid_tag
        string status "success/rejected_insufficient_funds/rejected_unregistered/manual_override/cash_payment"
        decimal toll_amount
        decimal fine_amount
        decimal total_amount
        decimal vehicle_weight_kg
        boolean is_overweight
        string payment_method "wallet/cash/manual_override"
        text rejection_reason
        text override_reason
        json metadata
        datetime scanned_at
        datetime created_at
        datetime updated_at
    }

    shift_logs {
        bigint id PK
        bigint staff_id FK
        bigint toll_gate_id FK
        datetime clock_in_at
        datetime clock_out_at "nullable"
        integer total_passages
        integer successful_passages
        integer rejected_passages
        integer manual_overrides
        integer cash_payments
        integer incidents_reported
        decimal total_revenue
        decimal cash_collected
        text notes
        datetime created_at
        datetime updated_at
    }

    manual_transactions {
        bigint id PK
        bigint toll_gate_id FK
        bigint staff_id FK
        bigint user_id FK "nullable"
        string transaction_type "cash_payment/manual_override/fine_adjustment/balance_correction"
        decimal amount
        string vehicle_registration
        string driver_name
        string driver_contact
        text reason
        text notes
        json metadata
        datetime created_at
        datetime updated_at
    }

    incidents {
        bigint id PK
        bigint toll_gate_id FK
        bigint reported_by FK "users"
        string incident_type "hardware_failure/vehicle_breakdown/accident/vandalism/power_outage/suspicious_activity/other"
        string severity "low/medium/high/critical"
        string status "reported/acknowledged/in_progress/resolved"
        string title
        text description
        text action_taken
        text resolution_notes
        bigint resolved_by FK "users, nullable"
        datetime occurred_at
        datetime resolved_at "nullable"
        json metadata
        datetime created_at
        datetime updated_at
    }

    handover_notes {
        bigint id PK
        bigint toll_gate_id FK
        bigint from_staff_id FK "users"
        bigint to_staff_id FK "users, nullable"
        bigint shift_log_id FK "nullable"
        text notes
        json pending_issues
        boolean is_read
        datetime read_at "nullable"
        datetime created_at
        datetime updated_at
    }

    transactions {
        bigint id PK
        bigint user_id FK
        string type "credit/debit"
        decimal amount
        decimal balance_after
        string description
        string reference
        json metadata
        datetime created_at
        datetime updated_at
    }

    notifications {
        bigint id PK
        string type "low_balance/overweight_fine/toll_rate/general"
        string title
        text message
        text data
        bigint created_by FK "users, nullable"
        datetime sent_at
        datetime created_at
        datetime updated_at
    }

    notification_recipients {
        bigint id PK
        bigint notification_id FK
        bigint user_id FK
        boolean is_read
        datetime read_at "nullable"
        datetime created_at
        datetime updated_at
    }
```

---

## Data Dictionary

### Table: `users`
**Description:** Core user accounts for drivers, staff, and administrators.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| name | VARCHAR(255) | NOT NULL | Full name of the user |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address for login |
| email_verified_at | TIMESTAMP | NULL | Email verification timestamp |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| remember_token | VARCHAR(100) | NULL | Remember me token |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'driver' | User role: driver, staff, or admin |
| onboarding_completed | BOOLEAN | DEFAULT FALSE | Whether driver has completed onboarding |
| balance | DECIMAL(10,2) | DEFAULT 0.00 | Current wallet balance |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (email)
- INDEX (role)

---

### Table: `driver_profiles`
**Description:** Extended profile information for drivers.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique profile identifier |
| user_id | BIGINT | FOREIGN KEY (users.id), UNIQUE, ON DELETE CASCADE | Reference to user account |
| license_number | VARCHAR(255) | UNIQUE, NOT NULL | Driver's license number |
| license_expiry_date | DATE | NOT NULL | License expiration date |
| phone_number | VARCHAR(255) | NOT NULL | Contact phone number |
| address | TEXT | NOT NULL | Full street address |
| city | VARCHAR(255) | NOT NULL | City name |
| district | VARCHAR(255) | NULL | District/region |
| date_of_birth | DATE | NOT NULL | Driver's date of birth |
| id_number | VARCHAR(255) | UNIQUE, NOT NULL | Government ID number |
| emergency_contact_name | VARCHAR(255) | NOT NULL | Emergency contact person |
| emergency_contact_phone | VARCHAR(255) | NOT NULL | Emergency contact phone |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (license_number)
- UNIQUE INDEX (id_number)
- FOREIGN KEY (user_id)

---

### Table: `driver_documents`
**Description:** Uploaded documents for driver verification (license, ID).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique document identifier |
| user_id | BIGINT | FOREIGN KEY (users.id), ON DELETE CASCADE | Reference to user |
| document_type | VARCHAR(50) | NOT NULL | Type: 'license' or 'id' |
| file_path | VARCHAR(500) | NOT NULL | Storage path to document file |
| file_type | VARCHAR(50) | NOT NULL | MIME type (image/jpeg, etc) |
| verification_status | VARCHAR(50) | NOT NULL, DEFAULT 'pending' | Status: pending, verified, failed |
| extracted_data | TEXT | NULL | JSON data extracted by OCR |
| failure_reason | TEXT | NULL | Reason if verification failed |
| verified_at | TIMESTAMP | NULL | Verification completion timestamp |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id)
- INDEX (verification_status)

---

### Table: `vehicles`
**Description:** Registered vehicles with RFID tags.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique vehicle identifier |
| user_id | BIGINT | FOREIGN KEY (users.id), ON DELETE CASCADE | Vehicle owner |
| registration_number | VARCHAR(255) | UNIQUE, NOT NULL | License plate number |
| make | VARCHAR(255) | NOT NULL | Vehicle manufacturer |
| model | VARCHAR(255) | NOT NULL | Vehicle model |
| year | INTEGER | NOT NULL | Manufacturing year |
| vehicle_type | VARCHAR(50) | NOT NULL | Type: car, truck, bus, motorcycle |
| color | VARCHAR(100) | NOT NULL | Vehicle color |
| weight | DECIMAL(10,2) | NOT NULL | Registered vehicle weight (kg) |
| rfid_tag | VARCHAR(255) | UNIQUE, NOT NULL | RFID tag identifier |
| is_active | BOOLEAN | DEFAULT TRUE | Whether vehicle is active |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (registration_number)
- UNIQUE INDEX (rfid_tag)
- FOREIGN KEY (user_id)

---

### Table: `toll_gates`
**Description:** Physical toll gates with hardware status.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique gate identifier |
| name | VARCHAR(255) | NOT NULL | Gate name/identifier |
| location | VARCHAR(500) | NOT NULL | Physical location description |
| gate_identifier | VARCHAR(100) | UNIQUE, NOT NULL | Unique gate code |
| base_toll_rate | DECIMAL(10,2) | NOT NULL, DEFAULT 50.00 | Standard toll fee |
| overweight_fine_rate | DECIMAL(10,2) | NOT NULL, DEFAULT 200.00 | Fine for overweight vehicles |
| weight_limit_kg | DECIMAL(10,2) | NOT NULL, DEFAULT 5000.00 | Maximum weight limit |
| is_active | BOOLEAN | DEFAULT TRUE | Whether gate is operational |
| gate_status | VARCHAR(50) | DEFAULT 'closed' | Current status: open, closed, malfunction |
| rfid_scanner_status | VARCHAR(50) | DEFAULT 'operational' | Scanner status: operational, offline, error |
| weight_sensor_status | VARCHAR(50) | DEFAULT 'operational' | Sensor status: operational, offline, error |
| last_heartbeat | TIMESTAMP | NULL | Last hardware check-in |
| hardware_info | JSON | NULL | Hardware configuration details |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (gate_identifier)

---

### Table: `toll_passages`
**Description:** Record of every vehicle passage (successful or rejected).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique passage identifier |
| toll_gate_id | BIGINT | FOREIGN KEY (toll_gates.id), ON DELETE CASCADE | Gate where passage occurred |
| user_id | BIGINT | FOREIGN KEY (users.id), ON DELETE SET NULL, NULL | Driver (if registered) |
| vehicle_id | BIGINT | FOREIGN KEY (vehicles.id), ON DELETE SET NULL, NULL | Vehicle (if registered) |
| staff_id | BIGINT | FOREIGN KEY (users.id), ON DELETE SET NULL, NULL | Staff who processed (if manual) |
| rfid_tag | VARCHAR(255) | NULL | RFID tag scanned |
| status | VARCHAR(50) | NOT NULL | success, rejected_insufficient_funds, rejected_unregistered, manual_override, cash_payment |
| toll_amount | DECIMAL(10,2) | DEFAULT 0.00 | Base toll charged |
| fine_amount | DECIMAL(10,2) | DEFAULT 0.00 | Fine amount (if overweight) |
| total_amount | DECIMAL(10,2) | DEFAULT 0.00 | Total charged |
| vehicle_weight_kg | DECIMAL(10,2) | NULL | Measured vehicle weight |
| is_overweight | BOOLEAN | DEFAULT FALSE | Whether vehicle exceeded weight limit |
| payment_method | VARCHAR(50) | DEFAULT 'wallet' | wallet, cash, manual_override |
| rejection_reason | TEXT | NULL | Reason if rejected |
| override_reason | TEXT | NULL | Reason if manually overridden |
| metadata | JSON | NULL | Additional data |
| scanned_at | TIMESTAMP | NOT NULL | When RFID was scanned |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (toll_gate_id, user_id, vehicle_id, staff_id)
- INDEX (toll_gate_id, created_at)
- INDEX (user_id, created_at)
- INDEX (status)

---

### Table: `shift_logs`
**Description:** Staff shift records with statistics.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique shift identifier |
| staff_id | BIGINT | FOREIGN KEY (users.id), ON DELETE CASCADE | Staff member |
| toll_gate_id | BIGINT | FOREIGN KEY (toll_gates.id), ON DELETE CASCADE | Gate assigned |
| clock_in_at | TIMESTAMP | NOT NULL | Shift start time |
| clock_out_at | TIMESTAMP | NULL | Shift end time |
| total_passages | INTEGER | DEFAULT 0 | Total vehicles processed |
| successful_passages | INTEGER | DEFAULT 0 | Successful toll collections |
| rejected_passages | INTEGER | DEFAULT 0 | Rejected vehicles |
| manual_overrides | INTEGER | DEFAULT 0 | Manual gate openings |
| cash_payments | INTEGER | DEFAULT 0 | Cash transactions processed |
| incidents_reported | INTEGER | DEFAULT 0 | Incidents reported during shift |
| total_revenue | DECIMAL(10,2) | DEFAULT 0.00 | Total revenue collected |
| cash_collected | DECIMAL(10,2) | DEFAULT 0.00 | Cash collected |
| notes | TEXT | NULL | Staff notes about shift |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (staff_id, toll_gate_id)
- INDEX (staff_id, clock_in_at)
- INDEX (toll_gate_id)

---

### Table: `manual_transactions`
**Description:** Manual transactions processed by staff (cash, overrides, fines).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique transaction identifier |
| toll_gate_id | BIGINT | FOREIGN KEY (toll_gates.id), ON DELETE CASCADE | Gate where processed |
| staff_id | BIGINT | FOREIGN KEY (users.id), ON DELETE CASCADE | Staff who processed |
| user_id | BIGINT | FOREIGN KEY (users.id), ON DELETE SET NULL, NULL | Driver (if applicable) |
| transaction_type | VARCHAR(50) | NOT NULL | cash_payment, manual_override, fine_adjustment, balance_correction |
| amount | DECIMAL(10,2) | NOT NULL | Transaction amount |
| vehicle_registration | VARCHAR(255) | NULL | Vehicle plate (if unregistered) |
| driver_name | VARCHAR(255) | NULL | Driver name (if unregistered) |
| driver_contact | VARCHAR(255) | NULL | Driver contact (if provided) |
| reason | TEXT | NOT NULL | Reason for manual transaction |
| notes | TEXT | NULL | Additional notes |
| metadata | JSON | NULL | Additional data |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (toll_gate_id, staff_id, user_id)
- INDEX (toll_gate_id, created_at)
- INDEX (staff_id)
- INDEX (transaction_type)

---

### Table: `incidents`
**Description:** Incidents reported at toll gates (hardware failures, accidents, etc).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique incident identifier |
| toll_gate_id | BIGINT | FOREIGN KEY (toll_gates.id), ON DELETE CASCADE | Gate where incident occurred |
| reported_by | BIGINT | FOREIGN KEY (users.id), ON DELETE CASCADE | Staff who reported |
| incident_type | VARCHAR(50) | NOT NULL | hardware_failure, vehicle_breakdown, accident, vandalism, power_outage, suspicious_activity, other |
| severity | VARCHAR(50) | NOT NULL | low, medium, high, critical |
| status | VARCHAR(50) | DEFAULT 'reported' | reported, acknowledged, in_progress, resolved |
| title | VARCHAR(255) | NOT NULL | Brief incident summary |
| description | TEXT | NOT NULL | Detailed description |
| action_taken | TEXT | NULL | Actions taken by staff |
| resolution_notes | TEXT | NULL | Resolution details |
| resolved_by | BIGINT | FOREIGN KEY (users.id), ON DELETE SET NULL, NULL | Who resolved the incident |
| occurred_at | TIMESTAMP | NOT NULL | When incident occurred |
| resolved_at | TIMESTAMP | NULL | When incident was resolved |
| metadata | JSON | NULL | Additional data |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (toll_gate_id, reported_by, resolved_by)
- INDEX (toll_gate_id, created_at)
- INDEX (incident_type)
- INDEX (status)
- INDEX (severity)

---

### Table: `handover_notes`
**Description:** Notes left by staff for next shift.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique note identifier |
| toll_gate_id | BIGINT | FOREIGN KEY (toll_gates.id), ON DELETE CASCADE | Gate related to note |
| from_staff_id | BIGINT | FOREIGN KEY (users.id), ON DELETE CASCADE | Staff leaving the note |
| to_staff_id | BIGINT | FOREIGN KEY (users.id), ON DELETE SET NULL, NULL | Specific staff recipient |
| shift_log_id | BIGINT | FOREIGN KEY (shift_logs.id), ON DELETE SET NULL, NULL | Related shift |
| notes | TEXT | NOT NULL | Handover notes content |
| pending_issues | JSON | NULL | List of pending issues |
| is_read | BOOLEAN | DEFAULT FALSE | Whether note has been read |
| read_at | TIMESTAMP | NULL | When note was read |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (toll_gate_id, from_staff_id, to_staff_id, shift_log_id)
- INDEX (toll_gate_id, created_at)
- INDEX (from_staff_id)
- INDEX (to_staff_id)

---

### Table: `transactions`
**Description:** Financial transactions for user wallets (credits/debits).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique transaction identifier |
| user_id | BIGINT | FOREIGN KEY (users.id), ON DELETE CASCADE | User account |
| type | VARCHAR(50) | NOT NULL | credit (top-up), debit (toll payment) |
| amount | DECIMAL(10,2) | NOT NULL | Transaction amount |
| balance_after | DECIMAL(10,2) | NOT NULL | Balance after transaction |
| description | VARCHAR(500) | NOT NULL | Transaction description |
| reference | VARCHAR(255) | NULL | Reference number (e.g., TOLL-123456) |
| metadata | JSON | NULL | Additional transaction data |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id)
- INDEX (user_id, created_at)
- INDEX (type)

---

### Table: `notifications`
**Description:** System notifications sent to users.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique notification identifier |
| type | VARCHAR(50) | NOT NULL | low_balance, overweight_fine, toll_rate, general |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification content |
| data | TEXT | NULL | JSON data for notification |
| created_by | BIGINT | FOREIGN KEY (users.id), ON DELETE SET NULL, NULL | Creator (if admin-sent) |
| sent_at | TIMESTAMP | NOT NULL | When notification was sent |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (created_by)

---

### Table: `notification_recipients`
**Description:** Tracks which users received which notifications.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique recipient record |
| notification_id | BIGINT | FOREIGN KEY (notifications.id), ON DELETE CASCADE | Notification reference |
| user_id | BIGINT | FOREIGN KEY (users.id), ON DELETE CASCADE | Recipient user |
| is_read | BOOLEAN | DEFAULT FALSE | Whether user has read it |
| read_at | TIMESTAMP | NULL | When user read it |
| created_at | TIMESTAMP | NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (notification_id, user_id)
- UNIQUE INDEX (notification_id, user_id)

---

## Summary

This documentation provides:

1. **10 Sequence Diagrams** showing interactions between components for all major features
2. **8 Activity Diagrams** showing workflow processes for key operations
3. **Complete ERD** with all 13 database tables and their relationships
4. **Detailed Data Dictionary** for all 13 tables with 150+ fields

All diagrams use **Mermaid syntax** and can be rendered in:
- GitHub markdown
- GitLab markdown
- VS Code (with Mermaid extension)
- Notion
- Any Mermaid-compatible viewer

The system covers:
- Driver features (registration, onboarding, wallet, passages)
- Staff features (shifts, cash payments, overrides, incidents, lookup)
- Admin features (reports, notifications, management)
- Hardware integration (Arduino, RFID, weight sensors)
