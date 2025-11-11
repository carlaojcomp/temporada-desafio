# Importações (Fase 3.1)
from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import json,  os
from datetime import datetime
DATA = {}
try:
    MODEL = joblib.load('regressor_preco.pkl')
    LABELS = joblib.load('labels.pkl')
    print(LABELS.keys())
    with open('classificacao_temporada.json', 'r') as f:
        DATA = json.load(f)
except FileNotFoundError:
    print("Erro: Arquivos do modelo e/ou labels.pkl não encontrados.")
    MODEL, LABELS = None, None

app = Flask(__name__)


def preprocess_data(data):
    global LABELS, DATA

    input_date_str = data.get('data')

    if not input_date_str:
        raise ValueError("A chave 'data' está faltando no JSON de entrada.")

    # 1. Converte a data de entrada para um objeto datetime
    try:
        date_obj = datetime.strptime(input_date_str, '%Y-%m-%d')
    except ValueError:
        raise ValueError("O formato da data deve ser yyyy-mm-dd.")

    # 2. **Normalização do Ano para 2025 (Ex: 2027-02-15 -> 2025-02-15)**
    normalized_date_obj = date_obj.replace(year=2025)

    # Converte o objeto de volta para string para lookup (chave no formato 'yyyy-mm-dd')
    normalized_date_str = normalized_date_obj.strftime('%Y-%m-%d')

    # 3. **Preenchimento da Feature 'ocupation'**
    # Busca o valor no JSON usando a data normalizada como chave
    occupation_value = DATA.get(normalized_date_str)

    if occupation_value is None:
        # A data normalizada não foi encontrada no seu arquivo JSON.
        # É crucial que todas as datas necessárias para 2025 estejam no JSON.
        raise KeyError(
            f"Data de ocupação {normalized_date_str} não encontrada no JSON de ocupação. Verifique o arquivo.")
    else:
        # Atribui o valor encontrado no JSON à feature 'ocupation'
        data['ocupation'] = occupation_value
    # 1. Converte o dicionário de entrada em DataFrame (garantindo a ordem das colunas)

    base_date = datetime(1970, 1, 1)
    data['date_numeric'] = (normalized_date_obj - base_date).days

    # 5. Prepara o DataFrame para o modelo (Remove 'data', que é apenas um auxiliar)
    input_features = data.copy()
    input_features.pop('data')

    # Define a ordem das colunas FINAL que seu modelo espera
    feature_order = ['room_type', 'accommodates', 'bedrooms', 'bathrooms', 'beds',
                     'neighbourhood_cleansed', 'ocupation', 'date_numeric']

    # Converte o dicionário das features finais em um DataFrame, garantindo a ordem
    df = pd.DataFrame([input_features], columns=feature_order)

    # 2. Mapeamento dos categóricos (usando o objeto LABELS carregado)
    # Exemplo: Se LABELS for um dicionário de mapeamentos:
    try:
        df['room_type'] = LABELS['room_type'].transform(df['room_type'])
        df['neighbourhood_cleansed'] = LABELS['neighbourhood_cleansed'].transform(df['neighbourhood_cleansed'])
    except Exception as e:
        raise ValueError(f"Erro ao transformar rótulos categóricos: {str(e)}")

    # 3. Tratamento de valores desconhecidos (ex: preencher com -1 ou NaN se necessário)
    # ...

    # 4. Retorna como array numpy
    return df.values


# ----------------------------------------------------
# Endpoint (Fase 3.2 e 3.3)
# ----------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    if not MODEL or not LABELS:
        return jsonify({"error": "Recursos do modelo não carregados."}), 500

    data = request.get_json(force=True)

    # 1. Validação simples dos dados de entrada
    required_keys = ['room_type', 'accommodates', 'bedrooms', 'bathrooms', 'beds',
                     'neighbourhood_cleansed', 'data']

    if not all(k in data for k in required_keys):
        return jsonify({"error": "Dados de entrada inválidos ou incompletos."}), 400
    frase = " "

    try:
        # 2. Pré-processamento
        processed_data = preprocess_data(data)
        dado = processed_data[0][6]
        if dado == 0:
            frase = "Baixa Temporada"
        elif dado == 1:
            frase = "Média Temporada"
        else:
            frase = "Alta Temporada"
        # 3. Predição
        prediction = MODEL.predict(processed_data)

        # 4. Retorna a predição (com .tolist() ou .item() para garantir serialização JSON)
        preco = round(abs(float(prediction.item())), 2)

        # Retorno JSON formatado
        return jsonify({"Preço da diária ($)": preco,
                        "Ocupação": frase}), 200

    except Exception as e:
        # 5. Tratamento de erros de processamento ou predição
        return jsonify({"error": f"Erro interno ao processar a requisição: {str(e)}"}), 500


if __name__ == '__main__':
    # 6. Execução (Fase 4.1)
    app.run(debug=True)
