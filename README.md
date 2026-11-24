
# EcoSense – Sala Eficiente

## Sobre o projeto

O EcoSense é um sistema de monitoramento e automação de salas de aula, desenvolvido para reduzir o desperdício de energia elétrica. Utiliza sensores para identificar a presença de pessoas e medir a temperatura do ambiente, controlando automaticamente a iluminação e a ventilação.

O Arduino realiza as leituras dos sensores e controla os componentes. Os dados são enviados para uma Raspberry Pi, que os encaminha para uma API desenvolvida em Python com FastAPI. As informações são armazenadas em um banco SQLite e disponibilizadas em um painel web.

## Materiais necessários

- Arduino;
- Raspberry Pi;
- Sensor ultrassônico HC-SR04;
- Termistor NTC de 10 kΩ;
- Resistor de 10 kΩ;
- LED e resistor;
- Servo motor SG90;
- Protoboard e jumpers;
- Cabo USB.

## Montagem

Realize as conexões dos componentes no Arduino:

| Componente | Pino |
|---|---|
| HC-SR04 – TRIG | Digital 4 |
| HC-SR04 – ECHO | Digital 5 |
| Termistor NTC | Analógico A0 |
| LED | Digital 3 |
| Servo motor | Digital 9 |

O termistor deve ser conectado junto ao resistor de 10 kΩ, formando um divisor de tensão.

Conecte o Arduino à Raspberry Pi utilizando um cabo USB para permitir a comunicação serial.

## Instalação e execução

### 1. Clonar o repositório

```bash
git clone https://github.com/alicebsegatto/projetoClimatico.git
cd projetoClimatico
```

### 2. Configurar o Arduino

Abra o arquivo `arduino/ecosense.ino` na Arduino IDE, conecte a placa ao computador e envie o código.

### 3. Instalar as dependências

Crie um ambiente virtual:

```bash
python -m venv venv
```

Ative o ambiente e instale as dependências:

```bash
pip install -r backend/requirements.txt
```

### 4. Executar o backend

Na raiz do projeto, execute:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 5. Executar a Raspberry Pi

Com o Arduino conectado e o backend em execução, execute na raiz do projeto:

```bash
python main.py
```

### 6. Executar o frontend

Entre na pasta `frontend` e inicie o servidor:

```bash
cd frontend
python -m http.server 5500
```

Acesse pelo navegador:

http://localhost:5500

## Funcionamento

O sistema identifica a presença de pessoas em até 50 cm. Quando alguém é detectado, o LED é ligado. A ventilação é acionada quando há presença e a temperatura atinge 26 °C ou mais, sendo desligada quando a temperatura chega a 23 °C ou menos, ou quando não há presença.

As leituras são enviadas à Raspberry Pi, armazenadas no banco de dados e apresentadas no painel web.

## Integrantes

- Alice Bohnen Segatto
- Aline Hoffmann Passamani
- Ana Luisa da Silva Amaral
- Thaise Chaves Zanin
- Pedro Bohnen Segatto
