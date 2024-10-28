#include <Controllino.h>

int version=1;
int config=1;
volatile unsigned int counter0 = 0;  // på IN0 så snabb, unsigned int är här 16bit 
volatile unsigned int counter1 = 0;  // på IN1 så snabb
volatile unsigned int counter2 = 0;  // på A4 så långsammare 
volatile unsigned int counter3 = 0;  // på A5 så långsammare
#define INPCOUNT 8    // A4-A5 är analog only och IN0-IN1 används till räknare
int inToPin[INPCOUNT]={CONTROLLINO_A0, CONTROLLINO_A1, CONTROLLINO_A2, CONTROLLINO_A3, CONTROLLINO_A4, CONTROLLINO_A5, CONTROLLINO_IN0, CONTROLLINO_IN1};
// int inToPin[INPCOUNT]={CONTROLLINO_A0, CONTROLLINO_A1, CONTROLLINO_A2, CONTROLLINO_A3};
int inputvalues[INPCOUNT];

#define OUTCOUNT 8
int outToPin[OUTCOUNT]={CONTROLLINO_D0, CONTROLLINO_D1, CONTROLLINO_D2, CONTROLLINO_D3, CONTROLLINO_D4, CONTROLLINO_D5, CONTROLLINO_D6, CONTROLLINO_D7};
int outputvalues[OUTCOUNT];

#define COUNTERSCOUNT 8
int countervalues[COUNTERSCOUNT];

void setup() {
  // Controllino Mini i fysisk pin ordning
  pinMode(CONTROLLINO_IN0, INPUT); // p2 CONTROLLINO_SCREW_TERMINAL_DIGITAL_IN_00
  pinMode(CONTROLLINO_IN1, INPUT); // p3 CONTROLLINO_SCREW_TERMINAL_DIGITAL_IN_01
  pinMode(CONTROLLINO_D0, OUTPUT); // p4 CONTROLLINO_SCREW_TERMINAL_RELAY_00
  pinMode(CONTROLLINO_D1, OUTPUT); // p5 CONTROLLINO_SCREW_TERMINAL_RELAY_01
  pinMode(CONTROLLINO_D2, OUTPUT); // p6 CONTROLLINO_SCREW_TERMINAL_RELAY_02
  pinMode(CONTROLLINO_D3, OUTPUT); // p7 CONTROLLINO_SCREW_TERMINAL_RELAY_03
  pinMode(CONTROLLINO_D4, OUTPUT); // p8 CONTROLLINO_SCREW_TERMINAL_RELAY_04
  pinMode(CONTROLLINO_D5, OUTPUT); // p9 CONTROLLINO_SCREW_TERMINAL_RELAY_05
  // pinMode(CONTROLLINO_PIN_HEADER_PWM_03, OUTPUT); // p10
  // pinMode(CONTROLLINO_PIN_HEADER_PWM_04, OUTPUT); // p11
  // pinMode(CONTROLLINO_PIN_HEADER_DIGITAL_OUT_10); // p12
  // pinMode(CONTROLLINO_PIN_HEADER_DIGITAL_OUT_11); // p13
  pinMode(CONTROLLINO_A0, INPUT); // p14 CONTROLLINO_SCREW_TERMINAL_DIGITAL_ADC_IN_00
  pinMode(CONTROLLINO_A1, INPUT); // p15 CONTROLLINO_SCREW_TERMINAL_DIGITAL_ADC_IN_01
  pinMode(CONTROLLINO_A2, INPUT); // p16 CONTROLLINO_SCREW_TERMINAL_DIGITAL_ADC_IN_02
  pinMode(CONTROLLINO_A3, INPUT); // p17
  pinMode(CONTROLLINO_D6, OUTPUT); // p18 CONTROLLINO_SCREW_TERMINAL_DIGITAL_OUT_06
  pinMode(CONTROLLINO_D7, OUTPUT); // p19 CONTROLLINO_SCREW_TERMINAL_DIGITAL_OUT_07
  pinMode(CONTROLLINO_A4, INPUT); // p20 CONTROLLINO_SCREW_TERMINAL_ANALOG_IN_06 OBS! ANALOG ONLY
  pinMode(CONTROLLINO_A5, INPUT); // p21 CONTROLLINO_SCREW_TERMINAL_ANALOG_IN_07 OBS! ANALOG ONLY

  // attachInterrupt(digitalPinToInterrupt(pin), ISR, mode)
  /*  mode: defines when the interrupt should be triggered.
            Four constants are predefined as valid values:
      LOW to trigger the interrupt whenever the pin is low,
      CHANGE to trigger the interrupt whenever the pin changes value
      RISING to trigger when the pin goes from low to high,
      FALLING for when the pin goes from high to low.
      The Due, Zero and MKR1000 boards allow also:
      HIGH to trigger the interrupt whenever the pin is high.
      */
  attachInterrupt(digitalPinToInterrupt(CONTROLLINO_IN0), myint0, RISING);
  attachInterrupt(digitalPinToInterrupt(CONTROLLINO_IN1), myint1, RISING);

  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB
  }
  Serial.setTimeout(1000);
  Serial.print("\nArduino control version:");
  Serial.print(version);
  Serial.print(" config:");
  Serial.println(config);
}

