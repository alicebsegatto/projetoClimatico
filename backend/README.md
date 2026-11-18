## backend/banco.py
- Persistência em SQLite usando o módulo sqlite3 puro da biblioteca padrão do Python (sem ORM, sem Redis)
------------------------------------------------------------

### Schema da tabela "leituras":
- id           -> número sequencial, chave primária
-  data_hora    -> texto "AAAA-MM-DD HH:MM:SS" do momento da leitura
-  distancia    -> REAL, distância em cm
- temperatura  -> REAL, temperatura em °C
-   presenca     -> INTEGER, 0 ou 1
-   led          -> INTEGER, 0 ou 1
-   ventilacao   -> INTEGER, 0 ou 1
-------------------------------------------------------------
## backend/main.py
Aplicação FastAPI do EcoSense.

A Raspberry Pi (main.py na raiz, com pyserial) lê o Arduino pela serial e envia cada leitura para a rota POST /leituras deste backend via HTTP. Este backend grava no SQLite e serve os dados
para o frontend (HTML/CSS/JS puro).

## Executar a partir da RAIZ do projeto:
uvicorn backend.main:app --host 0.0.0.0 --port 8000

-------------------------------------------------------------
## backend/models.py
#### Modelos Pydantic do EcoSense.
O que é um modelo Pydantic?
- O Pydantic é uma biblioteca de validação de dados. Uma classe que herda de BaseModel descreve a "forma" de um dado que entra ou sai da API: nome e tipo de cada campo.

Por que validar os dados na entrada?
- A Raspberry Pi envia as leituras por HTTP POST em formato JSON. Se chegasse um valor inválido (por exemplo, temperatura como texto ou um campo faltando), o erro só apareceria mais tarde, ao gravar no banco. Com o Pydantic, o FastAPI valida o JSON automaticamente antes de executar a rota: se estiver errado, ele já devolve um erro 422 com a descrição do problema, e a rota recebe um objeto Python pronto e com os tipos corretos (distancia vira float etc.).
-----------------------------------------------------------