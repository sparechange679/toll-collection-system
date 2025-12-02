/*
 * ESP32 RFID Toll Gate System - Connected to Laravel Backend
 * Components: RFID-RC522, Servo Motor, HX711 Load Cell
 *
 * Features:
 * - WiFi connectivity to Laravel API
 * - Real-time balance checking
 * - Automatic toll deduction
 * - Weight sensor integration
 */

#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <HX711.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== WIFI CONFIGURATION =====
const char* WIFI_SSID = "TP-Link_173D";
const char* WIFI_PASSWORD = "54712195";

// const char* API_URL = "http://192.168.14.119:8000/api/toll-gate/verify-rfid";
const char* API_URL = "http://192.168.1.108:8000/api/toll-gate/verify-rfid";

// ===== PIN DEFINITIONS =====
// RFID Pins
#define RFID_SS_PIN   5
#define RFID_RST_PIN  4

// Servo Pin
#define SERVO_PIN     13

// HX711 Weight Sensor Pins
#define HX711_DT_PIN  33
#define HX711_SCK_PIN 32

// Optional LED Pins
#define GREEN_LED     25
#define RED_LED       26
#define BUZZER        27

// ===== CONFIGURATION =====
#define WEIGHT_THRESHOLD  100.0   // Raw reading threshold (not grams)
#define CALIBRATION_FACTOR 1.0    // Disabled calibration - using raw readings
#define TOLL_GATE_ID      1       // Your toll gate ID from database

// Gate servo positions
#define GATE_CLOSED   0     // Degrees
#define GATE_OPEN     90    // Degrees

// ===== OBJECT INSTANCES =====
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Servo gateServo;
HX711 scale;

// ===== STATE VARIABLES =====
enum SystemState {
  STATE_IDLE,              // Waiting for vehicle
  STATE_VEHICLE_DETECTED,  // Vehicle on sensor, waiting for RFID
  STATE_PROCESSING,        // Checking RFID with API
  STATE_GATE_OPENING,      // Authorized, gate opening
  STATE_GATE_OPEN,         // Gate is open, waiting for vehicle to pass
  STATE_GATE_CLOSING,      // Vehicle passed, closing gate
  STATE_ACCESS_DENIED      // No balance, showing error
};

SystemState currentState = STATE_IDLE;
unsigned long stateTimer = 0;
unsigned long lastScanTime = 0;  // Track last successful scan
float currentWeight = 0;
bool vehiclePresent = false;
bool wifiConnected = false;

// Cooldown period in milliseconds (3 seconds)
#define SCAN_COOLDOWN 3000

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n╔════════════════════════════════════════╗");
  Serial.println("║   ESP32 RFID TOLL GATE SYSTEM v2.0    ║");
  Serial.println("║        Connected to Laravel API        ║");
  Serial.println("╚════════════════════════════════════════╝\n");

  // Initialize pins
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Turn off all LEDs
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n  ✅ WiFi connected!");
    Serial.print("  IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("  API URL: ");
    Serial.println(API_URL);
  } else {
    Serial.println("\n  ❌ WiFi connection failed!");
    Serial.println("  System will run in OFFLINE mode (no balance checks)");
    wifiConnected = false;
  }

  // Initialize RFID
  Serial.println("\nInitializing RFID...");
  SPI.begin();
  rfid.PCD_Init();
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.print("  RFID Version: 0x");
  Serial.println(version, HEX);

  if (version == 0x00 || version == 0xFF) {
    Serial.println("  ❌ RFID module not detected!");
    while(1);
  }
  Serial.println("  ✅ RFID ready");

  // Initialize Servo
  Serial.println("Initializing Servo...");
  gateServo.attach(SERVO_PIN);
  gateServo.write(GATE_CLOSED);
  Serial.println("  ✅ Gate closed and ready");

  // Initialize Weight Sensor
  Serial.println("Initializing Weight Sensor...");
  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);

  Serial.println("  Taring scale (remove all weight)...");
  delay(2000);
  scale.tare();  // Reset to zero
  Serial.println("  ✅ Weight sensor ready");

  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║          SYSTEM READY!                 ║");
  Serial.println("║  Place vehicle on weight sensor...    ║");
  Serial.println("╚════════════════════════════════════════╝\n");

  currentState = STATE_IDLE;
}

