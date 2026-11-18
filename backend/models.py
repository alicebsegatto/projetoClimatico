from pydantic import BaseModel


class Leitura(BaseModel):
    """Representa uma leitura enviada pela Raspberry Pi.

    O Arduino mede a distância e a temperatura; a lógica na
    Raspberry decide o estado do LED e da ventilação e se há
    presença detectada. Tudo chega aqui como JSON.
    """
    distancia: float      # distância medida pelo sensor ultrassônico (cm)
    temperatura: float    # temperatura medida pelo sensor (°C)
    presenca: int         # 1 = alguém na sala, 0 = sala vazia
    led: int              # 1 = LED aceso, 0 = apagado
    ventilacao: int       # 1 = ventilação ligada, 0 = desligada


class Resposta(BaseModel):
    """Resposta padrão de confirmação das rotas de escrita."""
    mensagem: str         # texto explicando o resultado da operação
    id: int               # id da leitura gravada no banco (ou 0)
