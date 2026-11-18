# =========================================================
# simulador.py
# Envia leituras FALSAS para o backend, a cada 1 segundo.
# Serve para testar backend + painel sem Arduino e sem Raspberry.
# Uso: python simulador.py   (Ctrl+C para parar)
# =========================================================
import random
import time

import requests

URL_BACKEND = "http://localhost:8000/leituras"

temperatura = 25.0
print("Simulador iniciado. Enviando para", URL_BACKEND)

while True:
    # A temperatura sobe e desce aos poucos, como num sensor de verdade.
    temperatura += random.uniform(-0.4, 0.45)
    temperatura = max(22.0, min(29.0, temperatura))

    presenca = 1 if random.random() > 0.2 else 0      # 80% do tempo tem gente
    ventilacao = 1 if (presenca and temperatura > 26) else 0

    leitura = {
        "distancia": round(random.uniform(40, 150), 1) if presenca else -1,
        "temperatura": round(temperatura, 2),
        "presenca": presenca,
        "led": presenca,
        "ventilacao": ventilacao,
    }

    try:
        resposta = requests.post(URL_BACKEND, json=leitura, timeout=3)
        print(resposta.status_code, leitura)
    except requests.RequestException:
        print("Backend fora do ar. Ele está rodando?")

    time.sleep(1)
