# 🏠 Plataforma de Previsão de Preço Dinâmico e Ocupação

Este repositório contém uma aplicação voltada para o **mercado imobiliário de aluguel por temporada**, permitindo que, a partir do cadastro de um imóvel, sejam realizadas **previsões automáticas de preço dinâmico e taxa de ocupação**.  

A aplicação foi desenvolvida com o objetivo de automatizar a análise de dados e a comunicação entre o sistema e os usuários (proprietários e equipe de captação).

---

## 🚀 Estrutura do Projeto

A aplicação principal está contida na pasta [`App`](./App), e é composta por diferentes módulos integrados:

- **Interface (App)**:  
  Responsável pelo login, seleção de painel e cadastro de imóveis.  
  Ao adicionar um imóvel, o sistema abre o arquivo `automacao.json` para configurar a automação de envio.

- **API (`precoAPI.py`)**:  
  Responsável por receber as requisições HTTP do aplicativo e processar os dados enviados pelo formulário.  
  Essa API se comunica com o módulo de predição.

- **Módulo de Predição (`previsorPrecos.py`)**:  
  Realiza as consultas e cálculos de **preço dinâmico** e **previsão de ocupação**, com base nos dados históricos e características dos imóveis.

- **Automação de E-mails**:  
  Após a previsão, o sistema envia automaticamente:
  - Um e-mail para o **time de captação**, notificando o novo imóvel e suas previsões.  
  - Um e-mail para o **proprietário**, contendo o preço ajustado e a taxa de ocupação estimada.

---

## ⚙️ Fluxo de Funcionamento

1. O usuário faz **login** no aplicativo.
2. Seleciona o **painel** e clica em **“Adicionar Imóvel”**.
3. O sistema abre o arquivo `automacao.json`.
4. O formulário é preenchido com as informações do imóvel.
5. Ao enviar, é feito um **HTTP Request** para a API (`precoAPI.py`).
6. A API chama o **modelo de predição** (`previsorPrecos.py`) para calcular:
   - **Preço dinâmico**.
   - **Taxa de ocupação**.
7. Os resultados são enviados por e-mail:
   - Para o **time de captação**.
   - Para o **proprietário**.

---

## 🧠 Bases de Dados Utilizadas

As predições são baseadas em dados reais de imóveis e calendários de disponibilidade.  
Os arquivos de dados podem ser acessados nos links abaixo:

- **Listings:** [📄 Download aqui](https://drive.google.com/file/d/1-u-IpSv2ASdtdHdE-R8EoVKm9QIj-ZJa/view?usp=drive_link)  
- **Calendar:** [📅 Download aqui](https://drive.google.com/file/d/1H8jTwhnWEmSjvhl6rnQBVmqB9J5cRylY/view?usp=drive_link)  
- **Dynamic Prices:** [💰 Download aqui](https://drive.google.com/file/d/13ZotCq7ZJNtadJVQ6lsNHDKfht1Ief18/view?usp=drive_link)

---

## 🎥 Demonstração em Vídeo

Assista ao vídeo demonstrativo do funcionamento completo da aplicação:  
[▶️ **Ver demonstração no Google Drive**](https://drive.google.com/file/d/1zVOwBj3AQY9RE9G_mh0Q4R_fSujk-nGv/view?usp=drive_link)

---

## 🧩 Tecnologias Utilizadas

- **Python 3.11+**
- **Flask** (para API REST)
- **Pandas / NumPy** (para manipulação e análise de dados)
- **Scikit-learn** (para modelos de machine learning)
- **smtplib / email** (para envio automático de e-mails)
- **JSON** (para automação e comunicação entre módulos)

---

## 📬 Contato

Para dúvidas, sugestões ou contribuições, entre em contato com o desenvolvedor responsável.  
📧 **E-mail:** [adicione seu e-mail aqui]  
🌐 **GitHub:** [carlaojcomp](https://github.com/carlaojcomp)

---

**© 2025 - Plataforma de Preço Dinâmico e Ocupação**  
Desenvolvido com 💡 e Python.

Link para o App: https://season-pilot-lite.lovable.app/