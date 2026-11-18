from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import banco, models

app = FastAPI(
    title="EcoSense API",
    description="API de monitoramento da sala eficiente em energia",
    version="1.0.0",
)

# CORS: liberamos requisições de qualquer origem.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def ao_iniciar():
    """Evento de startup: garante que a tabela exista no banco."""
    banco.criar_tabela()


@app.get("/")
def raiz():
    """Mensagem de boas-vindas e link para a documentação."""
    return {
        "mensagem": "Bem-vindo à API do EcoSense!",
        "documentacao": "/docs",
    }


@app.get("/health")
def health():
    """Verificação simples de que a API está de pé.

    O frontend usa esta rota para saber se o backend respondeu.
    """
    return {"status": "online"}


@app.post("/leituras", response_model=models.Resposta)
def receber_leitura(leitura: models.Leitura):
    """Recebe uma leitura da Raspberry Pi e grava no SQLite.

    Esta é a rota que o main.py da Raspberry chama a cada ciclo de
    leitura da serial. O parâmetro `leitura` é validado
    automaticamente pelo Pydantic: se o JSON vier inválido, o
    FastAPI responde 422 sem sequer executar esta função.
    """
    id_inserido = banco.salvar_leitura(leitura)
    return models.Resposta(
        mensagem="Leitura registrada com sucesso!",
        id=id_inserido,
    )


@app.get("/leituras")
def listar_leituras(limite: int = 50):
    """Lista as últimas leituras (padrão: 50).

    O query param `limite` permite pedir mais ou menos histórico:
    GET /leituras?limite=100
    """
    return banco.buscar_ultimas(limite)


@app.get("/leituras/ultima")
def ultima_leitura():
    """Retorna a leitura mais recente, ou um aviso se não houver dados.

    O frontend consulta esta rota em intervalos curtos para
    atualizar o painel em tempo quase real.
    """
    leitura = banco.buscar_ultima()
    if leitura is None:
        return {"mensagem": "Nenhuma leitura registrada ainda."}
    return leitura


@app.get("/estatisticas")
def estatisticas():
    """Retorna o resumo estatístico (total, médias, percentuais)."""
    return banco.calcular_estatisticas()


@app.delete("/leituras")
def apagar_leituras():
    """Apaga TODAS as leituras do banco.

    Útil para reiniciar os testes antes da apresentação: limpa o
    histórico e volta a começar do zero.
    """
    banco.apagar_tudo()
    return {"mensagem": "Todas as leituras foram apagadas."}
