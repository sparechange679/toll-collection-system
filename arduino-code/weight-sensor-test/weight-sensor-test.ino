/*
 * Simple HX711 Weight Sensor Test
 * Tests load cell without needing a platform
 */

#include <HX711.h>

// HX711 Pins
#define HX711_DT_PIN  33
#define HX711_SCK_PIN 32

HX711 scale;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n╔════════════════════════════════╗");
  Serial.println("║  HX711 WEIGHT SENSOR TEST      ║");
  Serial.println("╚════════════════════════════════╝\n");

  // Initialize scale
  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);

  Serial.println("Remove all weight from sensor...");
  delay(3000);

  Serial.println("Taring (zeroing) scale...");
  scale.tare();

  Serial.println("✅ Ready!\n");
  Serial.println("Try these tests:");
  Serial.println("1. Press on the load cell with your hand");
  Serial.println("2. Place an object on top of the load cell");
  Serial.println("3. Remove the object and see it return to ~0");
  Serial.println("\n" + String('=', 50) + "\n");
}

void loop() {
  if (scale.is_ready()) {
    // Get raw reading (no calibration yet)
    long reading = scale.get_units(5);  // Average of 5 readings

    // Display in a clean format
    Serial.print("Raw Reading: ");
    Serial.print(reading);

    // Visual indicator
    if (reading > 1000) {
      Serial.println("  ← Heavy press! 🔴");
    } else if (reading > 100) {
      Serial.println("  ← Light press 🟡");
    } else if (reading > 10) {
      Serial.println("  ← Very light 🟢");
    } else {
      Serial.println("  ← No weight ⚪");
    }

  } else {
    Serial.println("⚠️ HX711 not ready - check wiring!");
  }

  delay(200);  // Update 5 times per second
}
