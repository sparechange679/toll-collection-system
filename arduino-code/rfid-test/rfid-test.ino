/*
 * RFID-RC522 Module Test
 * Tests RFID card reading functionality
 */

#include <SPI.h>
#include <MFRC522.h>

// RFID Pins
#define RFID_SS_PIN   5
#define RFID_RST_PIN  4

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n╔════════════════════════════════╗");
  Serial.println("║  RFID-RC522 MODULE TEST        ║");
  Serial.println("╚════════════════════════════════╝\n");

  // Initialize SPI bus
  SPI.begin();

  // Initialize RFID module
  Serial.println("Initializing RFID module...");
  rfid.PCD_Init();

  // Check RFID module version
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.print("RFID Firmware Version: 0x");
  Serial.println(version, HEX);

  if (version == 0x00 || version == 0xFF) {
    Serial.println("\n❌ ERROR: RFID module not detected!");
    Serial.println("\nTroubleshooting:");
    Serial.println("1. Check wiring connections");
    Serial.println("2. Ensure RFID uses 3.3V (NOT 5V!)");
    Serial.println("3. Verify SPI pins: SS=5, RST=4, SCK=18, MISO=19, MOSI=23");
    while(1);  // Stop here
  }

  Serial.println("✅ RFID module detected successfully!\n");
  Serial.println("Module Details:");
  Serial.println("  Type: MFRC522");
  Serial.println("  SS Pin: GPIO 5");
  Serial.println("  RST Pin: GPIO 4");
  Serial.println("  SPI Interface: Default ESP32 pins\n");

  Serial.println(String('=', 50));
  Serial.println("Ready to scan RFID cards!");
  Serial.println("Place an RFID card or tag near the reader...");
  Serial.println(String('=', 50) + "\n");
}

void loop() {
  // Look for new cards
  if (!rfid.PICC_IsNewCardPresent()) {
    return;  // No card detected, continue loop
  }

  // Try to read the card serial
  if (!rfid.PICC_ReadCardSerial()) {
    return;  // Reading failed, continue loop
  }

  // Card detected and read successfully!
  Serial.println("\n┌─────────────────────────────────┐");
  Serial.println("│   📇 RFID CARD DETECTED!        │");
  Serial.println("└─────────────────────────────────┘");

  // Get card type
  MFRC522::PICC_Type piccType = rfid.PICC_GetType(rfid.uid.sak);
  Serial.print("Card Type: ");
  Serial.println(rfid.PICC_GetTypeName(piccType));

  // Display UID
  Serial.print("UID: ");
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (i > 0) {
      uid += " ";
      Serial.print(" ");
    }
    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
      Serial.print("0");
    }
    uid += String(rfid.uid.uidByte[i], HEX);
    Serial.print(rfid.uid.uidByte[i], HEX);
  }
  Serial.println();

  // Display UID in uppercase (Laravel format)
  uid.toUpperCase();
  Serial.println("UID (Uppercase): " + uid);

  // Display UID size
  Serial.print("UID Size: ");
  Serial.print(rfid.uid.size);
  Serial.println(" bytes");

  // Display in decimal format (optional)
  Serial.print("UID (Decimal): ");
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (i > 0) Serial.print(" ");
    Serial.print(rfid.uid.uidByte[i]);
  }
  Serial.println("\n");

  Serial.println("✅ Card read successfully!");
  Serial.println(String('=', 50));
  Serial.println("Ready for next card...\n");

  // Halt PICC and stop encryption
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(1000);  // Wait 1 second before next scan
}
