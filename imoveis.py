import pandas as pd
import pickle as pk
import json
from sklearn.preprocessing import LabelEncoder, PolynomialFeatures, MinMaxScaler
listing = pd.read_csv('listings.csv')
calendar = pd.read_csv('calendar.csv.gz')
print(calendar['adjusted_price'].isna().sum())
print(f"Features do listing: {listing.columns}")

print(f"Features do calendar: {calendar.shape}")
calendar['available'] = calendar['available'].map({'t': 1, 'f': 0})

# 2️⃣ Remover símbolos de moeda e converter colunas de preço em numéricas
# (isso é comum nas bases estilo InsideAirbnb)
calendar['price'] = calendar['price'].replace('[\$,]', '', regex=True).astype(float)
calendar['adjusted_price'] = calendar['adjusted_price'].replace('[\$,]', '', regex=True).astype(float)

# 3️⃣ Substituir valores NaN em adjusted_price pelos valores correspondentes de price
calendar['adjusted_price'] = calendar['adjusted_price'].fillna(calendar['price'])
precos = listing[[
     'room_type', 'accommodates',
    'bedrooms', 'bathrooms', 'beds',
    'neighbourhood_cleansed', 'id'
]].merge(
    calendar[['date', 'adjusted_price', 'available','listing_id']],
    how='left',
    left_on='id',
    right_on='listing_id'
)
print(precos['room_type'].value_counts())
precos = precos.sort_values(by='date').reset_index(drop=True)
precos['date'] = pd.to_datetime(precos['date'], format='%Y-%m-%d', errors='coerce')

# 2️⃣ Remover registros do ano de 2026
precos = precos[precos['date'].dt.year < 2026]
available_per_day = precos.groupby('date')['available'].sum().sort_index()

# 3️⃣ Calcular a média móvel de 14 dias
rolling_available = available_per_day.rolling(window=14, min_periods=1).mean()

# 4️⃣ Classificar as janelas em baixa/média/alta temporada
# Quanto mais imóveis disponíveis → menor demanda → baixa temporada
# Usamos tercis (quantis 33% e 66%) para classificar dinamicamente

low_threshold = rolling_available.quantile(0.66)   # 66% mais altos = baixa temporada
high_threshold = rolling_available.quantile(0.33)  # 33% mais baixos = alta temporada

def classify_season(value):
    if value >= low_threshold:
        return 0  # baixa temporada
    elif value >= high_threshold:
        return 1  # média temporada
    else:
        return 2  # alta temporada

season_series = rolling_available.apply(classify_season)
season_dict = {
    date.strftime('%Y-%m-%d'): int(label)
    for date, label in season_series.items()
}

# 7️⃣ Salvar como arquivo JSON
with open('classificacao_temporada.json', 'w', encoding='utf-8') as f:
    json.dump(season_dict, f, ensure_ascii=False, indent=4)


# 5️⃣ Adicionar a classificação de temporada ao DataFrame original
precos = precos.merge(season_series.rename('ocupation'), on='date', how='left')
# 3️⃣ Converter data em variável numérica contínua
# A forma mais comum é transformar em número de dias desde uma data base (ex.: 1970-01-01)
precos['date_numeric'] = (precos['date'] - pd.Timestamp("1970-01-01")).dt.days
# === 5. Substituir a coluna antiga (opcional) ===
precos_sample = precos
label_encoders = {}
for col in precos_sample.columns:
    if precos_sample[col].dtype == 'object':
        le = LabelEncoder()
        precos_sample[col] = le.fit_transform(precos_sample[col].astype(str))
        label_encoders[col] = le  # guarda o encoder, útil para novos dados futuramente
with open("labels.pkl", "wb") as arquivo:
    pk.dump(label_encoders, arquivo)
import numpy as np
# Preencher bedrooms, bathrooms e beds com base em accommodates
precos_sample['bedrooms'] = precos_sample['bedrooms'].fillna(np.ceil(precos_sample['accommodates'] / 2))
precos_sample['bathrooms'] = precos_sample['bathrooms'].fillna(np.ceil(precos_sample['accommodates'] / 3))
precos_sample['beds'] = precos_sample['beds'].fillna(precos_sample['accommodates'])

# Garantir que sejam numéricos
precos_sample[['bedrooms', 'bathrooms', 'beds']] = precos_sample[['bedrooms', 'bathrooms', 'beds']].apply(pd.to_numeric, errors='coerce')

# Caso ainda haja NaN (por falhas residuais), preencher com mediana
precos_sample['bedrooms'].fillna(precos_sample['bedrooms'].median(), inplace=True)
precos_sample['bathrooms'].fillna(precos_sample['bathrooms'].median(), inplace=True)
precos_sample['beds'].fillna(precos_sample['beds'].median(), inplace=True)
print(precos_sample.isna().sum())
# === 3️⃣ Garantir que todas as colunas sejam numéricas ===
precos_sample = precos_sample.drop(columns=['available','date'],axis=1)
precos_sample.to_csv('dynamic_prices.csv',index=False)



