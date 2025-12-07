

#include <LiquidCrystal_I2C.h>

byte heart_code[8] = {
  0b00000, // tham khao
  0b01010, 
  0b11111, 
  0b11111, 
  0b11111, 
  0b01110, 
  0b00100, 
  0b00000  
};

byte light_code[8] = {
  0b00100,
  0b10101,
  0b01110,
  0b11111,
  0b01110,
  0b10101,
  0b00100,
  0b00000
};

byte humid_code[8] = {
  0b00000,
  0b01110,
  0b01110,
  0b10101,
  0b11111,
  0b11011,
  0b00000,
  0b00000
};

const char* menuList[] = {"TT Ca nhan", "TT Cam bien", "DK den", "DK quat"};

LiquidCrystal_I2C lcd(0x27, 16, 2);
const int bt = A0;
const int btn = 2;
const char* name = "Lee Kun Da";
const char* id = "23127035";
const int light = A1;
const int humid = A2;

void setup()
{
  Serial.begin(9600);
  
  pinMode(bt, INPUT);
  pinMode(btn, OUTPUT);
  pinMode(light, INPUT);
  pinMode(humid, INPUT);
  
  lcd.init();
  lcd.createChar(0, heart_code);
  lcd.createChar(1, light_code);
  lcd.createChar(2, humid_code);
  lcd.setCursor(0, 0);
  lcd.backlight();
}


void displayMenu(int idx){
  lcd.setCursor(0, 0);
  lcd.write(byte(0));
  lcd.setCursor(2, 0);
  lcd.print(menuList[idx]);
  lcd.setCursor(2, 1);
  lcd.print(menuList[idx+1]);
}


int prev = -2;

void menuScreen(int prev){
    int doc_bt = map(analogRead(bt), 0, 1023, 0, 2);
    if(prev != doc_bt) lcd.clear();
 	displayMenu(doc_bt);
  	prev = doc_bt;
}

void personScreen(){
  lcd.clear();
  int name_idx = 7 - (strlen(name)-1)/2;
  lcd.setCursor(name_idx, 0);
  lcd.print(name);
  int id_idx = 7 - (strlen(id)-1)/2;
  lcd.setCursor(id_idx, 1);
  lcd.print(id);
}


void lightScreen(){
  lcd.clear();
  int light_info = analogRead(light);
  int humid_info = analogRead(humid);

  lcd.setCursor(0, 0);
  lcd.write(byte(1));
lcd.setCursor(2, 0);
 lcd.print("Anh sang: ");
 lcd.print(light_info); 
      lcd.setCursor(0, 1);
  	lcd.write(byte(2));
	lcd.setCursor(2, 1);
 lcd.print("Do am   : ");
 lcd.print(humid_info); 

}

void loop()
{
  //
}