// ===== MAIN LOOP =====
void loop() {
  // Read current weight
  if (scale.is_ready()) {
    currentWeight = scale.get_units(3);  // Average of 3 readings

    // Debug output every 20 loops (every 2 seconds)
    static int debugCounter = 0;
    if (debugCounter++ % 20 == 0) {
      Serial.print("Weight: ");
      Serial.print(currentWeight, 1);
      Serial.print(" | Threshold: ");
      Serial.print(WEIGHT_THRESHOLD, 1);
      Serial.print(" | WiFi: ");
      Serial.print(wifiConnected ? "✓" : "✗");
      Serial.print(" | Status: ");
      Serial.println(currentWeight > WEIGHT_THRESHOLD ? "DETECTED" : "Waiting...");
    }
  }

  // Check if vehicle is present
  vehiclePresent = (currentWeight > WEIGHT_THRESHOLD);

  // State machine
  switch (currentState) {
    case STATE_IDLE:
      handleIdleState();
      break;

    case STATE_VEHICLE_DETECTED:
      handleVehicleDetectedState();
      break;

    case STATE_PROCESSING:
      handleProcessingState();
      break;

    case STATE_GATE_OPENING:
      handleGateOpeningState();
      break;

    case STATE_GATE_OPEN:
      handleGateOpenState();
      break;

    case STATE_GATE_CLOSING:
      handleGateClosingState();
      break;

    case STATE_ACCESS_DENIED:
      handleAccessDeniedState();
      break;
  }

  delay(100);  // Small delay for stability
}

// ===== STATE HANDLERS =====

void handleIdleState() {
  if (vehiclePresent) {
    // Check if we're still in cooldown period
    if (millis() - lastScanTime < SCAN_COOLDOWN) {
      // Still in cooldown - just show DETECTED status
      Serial.println("🚗 DETECTED (cooldown active - please wait)");
      delay(500);  // Prevent spam
      return;
    }

    Serial.println("\n┌─────────────────────────────────┐");
    Serial.println("│   🚗 VEHICLE DETECTED!          │");
    Serial.println("└─────────────────────────────────┘");
    Serial.print("Weight Reading: ");
    Serial.print(currentWeight, 1);
    Serial.println(" (raw)");
    Serial.println("\n>>> Please scan RFID card...\n");

    // Beep to alert driver
    tone(BUZZER, 1000, 200);

    currentState = STATE_VEHICLE_DETECTED;
    stateTimer = millis();
  }
}

void handleVehicleDetectedState() {
  // Check for RFID card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    // Timeout after 10 seconds
    if (millis() - stateTimer > 10000) {
      Serial.println("⏱️  Timeout - No RFID scanned");
      currentState = STATE_IDLE;
    }
    return;
  }

  // Card detected!
  String uid = getCardUID();
  Serial.println("┌─────────────────────────────────┐");
  Serial.println("│   📇 RFID CARD SCANNED!         │");
  Serial.println("└─────────────────────────────────┘");
  Serial.println("UID: " + uid);

  currentState = STATE_PROCESSING;
  processRFID(uid);
}

void handleProcessingState() {
  // Processing is done in processRFID(), state changes there
}

void handleGateOpeningState() {
  Serial.println("\n🟢 Opening gate...");
  digitalWrite(GREEN_LED, HIGH);

  // Slowly open gate
  for (int pos = GATE_CLOSED; pos <= GATE_OPEN; pos += 5) {
    gateServo.write(pos);
    delay(50);
  }

  Serial.println("✅ Gate OPEN - Please proceed");
  tone(BUZZER, 2000, 300);

  currentState = STATE_GATE_OPEN;
  stateTimer = millis();
}

void handleGateOpenState() {
  // Wait for vehicle to pass (weight decreases) OR timeout after 15 seconds
  if (!vehiclePresent || (millis() - stateTimer > 15000)) {
    Serial.println("\n🚗 Vehicle passed / Timeout");
    currentState = STATE_GATE_CLOSING;
  }
}

