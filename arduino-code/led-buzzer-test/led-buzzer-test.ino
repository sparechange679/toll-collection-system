/*
 * LED and Buzzer Test
 * Tests all status indicators
 */

#define GREEN_LED 25
#define RED_LED   26
#define BUZZER    27

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Turn off everything
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  Serial.println("\n╔════════════════════════════════╗");
  Serial.println("║  LED & BUZZER TEST             ║");
  Serial.println("╚════════════════════════════════╝\n");
}

void loop() {
  Serial.println("Testing Green LED...");
  digitalWrite(GREEN_LED, HIGH);
  delay(1000);
  digitalWrite(GREEN_LED, LOW);
  delay(500);

  Serial.println("Testing Red LED...");
  digitalWrite(RED_LED, HIGH);
  delay(1000);
  digitalWrite(RED_LED, LOW);
  delay(500);

  Serial.println("Testing Buzzer - Low tone...");
  tone(BUZZER, 400, 500);  // Low beep
  delay(1000);

  Serial.println("Testing Buzzer - High tone...");
  tone(BUZZER, 2000, 500);  // High beep
  delay(1000);

  Serial.println("Testing Success Pattern...");
  digitalWrite(GREEN_LED, HIGH);
  tone(BUZZER, 2000, 300);
  delay(2000);
  digitalWrite(GREEN_LED, LOW);
  delay(500);

  Serial.println("Testing Denied Pattern...");
  for (int i = 0; i < 3; i++) {
    digitalWrite(RED_LED, HIGH);
    tone(BUZZER, 400, 200);
    delay(300);
    digitalWrite(RED_LED, LOW);
    delay(200);
  }

  Serial.println("\n--- Test Complete! Repeating in 3 seconds ---\n");
  delay(3000);
}
