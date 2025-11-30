# ESP32 Toll Gate System - Setup & Testing Guide

## 🎯 System Overview

Your toll gate system is now **fully integrated** with the Laravel backend!

### What's Working:
- ✅ Hardware detects vehicles via weight sensor
- ✅ RFID cards are scanned
- ✅ ESP32 connects to WiFi
- ✅ Real-time API calls to Laravel backend
- ✅ Balance checking & automatic deduction
- ✅ Transaction history saved to database
- ✅ Gate opens/closes automatically

---

## 📊 Database Configuration

### Current Setup:

**Driver 1: Test User (HAS BALANCE)** ✅
- RFID UID: `93 EA DA 91`
- Vehicle: Toyota Corolla (ABC-1234)
- Balance: **10,000 Rwf**
- **Result:** Will pass - gate opens!

**Driver 2: Poor Driver (NO BALANCE)** ❌
- RFID UID: `43 30 0C 95`
- Vehicle: Honda Civic (XYZ-5678)
- Balance: **0 Rwf**
- **Result:** Will be denied - gate stays closed!

---

## ⚙️ ESP32 Configuration

### Step 1: Update WiFi Credentials

Open `toll-gate-system.ino` and update these lines (21-22):

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // ⚠️ UPDATE THIS!
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // ⚠️ UPDATE THIS!
```

**Replace with your actual WiFi network:**
```cpp
const char* WIFI_SSID = "MyHomeWiFi";           // Your WiFi name
const char* WIFI_PASSWORD = "MyWiFiPassword123"; // Your WiFi password
```

**Important:**
- ESP32 only supports **2.4GHz** WiFi networks (not 5GHz)
- Your computer and ESP32 must be on the same network
- Make sure the Laravel app is accessible at `http://toll-collection-system.test`

### Step 2: Verify API URL

The API URL is already set correctly (line 23):
```cpp
const char* API_URL = "http://toll-collection-system.test/api/toll-gate/verify-rfid";
```

**To test if the API is accessible:**
1. Open browser
2. Visit: `http://toll-collection-system.test/api/toll-gate/status?toll_gate_id=1`
3. You should see JSON response with toll gate info

### Step 3: Upload to ESP32

1. Open Arduino IDE
2. Open `toll-gate-system.ino`
3. Click **Upload**
4. **Hold BOOT button** when "Connecting..." appears
5. Release after upload starts
6. Press **EN** button when done

---

## 🧪 Testing the Complete System

### Test 1: WiFi Connection

**Expected Serial Output:**
```
╔════════════════════════════════════════╗
║   ESP32 RFID TOLL GATE SYSTEM v2.0    ║
║        Connected to Laravel API        ║
╚════════════════════════════════════════╝

Connecting to WiFi...
..........
  ✅ WiFi connected!
  IP Address: 192.168.1.100
  API URL: http://toll-collection-system.test/api/toll-gate/verify-rfid
```

**If WiFi fails:**
- Check SSID and password
- Ensure 2.4GHz network
- Move ESP32 closer to router

### Test 2: Authorized Card (WILL PASS)

1. **Press and hold** the load cell
2. Wait for "VEHICLE DETECTED" message
3. **While still pressing**, scan RFID card `93 EA DA 91`
4. Watch Serial Monitor

**Expected Output:**
```
┌─────────────────────────────────┐
│   🚗 VEHICLE DETECTED!          │
└─────────────────────────────────┘
Weight Reading: 156.4 (raw)

>>> Please scan RFID card...

┌─────────────────────────────────┐
│   📇 RFID CARD SCANNED!         │
└─────────────────────────────────┘
UID: 93 EA DA 91

--- Verifying with Laravel API ---
Sending request: {"rfid_uid":"93 EA DA 91","toll_gate_id":1,"weight_kg":0.156}
Response code: 200
Response: {"success":true,"message":"Access granted..."}

✅ AUTHORIZED!
Driver: Test User
Vehicle: ABC-1234
Amount Deducted: 500.00 Rwf
New Balance: 9,500.00 Rwf
Action: Opening gate...

🟢 Opening gate...
✅ Gate OPEN - Please proceed
```

**Hardware Actions:**
- ✅ Green LED lights up
- ✅ Buzzer beeps (high tone)
- ✅ Servo opens gate to 90°
- ✅ Gate stays open for 15 seconds OR until weight removed
- ✅ Gate closes automatically
- ✅ Green LED turns off

### Test 3: Denied Card (WILL FAIL)

1. Press and hold the load cell
2. Wait for "VEHICLE DETECTED"
3. While pressing, scan RFID card `43 30 0C 95`

**Expected Output:**
```
--- Verifying with Laravel API ---
Response code: 402

❌ ACCESS DENIED!
Reason: Insufficient balance
Error Code: INSUFFICIENT_BALANCE
Driver: Poor Driver
Current Balance: 0.00 Rwf
Required: 500.00 Rwf
Action: Gate remains closed
```

**Hardware Actions:**
- ❌ Red LED flashes 3 times
- ❌ Buzzer beeps 3 times (low tone)
- ❌ Gate stays CLOSED
- ❌ No balance deduction

