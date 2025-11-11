import pandas as pd
import joblib
import xgboost as xgb
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, SGDRegressor
import numpy as np
# ----------------------------------------------------
# Supondo que o DataFrame 'precos' já tenha sido criado
# e contenha a coluna 'price' (alvo) e as features explicativas
# ----------------------------------------------------
# Exemplo: precos.head()
#    accommodates  number_of_reviews  month  weekday  price
# 0             2                 15      3        4  120.0
# 1             4                 27      3        5  150.0
# ...

# 🔹 Separando as variáveis independentes (X) e dependente (y)
print("Oi")
precos = pd.read_csv('dynamic_prices.csv',low_memory=False)
X = precos.drop(columns=['adjusted_price','id','listing_id'])
print(X.columns)
y = np.log1p(precos['adjusted_price'])

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

model = SGDRegressor(
    loss='squared_error',
    max_iter=2000,         # Número de épocas
    eta0=0.01,             # Taxa de aprendizado inicial (learning rate)
    random_state=42,
    tol=1e-3               # Critério de parada
)
model.fit(X_scaled, y)
#Salvando modelo
joblib.dump(model, 'regressor_preco.pkl')
# 🔹 Fazendo predições
y_pred = model.predict(X_scaled)
y_pred = np.trunc(y_pred * 1000) / 1000
print(np.round(np.expm1(y_pred),2))
print(np.expm1(y))
# 🔹 Avaliação do modelo
mse = np.sqrt(mean_squared_error(np.expm1(y), np.expm1(y_pred)))
r2 = r2_score(np.expm1(y), np.expm1(y_pred))

print("✅ Modelo de Regressão Polinomial (grau 3) treinado com sucesso!")
print(f"Raiz Erro Quadrático Médio (RMSE): {mse:.4f}")
print(f"Coeficiente de Determinação (R²): {r2:.4f}")




