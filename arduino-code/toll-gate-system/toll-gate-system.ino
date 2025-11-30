/*
 * ESP32 RFID Toll Gate System
 * Components: RFID-RC522, Servo Motor, HX711 Load Cell
 *
 * Flow:
 * 1. Weight sensor detects vehicle (weight > threshold)
 * 2. System prompts to scan RFID card
 * 3. Card is verified (in this test, checks against known UIDs)
 * 4. If authorized: Servo opens gate, weight decreases, gate closes
 * 5. If denied: Gate stays closed, error indication
 */

#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <HX711.h>

// ===== PIN DEFINITIONS =====
// RFID Pins
#define RFID_SS_PIN   5
#define RFID_RST_PIN  4

// Servo Pin
#define SERVO_PIN     13

// HX711 Weight Sensor Pins
#define HX711_DT_PIN  33  // Changed to GPIO 33 (clearly labeled)
#define HX711_SCK_PIN 32  // Changed to GPIO 32 (clearly labeled)

// Optional LED Pins
#define GREEN_LED     25
#define RED_LED       26
#define BUZZER        27

// ===== CONFIGURATION =====
#define WEIGHT_THRESHOLD  100.0   // Raw reading threshold (not grams)
#define CALIBRATION_FACTOR 1.0    // Disabled calibration - using raw readings

// Gate servo positions
#define GATE_CLOSED   0     // Degrees
#define GATE_OPEN     90    // Degrees

// Known RFID Cards (UPDATE THESE WITH YOUR CARD UIDs)
#define CARD_WITH_BALANCE    "93 EA DA 91"  // Your first card - has balance
#define CARD_WITHOUT_BALANCE "43 30 0C 95"  // Your second card - no balance white

// ===== OBJECT INSTANCES =====
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Servo gateServo;
HX711 scale;

// ===== STATE VARIABLES =====
enum SystemState {
  STATE_IDLE,              // Waiting for vehicle
  STATE_VEHICLE_DETECTED,  // Vehicle on sensor, waiting for RFID
  STATE_PROCESSING,        // Checking RFID
  STATE_GATE_OPENING,      // Authorized, gate opening
  STATE_GATE_OPEN,         // Gate is open, waiting for vehicle to pass
  STATE_GATE_CLOSING,      // Vehicle passed, closing gate
  STATE_ACCESS_DENIED      // No balance, showing error
};

SystemState currentState = STATE_IDLE;
unsigned long stateTimer = 0;
float currentWeight = 0;
bool vehiclePresent = false;

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n╔════════════════════════════════════════╗");
  Serial.println("║   ESP32 RFID TOLL GATE SYSTEM v1.0    ║");
  Serial.println("╚════════════════════════════════════════╝\n");

  // Initialize pins
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Turn off all LEDs
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  // Initialize RFID
  Serial.println("Initializing RFID...");
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
      Serial.print("Current weight: ");
      Serial.print(currentWeight, 1);
      Serial.print(" | Threshold: ");
      Serial.print(WEIGHT_THRESHOLD, 1);
      Serial.print(" | Status: ");
      Serial.println(currentWeight > WEIGHT_THRESHOLD ? "DETECTED ✓" : "Waiting...");
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
  Serial.println("\n--- Checking Authorization ---");

  // Check against known cards
  if (uid == CARD_WITH_BALANCE) {
    Serial.println("✅ AUTHORIZED!");
    Serial.println("Driver: Card #1 (Has Balance)");
    Serial.println("Status: Payment approved");
    Serial.println("Action: Opening gate...");

    currentState = STATE_GATE_OPENING;
  }
  else if (uid == CARD_WITHOUT_BALANCE) {
    Serial.println("❌ ACCESS DENIED!");
    Serial.println("Driver: Card #2 (No Balance)");
    Serial.println("Status: Insufficient funds");
    Serial.println("Action: Gate remains closed");

    currentState = STATE_ACCESS_DENIED;
  }
  else {
    Serial.println("⚠️  UNKNOWN CARD!");
    Serial.println("Status: Card not registered");
    Serial.println("Action: Gate remains closed");
    Serial.println("\nTo register this card, update the code:");
    Serial.println("Replace 'XX XX XX XX' with: " + uid);

    currentState = STATE_ACCESS_DENIED;
  }
}

// ===== CALIBRATION FUNCTION =====
// Call this from setup() to calibrate your weight sensor
void calibrateScale() {
  Serial.println("\n=== WEIGHT SENSOR CALIBRATION ===");
  Serial.println("Remove all weight from sensor...");
  delay(3000);

  scale.set_scale();
  scale.tare();

  Serial.println("Place known weight (e.g., 1000g) on sensor...");
  delay(5000);

  long reading = scale.get_units(10);
  Serial.print("Reading: ");
  Serial.println(reading);
  Serial.print("Calibration factor: ");
  Serial.println(reading / 1000.0);  // Assuming 1000g weight

  Serial.println("\nUpdate CALIBRATION_FACTOR in code with this value!");
  while(1);
}