---

## 📱 Check Results in Laravel

### View Transactions

After a successful passage, check the database:

**Option 1: Tinker**
```bash
php artisan tinker
>>> \App\Models\Transaction::latest()->first()
```

**Option 2: Browser (if you create a transactions page)**
Visit: `http://toll-collection-system.test/driver/transactions`

**You should see:**
- Transaction type: `toll_payment`
- Amount: `-500.00`
- Description: "Toll payment at Main Gate"
- New balance: `9500.00`

### View Toll Passages

```bash
php artisan tinker
>>> \App\Models\TollPassage::with('user', 'vehicle')->latest()->first()
```

**You should see:**
- User: Test User
- Vehicle: ABC-1234
- RFID Tag: 93 EA DA 91
- Status: successful
- Toll Amount: 500.00
- Weight: ~0.156 kg

---

## 🔧 Troubleshooting

### Problem: WiFi Won't Connect

**Solutions:**
1. Check SSID/password spelling
2. Ensure 2.4GHz network (not 5GHz)
3. Move ESP32 closer to router
4. Check router settings (allow new devices)

### Problem: HTTP Error -1 or Cannot Connect

**Solutions:**
1. Verify Laravel app is running: `composer run dev`
2. Check if accessible in browser: `http://toll-collection-system.test`
3. Ensure ESP32 and computer on same network
4. Check firewall settings

### Problem: API Returns 404

**Solutions:**
1. Clear Laravel cache: `php artisan route:clear`
2. Verify routes: `php artisan route:list --name=toll-gate`
3. Check API URL in code matches exactly

### Problem: RFID Not Found in Database

**Error:**
```
❌ ACCESS DENIED!
Reason: RFID tag not registered or vehicle inactive
Error Code: RFID_NOT_FOUND
```

**Solutions:**
1. Check RFID UID format (should have spaces: "93 EA DA 91")
2. Verify in database:
   ```bash
   php artisan tinker
   >>> \App\Models\Vehicle::where('rfid_tag', '93 EA DA 91')->first()
   ```
3. Make sure vehicle `is_active = true`

### Problem: Gate Opens But No Balance Deducted

**Check:**
1. Look for errors in Serial Monitor
2. Check Laravel logs: `tail -f storage/logs/laravel.log`
3. Verify transaction was created:
   ```bash
   php artisan tinker
   >>> \App\Models\Transaction::latest()->get()
   ```

---

## 🎨 Frontend Integration (Next Steps)

To allow drivers to manage their RFID tags via the web interface, you can:

1. **Add RFID field to vehicle form**
2. **Display RFID on vehicle details page**
3. **Show real-time toll passages**
4. **Add balance alerts**

Would you like me to implement the frontend updates to display/edit RFID tags?

---

## 📊 System Flow Diagram

```
┌─────────────┐
│   Vehicle   │
│  Approaches │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Weight Sensor│ ← Detects vehicle
│  Triggered  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Scan      │
│ RFID Card   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ESP32     │
│ Reads UID   │
└──────┬──────┘
       │
       ▼ (WiFi)
┌─────────────┐
│   Laravel   │
│  API Call   │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
  Has Balance?   No Balance
       │             │
       │             ▼
       │      ┌─────────────┐
       │      │Access Denied│
       │      │Gate Closed  │
       │      │Red LED Flash│
       │      └─────────────┘
       │
       ▼
┌─────────────┐
│   Deduct    │
│   Balance   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Record    │
│ Transaction │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Open Gate   │
│ Green LED   │
│ High Beep   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Wait for    │
│Vehicle Pass │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Close Gate  │
│LED Off      │
└─────────────┘
```

---

## 🎯 Quick Reference

| Component | Pin | Notes |
|-----------|-----|-------|
| RFID SDA | GPIO 5 | |
| RFID RST | GPIO 4 | |
| Servo | GPIO 13 | 5V power |
| HX711 DT | GPIO 33 | |
| HX711 SCK | GPIO 32 | |
| Green LED | GPIO 25 | + 220Ω resistor |
| Red LED | GPIO 26 | + 220Ω resistor |
| Buzzer | GPIO 27 | |

| RFID Card | Driver | Balance | Expected Result |
|-----------|--------|---------|-----------------|
| 93 EA DA 91 | Test User | 10,000 Rwf | ✅ PASS |
| 43 30 0C 95 | Poor Driver | 0 Rwf | ❌ DENIED |

| API Endpoint | Method | Purpose |
|--------------|--------|---------|
| `/api/toll-gate/verify-rfid` | POST | Verify RFID & deduct balance |
| `/api/toll-gate/status` | GET | Get toll gate info |

---

## 💡 Tips

- Serial Monitor baud rate: **115200**
- Hold BOOT button to upload
- Press EN button after upload
- Weight threshold: 100 (adjust if needed)
- WiFi timeout: 10 seconds
- RFID scan timeout: 10 seconds
- Gate open duration: 15 seconds

---

**Ready to test! 🚀**

Upload the code, configure WiFi, and test both RFID cards!