void Logg(String txt)
{
  Serial.println(txt);
}

int i;
int t1=1500;
int t2=100;

void OpenHatch(byte chPort, byte chValue)
{
  Serial.print("D7 to +12V, laddar kondensator (ms):"); Serial.println(t1);
  digitalWrite(CONTROLLINO_D7, HIGH);
  delay(t1);    // Ladda kondensator så länge, min verkar vara 1300 ms
  digitalWrite(CONTROLLINO_D7, LOW);
  Serial.println("D7 off");

  Serial.print("D4 Relay ON, tid (ms)="); Serial.println(t2);
  digitalWrite(CONTROLLINO_D4, HIGH);
  delay(t2); // Ladda ur kondensator över relä, min verkar vara 10 ms
  digitalWrite(CONTROLLINO_D4, LOW);
  Serial.println("D4 Relay OFF");
}

void SetDigitalOutput(byte chPort, byte chValue)
{
  int v;
  switch (chValue) {
  case '0':   v=0; break;
  case '1':   v=1; break;
  default:  Logg("ERROR:Value must be 0 or 1"); return;  break;
  }

  switch (chPort) {
  case '0':   digitalWrite(CONTROLLINO_D0, v); break;
  case '1':   digitalWrite(CONTROLLINO_D1, v); break;
  case '2':   digitalWrite(CONTROLLINO_D2, v); break;
  case '3':   digitalWrite(CONTROLLINO_D3, v); break;
  case '4':   digitalWrite(CONTROLLINO_D4, v); break;
  case '5':   digitalWrite(CONTROLLINO_D5, v); break;
  case '6':   digitalWrite(CONTROLLINO_D6, v); break;
  case '7':   digitalWrite(CONTROLLINO_D7, v); break;
  default:    Logg("ERROR:Portnumber must be 0..7"); return; break;
  }
  // Logg("OK: digitalWrite Done");
}

// Utgående meddelanden startar med # och slutar med "\r\n"
// Fri payload längd men bara tecken > '0' tillåtna
// Teckenvärden '0'-'9' eller 'A'-'F'
// Styrtecken små bokstäver
// Gjort för att vara human readable
// Tänk på att varje byte över 16 bytes blockar cpu
void CheckFullStatus(int sendcmd)
{
  int v;
  int diffs=0;
  String s;
  for (i=0; i<INPCOUNT; i++) { 
      v=digitalRead(inToPin[i]);
      if (i==4 || i==5) {   // Specialfall, A4 och A5 är analog only
          v = analogRead(inToPin[i]);
          if (v>500) v=1; else v=0;
      }

      if (v!=inputvalues[i]) {  // om ändrat värde
          diffs++;
          if (i==2) {
            if (v) counter2++;      
          }
          if (i==3) {
            if (v) counter3++;      
          }
      } 
      inputvalues[i]=v;
  }

  for (i=0; i<OUTCOUNT; i++) {
      v=digitalRead(outToPin[i]);
      if (v!=outputvalues[i]) diffs++;
      outputvalues[i]=v;
  }

    if (counter0 != countervalues[0]) diffs++;
    countervalues[0]=counter0;
    if (counter1 != countervalues[1]) diffs++;
    countervalues[1]=counter1;
    if (counter2 != countervalues[2]) diffs++;
    countervalues[2]=counter2;
    if (counter3 != countervalues[3]) diffs++;
    countervalues[3]=counter3;

if (sendcmd || diffs) {
    // Följande går att optimera mer om det behövs genom att byta String till char*
    s= "#a";
    for (i=0; i<INPCOUNT; i++) {
      if (inputvalues[i]) s+="1"; else s+="0";
    }
    s += "d";
    for (i=0; i<OUTCOUNT; i++) {
      if (outputvalues[i]) s+="1"; else s+="0";
    }

   s += "v"+String(countervalues[0]);
   s += "w"+String(countervalues[1]);
   s += "x"+String(countervalues[2]);
   s += "y"+String(countervalues[3]);
//  s += "z"+String(Serial.availableForWrite());  // typiskt 64 från start
   s += "z"+String(diffs);  

    Serial.println(s);
   }
}

