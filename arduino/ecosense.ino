
#include <Servo.h>
#include <math.h>

// =================================
// PINOS DOS COMPONENTES
// =================================

#define PINO_TRIG   4
#define PINO_ECHO   5
#define PINO_LED    3
#define PINO_SERVO  9
#define PINO_NTC    A0

// =================================
// CONFIGURACOES
// =================================

#define DISTANCIA_PRESENCA 50.0

#define TEMPERATURA_ABRIR  26.0
#define TEMPERATURA_FECHAR 23.0

#define RESISTOR_FIXO 10000.0
#define RESISTOR_NTC  10000.0
#define BETA          3950.0
#define TEMP_25K      298.15

#define INTERVALO_ENVIO 1000

// Movimento do servo
#define INTERVALO_SERVO 15
#define PASSO_SERVO 2

// =================================
// COMPONENTES E ESTADOS
// =================================

Servo servo;

bool presenca = false;
bool temperaturaAlta = false;
bool ventilacao = false;

int anguloServo = 0;
int direcaoServo = 1;

unsigned long ultimoEnvio = 0;
unsigned long ultimoMovimentoServo = 0;

// =================================
// CONTROLE DA TEMPERATURA
// =================================

void controlarVentilacao(float temperatura) {

  if (temperatura == -999) {
    temperaturaAlta = false;
    ventilacao = false;
    return;
  }

  if (temperatura >= TEMPERATURA_ABRIR) {
    temperaturaAlta = true;
  }
  else if (temperatura <= TEMPERATURA_FECHAR) {
    temperaturaAlta = false;
  }

  // Precisa ter presença E temperatura alta
  ventilacao = presenca && temperaturaAlta;
}

// =================================
// MOVIMENTO DO SERVO
// =================================

void movimentarServo() {

  if (ventilacao) {

    if (millis() - ultimoMovimentoServo >= INTERVALO_SERVO) {

      ultimoMovimentoServo = millis();

      anguloServo += PASSO_SERVO * direcaoServo;

      if (anguloServo >= 180) {
        anguloServo = 180;
        direcaoServo = -1;
      }

      if (anguloServo <= 0) {
        anguloServo = 0;
        direcaoServo = 1;
      }

      servo.write(anguloServo);
    }

  } else {

    anguloServo = 0;
    direcaoServo = 1;

    servo.write(0);
  }
}

// =================================
// CONFIGURACAO INICIAL
// =================================

void setup() {

  pinMode(PINO_TRIG, OUTPUT);
  pinMode(PINO_ECHO, INPUT);
  pinMode(PINO_LED, OUTPUT);

  servo.attach(PINO_SERVO);
  servo.write(0);

  Serial.begin(9600);
}

// =================================
// LEITURA DO SENSOR ULTRASSONICO
// =================================

float lerDistancia() {

  digitalWrite(PINO_TRIG, LOW);
  delayMicroseconds(2);

  digitalWrite(PINO_TRIG, HIGH);
  delayMicroseconds(10);

  digitalWrite(PINO_TRIG, LOW);

  unsigned long duracao =
    pulseIn(PINO_ECHO, HIGH, 30000);

  if (duracao == 0) {
    return -1;
  }

  return duracao * 0.0343 / 2.0;
}

// =================================
// LEITURA DO SENSOR NTC
// =================================

float lerTemperatura() {

  int leitura = analogRead(PINO_NTC);

  if (leitura <= 0 || leitura >= 1023) {
    return -999;
  }

  float resistenciaNTC =
    RESISTOR_FIXO * (1023.0 / leitura - 1.0);

  float temperaturaK =
    1.0 / (
      (1.0 / TEMP_25K) +
      (log(resistenciaNTC / RESISTOR_NTC) / BETA)
    );

  return temperaturaK - 273.15;
}

// =================================
// LOOP PRINCIPAL
// =================================

void loop() {

  float distancia = lerDistancia();
  float temperatura = lerTemperatura();

  // Detecta presença
  if (distancia > 0 &&
      distancia <= DISTANCIA_PRESENCA) {

    presenca = true;
  }
  else {
    presenca = false;
  }

  // Controla LED
  digitalWrite(
    PINO_LED,
    presenca ? HIGH : LOW
  );

  // Controla ventilação
  controlarVentilacao(temperatura);

  // Movimenta servo sem usar delay
  movimentarServo();

  // Envia dados para o Raspberry Pi
  if (millis() - ultimoEnvio >= INTERVALO_ENVIO) {

    ultimoEnvio = millis();

    Serial.print("DADOS,");

    Serial.print(distancia);
    Serial.print(",");

    Serial.print(temperatura);
    Serial.print(",");

    Serial.print(presenca);
    Serial.print(",");

    Serial.print(digitalRead(PINO_LED));
    Serial.print(",");

    Serial.println(ventilacao);
  }
}