void handleGateClosingState() {
  Serial.println("🔴 Closing gate...");

  // Slowly close gate
  for (int pos = GATE_OPEN; pos >= GATE_CLOSED; pos -= 5) {
    gateServo.write(pos);
    delay(50);
  }

  digitalWrite(GREEN_LED, LOW);
  Serial.println("✅ Gate CLOSED");
  Serial.println("\n" + String('=', 50));
  Serial.println("Ready for next vehicle...\n");

  // Record the time of this scan for cooldown
  lastScanTime = millis();

  currentState = STATE_IDLE;
}

void handleAccessDeniedState() {
  // Flash red LED and beep
  for (int i = 0; i < 3; i++) {
    digitalWrite(RED_LED, HIGH);
    tone(BUZZER, 400, 200);
    delay(300);
    digitalWrite(RED_LED, LOW);
    delay(200);
  }

  delay(2000);
  Serial.println("\n" + String('=', 50));
  Serial.println("Ready for next vehicle...\n");

  // Record the time of this scan for cooldown
  lastScanTime = millis();

  currentState = STATE_IDLE;
}

// ===== HELPER FUNCTIONS =====

String getCardUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (i > 0) uid += " ";
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  return uid;
}

void processRFID(String uid) {
  Serial.println("\n--- Verifying with Laravel API ---");

  if (!wifiConnected) {
    Serial.println("❌ WiFi not connected - Cannot verify");
    Serial.println("Action: Gate remains closed");
    currentState = STATE_ACCESS_DENIED;
    return;
  }

  // Call Laravel API
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");
  http.setTimeout(15000);  // Increase timeout to 15 seconds

  // Create JSON payload
  StaticJsonDocument<256> requestDoc;
  requestDoc["rfid_uid"] = uid;
  requestDoc["toll_gate_id"] = TOLL_GATE_ID;
  requestDoc["weight_kg"] = currentWeight / 1000.0; // Convert to kg (rough estimate)

  String jsonPayload;
  serializeJson(requestDoc, jsonPayload);

  Serial.println("Sending request: " + jsonPayload);

  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);

    // Parse JSON response
    StaticJsonDocument<1024> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      bool success = responseDoc["success"] | false;

      if (success) {
        // SUCCESS - Access granted
        Serial.println("\n✅ AUTHORIZED!");

        const char* driverName = responseDoc["data"]["driver_name"];
        const char* vehicleReg = responseDoc["data"]["vehicle_registration"];
        const char* amountDeducted = responseDoc["data"]["amount_deducted"];
        const char* newBalance = responseDoc["data"]["new_balance"];

        Serial.println("Driver: " + String(driverName));
        Serial.println("Vehicle: " + String(vehicleReg));
        Serial.println("Amount Deducted: " + String(amountDeducted) + " Rwf");
        Serial.println("New Balance: " + String(newBalance) + " Rwf");
        Serial.println("Action: Opening gate...");

        currentState = STATE_GATE_OPENING;
      } else {
        // DENIED - Insufficient balance or error
        Serial.println("\n❌ ACCESS DENIED!");

        const char* message = responseDoc["message"];
        const char* errorCode = responseDoc["error_code"];

        Serial.println("Reason: " + String(message));
        Serial.println("Error Code: " + String(errorCode));

        // Try to get additional data if available
        if (responseDoc.containsKey("data")) {
          const char* driverName = responseDoc["data"]["driver_name"];
          const char* currentBalance = responseDoc["data"]["current_balance"];
          const char* requiredAmount = responseDoc["data"]["required_amount"];

          if (driverName) Serial.println("Driver: " + String(driverName));
          if (currentBalance) Serial.println("Current Balance: " + String(currentBalance) + " Rwf");
          if (requiredAmount) Serial.println("Required: " + String(requiredAmount) + " Rwf");
        }

        Serial.println("Action: Gate remains closed");
        currentState = STATE_ACCESS_DENIED;
      }
    } else {
      Serial.println("❌ JSON parsing error: " + String(error.c_str()));
      currentState = STATE_ACCESS_DENIED;
    }
  } else {
    Serial.println("❌ HTTP Error: " + String(httpResponseCode));
    Serial.println("Cannot connect to server");
    currentState = STATE_ACCESS_DENIED;
  }

  http.end();
}
