import sqlite3
from datetime import datetime

# Caminho do arquivo do banco. Como o uvicorn é executado a partir da RAIZ do projeto, 
#o caminho relativo "backend/ecosense.db" funciona.
CAMINHO_BANCO = "backend/ecosense.db"


def criar_tabela():
    """Cria a tabela leituras, se ela ainda não existir.

    É chamada no evento de startup da aplicação, assim o banco
    fica pronto antes de receber a primeira requisição.
    """
    with sqlite3.connect(CAMINHO_BANCO) as conexao:
        cursor = conexao.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leituras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_hora TEXT,
                distancia REAL,
                temperatura REAL,
                presenca INTEGER,
                led INTEGER,
                ventilacao INTEGER
            )
        """)
        conexao.commit()


def salvar_leitura(leitura):
    """Insere uma leitura (modelo Pydantic) no banco.

    Retorna o id gerado pelo AUTOINCREMENT (cursor.lastrowid),
    para que a API possa confirmar à Raspberry qual registro foi
    gravado.
    """
    data_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with sqlite3.connect(CAMINHO_BANCO) as conexao:
        cursor = conexao.cursor()
        cursor.execute(
            """
            INSERT INTO leituras
                (data_hora, distancia, temperatura, presenca, led, ventilacao)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                data_hora,
                leitura.distancia,
                leitura.temperatura,
                leitura.presenca,
                leitura.led,
                leitura.ventilacao,
            ),
        )
        conexao.commit()
        return cursor.lastrowid


def _linha_para_dicionario(linha):
    """Converte uma tupla do sqlite3 em dicionário legível.

    Ordem das colunas: id, data_hora, distancia, temperatura,
    presenca, led, ventilacao.
    """
    chaves = ["id", "data_hora", "distancia", "temperatura",
            "presenca", "led", "ventilacao"]
    return dict(zip(chaves, linha))


def buscar_ultimas(limite=50):
    """Retorna as N leituras mais recentes (ORDER BY id DESC).

    Usamos ORDER BY id DESC porque o id cresce com o tempo: as
    primeiras linhas do resultado são as mais novas. O LIMIT
    controla quantas leituras vêm na resposta.
    """
    with sqlite3.connect(CAMINHO_BANCO) as conexao:
        cursor = conexao.cursor()
        cursor.execute(
            "SELECT * FROM leituras ORDER BY id DESC LIMIT ?", (limite,)
        )
        return [_linha_para_dicionario(linha) for linha in cursor.fetchall()]


def buscar_ultima():
    """Retorna apenas a leitura mais recente, ou None se não houver."""
    with sqlite3.connect(CAMINHO_BANCO) as conexao:
        cursor = conexao.cursor()
        cursor.execute("SELECT * FROM leituras ORDER BY id DESC LIMIT 1")
        linha = cursor.fetchone()
        if linha is None:
            return None
        return _linha_para_dicionario(linha)


def calcular_estatisticas():
    """Calcula resumo estatístico das leituras com funções SQL.

    Uso de AVG/MAX/MIN: deixamos o banco fazer o cálculo em C,
    que é mais rápido do que trazer todas as linhas para o Python.
    ROUND arredonda as médias para 2 casas decimais.
    Percentuais: (soma dos 1s / total) * 100.
    Se a tabela estiver vazia, devolvemos tudo zerado para o
    frontend poder exibir "sem dados" sem quebrar.
    """
    with sqlite3.connect(CAMINHO_BANCO) as conexao:
        cursor = conexao.cursor()
        cursor.execute(
            """
            SELECT
                COUNT(*),
                ROUND(AVG(temperatura), 2),
                ROUND(MAX(temperatura), 2),
                ROUND(MIN(temperatura), 2),
                ROUND(100.0 * AVG(presenca), 1),
                ROUND(100.0 * AVG(led), 1),
                ROUND(100.0 * AVG(ventilacao), 1)
            FROM leituras
            """
        )
        total, media, maxima, minima, p_pres, p_led, p_vent = cursor.fetchone()

    if total == 0:
        # Tabela vazia: média/max/min seriam NULL no SQL, então retornamos zeros.
        return {
            "total": 0,
            "temperatura_media": 0.0,
            "temperatura_maxima": 0.0,
            "temperatura_minima": 0.0,
            "percentual_presenca": 0.0,
            "percentual_led": 0.0,
            "percentual_ventilacao": 0.0,
        }

    return {
        "total": total,
        "temperatura_media": media,
        "temperatura_maxima": maxima,
        "temperatura_minima": minima,
        "percentual_presenca": p_pres,
        "percentual_led": p_led,
        "percentual_ventilacao": p_vent,
    }


def apagar_tudo():
    """Apaga todas as linhas da tabela leituras."""
    with sqlite3.connect(CAMINHO_BANCO) as conexao:
        cursor = conexao.cursor()
        cursor.execute("DELETE FROM leituras")
        conexao.commit()
