int sensorValueX1 = 0;
int sensorValueY1 = 0;
int sensorValueZ1 = 0;
int sensorValueX2 = 0;
int sensorValueY2 = 0;
int sensorValueZ2 = 0;
int button1 = 0;
int button2 = 0;
int target1 = 0;
int target2 = 0;
int blade = 0;
int PIN_BUTTON_1 = 3;
int PIN_BUTTON_2 = 4;
int PIN_TARGET_1 = 5;
int PIN_TARGET_2 = 6;
int PIN_BLADE = 7;

void setup() {
  Serial.begin(9600);
  
  pinMode(PIN_BUTTON_1, INPUT_PULLUP);
  pinMode(PIN_BUTTON_2, INPUT_PULLUP);
  pinMode(PIN_TARGET_1, INPUT_PULLUP);
  pinMode(PIN_TARGET_2, INPUT_PULLUP);
  pinMode(PIN_BLADE, INPUT_PULLUP);
  
  while (Serial.available() <= 0) {
    Serial.println("hello"); // send a starting message
    delay(300);              // wait 1/3 second
  }
}

void loop() {
  button1 = 0;
  button2 = 0;
  //If press the button on the sword, register that as a 1 for calibration/debugging
  if (digitalRead(PIN_BUTTON_1) == LOW) button1 = 1;
  if (digitalRead(PIN_BUTTON_2) == LOW) button2 = 1;

  target1 = target2 = 0;
  //If get hit, register that as a 1 for scoring
  if (digitalRead(PIN_TARGET_1) == LOW) target1 = 1;
  if (digitalRead(PIN_TARGET_2) == LOW) target2 = 1;

  blade = 0;
  //If blades of two swords touch, register that as a 1 for sound
  if (digitalRead(PIN_BLADE) == LOW) blade = 1;
  
  sensorValueX1 = analogRead(A0);
  sensorValueY1 = analogRead(A1);
  sensorValueZ1 = analogRead(A2);
  sensorValueX2 = analogRead(A3);
  sensorValueY2 = analogRead(A4);
  sensorValueZ2 = analogRead(A5);

  if (Serial.available() > 0) {
    //read the incoming byte:
    Serial.read();

    Serial.print(sensorValueX1);
    Serial.print(",");

    Serial.print(sensorValueY1);
    Serial.print(",");

    Serial.print(sensorValueZ1);
    Serial.print(",");

    Serial.print(button1);
    Serial.print(",");

    Serial.print(target1);
    Serial.print(",");

    Serial.print(sensorValueX2);
    Serial.print(",");

    Serial.print(sensorValueY2);
    Serial.print(",");

    Serial.print(sensorValueZ2);
    Serial.print(",");

    Serial.print(button2);
    Serial.print(",");

    Serial.print(target2);
    Serial.print(",");

    Serial.println(blade);
  }
}