void SendFullStatus_Old(byte chPort, byte chValue)
{
  Serial.print("#a");
  if (digitalRead(CONTROLLINO_A0)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A1)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A2)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A3)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A4)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A5)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_IN0)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_IN1)) Serial.print("1"); else Serial.print("0");

  Serial.print("d");
  if (digitalRead(CONTROLLINO_D0)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_D1)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_D2)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_D3)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_D4)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_D5)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_D6)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_D7)) Serial.print("1"); else Serial.print("0");
 
  Serial.print("v");  
  Serial.print(counter0);
  Serial.print("w");  
  Serial.print(counter1);

  Serial.print("x");  
  Serial.print(counter2);
  Serial.print("y");  
  Serial.print(counter3);

  Serial.print("z");  
  Serial.print(Serial.availableForWrite());

  Serial.println("");

}

void SendStatus(byte chPort, byte chValue)
{
  Serial.print("#A");
  if (digitalRead(CONTROLLINO_A0)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A1)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A2)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A3)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A4)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_A5)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_IN0)) Serial.print("1"); else Serial.print("0");
  if (digitalRead(CONTROLLINO_IN1)) Serial.print("1"); else Serial.print("0");
  Serial.print("V");  
  Serial.print(counter0);
  Serial.print("W");  
  Serial.print(counter1);
  Serial.println("");
}

int n=0;
int serState=0;
int inChar=0;
// Inkommande meddelanden börjar med '$' och slutar med "\r\n"
// $D01<13><10>
// 01234   5
#define MSGMINLEN 5
#define MSGMAXLEN 8
byte buffer[MSGMAXLEN];

void loop() {
  // put your main code here, to run repeatedly:
  // Serial.print("Loop number="); Serial.println(i++);
  //  delay(1000);
  CheckFullStatus(0);
  n=Serial.available();               // Hämta antal tecken i inbufferten
  if (n > 0) {
    if (serState==0) {                // State 0 håller rent i inbuffer och letar bara efter starttecken
       inChar = Serial.read();        // Läser ett tecjen som en int, -1 om saknas
       if (inChar=='$') serState=1;   // Om hittat starttecken
    }
    if (serState==1) {

      if (n >= MSGMINLEN) {           // Om tilräckligt många redan i buffert läs ut exakt antal för meddelande, lämna resten
          n=Serial.readBytes(buffer, MSGMINLEN);   //läser 
          // n=Serial.readBytesUntil('$', buffer, length)
          // if (buffer[0]=='D') SetDigitalOutput(buffer[1], buffer[2]);
          if (buffer[3]!=13 || buffer[4]!=10) {
            Logg("ERROR:CR LF needed");
          } else {
            switch (buffer[0]) {
            case 'a':    break;
            case 'b':    break;
            case 'c':    break;
            case 'd':
            case 'D':   SetDigitalOutput(buffer[1], buffer[2]); break;
            case 'o':
            case 'O':   OpenHatch(buffer[1], buffer[2]); break;
            case 'S':   SendStatus(buffer[1], buffer[2]); break;
            case 's':   CheckFullStatus(1); break;            
            default:    Logg("ERROR:Command Unknown"); return; break;
            }
          }
          serState=0;

      }
    }
  }
}

void myint0() {
  counter0++;
}

void myint1() {
  counter1++;
}


