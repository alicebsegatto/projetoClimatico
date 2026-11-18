import serial
import requests


# Porta serial onde o Arduino está conectado
PORTA_SERIAL = "/dev/ttyACM0"
# Velocidade de comunicação 
VELOCIDADE_SERIAL = 9600
# Trocar localhost pelo IP da Raspberry se o backend estiver em outra máquina.
URL_BACKEND = "http://localhost:8000/leituras"


def interpretar_linha(linha):
    """Recebe a string lida da serial e transforma em dicionário.

    Formato esperado: DADOS,<distancia>,<temperatura>,<presenca>,<led>,<ventilacao>
    Exemplo: DADOS,87.5,24.30,1,1,0
    Retorna None se a linha for inválida.
    """
  
    if not linha.startswith("DADOS"):
        return None

    try:
        # Divide a linha pelas vírgulas
        partes = linha.split(",")
        # Confere se tem exatamente 6 partes: o prefixo + 5 valores
        if len(partes) != 6:
            return None
        # Converte os valores nos tipos corretos
        dados = {
            "distancia": float(partes[1]),
            "temperatura": float(partes[2]),
            "presenca": int(partes[3]),
            "led": int(partes[4]),
            "ventilacao": int(partes[5]),
        }
        return dados
    except ValueError:
        # Algum valor não era número: linha corrompida, descartamos
        return None


def enviar_para_backend(dados):
    """Envia a leitura ao backend via HTTP POST, sem derrubar o programa."""
    try:
        # timeout=2: não travar se o backend cair — no máximo esperamos 2 s
        resposta = requests.post(URL_BACKEND, json=dados, timeout=2)
        if resposta.status_code == 200:
            # Confirmação no terminal com os valores enviados
            print("Leitura enviada:", dados)
        else:
            print("Backend respondeu com status:", resposta.status_code)
    except requests.exceptions.RequestException:
        # Erro de conexão/timeout, avisamos e seguimos o programa
        print("Erro: não foi possível falar com o backend.")


def principal():
    """Função principal: abre a serial e roda o laço de leitura."""
    try:
        # Abre a porta serial com timeout de leitura de 2 segundos
        conexao = serial.Serial(PORTA_SERIAL, VELOCIDADE_SERIAL, timeout=2)
    except serial.SerialException:
        # Mensagem clara caso a porta não exista ou esteja ocupada
        print("Erro: não foi possível abrir a porta serial", PORTA_SERIAL)
        print("Confira se o Arduino está conectado e se a porta está correta.")
        return

    print("EcoSense conectado! Lendo dados do Arduino...")

    try:
        while True:
            # Lê uma linha, decodifica ignorando erros e remove espaços
            linha = conexao.readline().decode("utf-8", errors="ignore").strip()
            # Se a linha veio vazia, volta ao início do laço
            if not linha:
                continue
            # Tenta transformar a linha em dados válidos
            dados = interpretar_linha(linha)
            if dados is not None:
                # Mostra no terminal e envia ao backend
                print("Recebido:", dados)
                enviar_para_backend(dados)
    except KeyboardInterrupt:
        print("Encerrando...")
    finally:
        # Fecha a serial em qualquer caso de saída
        conexao.close()
        print("Porta serial fechada.")


# Só executa a função principal quando o arquivo é rodado diretamente
if __name__ == "__main__":
    principal()
