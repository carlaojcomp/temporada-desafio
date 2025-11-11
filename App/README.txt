# TEMPORADA LITE - Documentação Técnica

## 📋 Visão Geral
Temporada Lite é uma plataforma de gestão de aluguel por temporada projetada para proprietários e imobiliárias. 
O sistema oferece precificação dinâmica, análise de ocupação e integrações com n8n para automações.

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Lovable Cloud (Supabase)
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Automação**: n8n (webhooks)

### Estrutura do Banco de Dados

#### Tabelas Principais:

1. **imobiliarias**
   - id (UUID, PK)
   - nome, email, telefone, cnpj
   - ativa (boolean)
   - created_at, updated_at

2. **profiles**
   - id (UUID, FK -> auth.users)
   - nome, email, telefone
   - imobiliaria_id (FK -> imobiliarias)
   - created_at, updated_at

3. **user_roles**
   - id (UUID, PK)
   - user_id (FK -> auth.users)
   - role (enum: 'admin', 'imobiliaria', 'proprietario')
   - UNIQUE(user_id, role)

4. **imoveis**
   - id (UUID, PK)
   - proprietario_id (FK -> profiles)
   - imobiliaria_id (FK -> imobiliarias)
   - titulo, descricao
   - tipo (enum: 'apartamento', 'casa', 'studio', 'cobertura', 'chalé')
   - bairro, cidade, estado, endereco_completo
   - quartos, banheiros, capacidade
   - preco_base (decimal)
   - imagens (JSONB)
   - amenidades (JSONB)
   - ativo (boolean)
   - created_at, updated_at

5. **reservas**
   - id (UUID, PK)
   - imovel_id (FK -> imoveis)
   - data_inicio, data_fim
   - preco_total (decimal)
   - hospede_nome, hospede_email, hospede_telefone
   - status (enum: 'pendente', 'confirmada', 'cancelada', 'concluida')
   - created_at, updated_at

6. **eventos_locais**
   - id (UUID, PK)
   - nome, descricao
   - data_inicio, data_fim
   - bairro
   - impacto_preco (decimal - multiplicador de preço)
   - created_at

### Segurança (RLS Policies)

**Sistema de Roles**: Utiliza função `has_role()` com SECURITY DEFINER para evitar recursão RLS.

**Políticas Implementadas**:
- Proprietários: acesso total aos seus imóveis
- Imobiliárias: acesso aos imóveis de seus proprietários vinculados
- Admins: acesso total ao sistema
- Público: visualização apenas de imóveis ativos

**Funções de Segurança**:
```sql
has_role(_user_id UUID, _role app_role) -> BOOLEAN
user_imobiliaria_id(_user_id UUID) -> UUID
```

## 🚀 Setup Local

### Pré-requisitos
- Node.js 18+ e npm
- Conta no Lovable (cloud backend ativo)

### Instalação

1. Clone o repositório:
```bash
git clone <YOUR_GIT_URL>
cd temporada-lite
```

2. Instale dependências:
```bash
npm install
```

3. As variáveis de ambiente são auto-configuradas pelo Lovable Cloud:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
   - VITE_SUPABASE_PROJECT_ID

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse: http://localhost:8080

## 🔐 Autenticação

### Fluxo de Autenticação
1. Email/password signup com perfil automático
2. Auto-confirm habilitado (sem verificação de email)
3. Primeiro usuário recebe role 'admin'
4. Demais usuários recebem role 'proprietario' por padrão

### Gestão de Sessão
- Usa `onAuthStateChange` para listener em tempo real
- Armazena User + Session completos
- Auto-refresh de tokens configurado

## 📊 Funcionalidades Principais

### 1. Exploração de Imóveis
- **Rota**: `/`
- **Funcionalidades**:
  - Busca por nome/bairro
  - Filtros por tipo e localização
  - Cards com informações e métricas
  - Preço base vs. preço sugerido

### 2. Painel do Proprietário
- **Rota**: `/dashboard`
- **Funcionalidades**:
  - Estatísticas agregadas (total imóveis, ocupação média, receita projetada)
  - Lista de imóveis com métricas individuais
  - Gestão de propriedades

### 3. Autenticação
- **Rota**: `/auth`
- **Funcionalidades**:
  - Login e cadastro em tabs
  - Coleta de dados: nome, email, telefone, senha
  - Redirecionamento automático após login

## 🔗 Integrações n8n

### Webhook de Captação de Proprietário
**Endpoint**: (a ser criado via Edge Function)
**Método**: POST
**Payload**:
```json
{
  "nome": "string",
  "email": "string",
  "telefone": "string",
  "origem": "string"
}
```
**Idempotência**: Por email (INSERT ON CONFLICT)

### Webhook de Alerta de Baixa Ocupação
**Endpoint**: (a ser criado via Edge Function)
**Trigger**: Quando ocupação < 40% nos próximos 30 dias
**Payload**:
```json
{
  "imovel_id": "uuid",
  "titulo": "string",
  "ocupacao_atual": "number",
  "dias_proximos": 30
}
```

### Webhook de Ingestão de Eventos Locais
**Endpoint**: (a ser criado via Edge Function)
**Método**: POST
**Payload**:
```json
{
  "nome": "string",
  "descricao": "string",
  "data_inicio": "date",
  "data_fim": "date",
  "bairro": "string",
  "impacto_preco": "decimal"
}
```
**Idempotência**: Por (nome + data_inicio + bairro)

## 🎯 API de Precificação Dinâmica

**Endpoint**: (a ser criado via Edge Function)
**Método**: POST
**Rota**: `/functions/v1/precificacao-dinamica`

**Request Body**:
```json
{
  "imovel_id": "uuid",
  "data_inicio": "date",
  "data_fim": "date"
}
```

**Response**:
```json
{
  "preco_base": "decimal",
  "preco_sugerido": "decimal",
  "multiplicador": "decimal",
  "eventos_impactantes": [
    {
      "nome": "string",
      "impacto": "decimal"
    }
  ]
}
```

**Lógica de Cálculo**:
1. Pega preco_base do imóvel
2. Busca eventos_locais no período e bairro
3. Aplica multiplicadores sequencialmente
4. Retorna preço ajustado

## 🎨 Design System

### Cores Principais
```css
--primary: 205 85% 45% (Azul Oceano - Confiança)
--success: 142 76% 36% (Verde Esmeralda - Receita)
--warning: 38 92% 50% (Amarelo Dourado - Alertas)
```

### Gradientes
```css
--gradient-primary: linear-gradient(135deg, primary → primary-light)
--gradient-success: linear-gradient(135deg, success → success-light)
--gradient-hero: linear-gradient(135deg, primary → success)
```

### Componentes Customizados
- PropertyCard: Card de imóvel com badges, métricas e CTAs
- Navbar: Navegação responsiva com dropdown de perfil
- Dashboard stats: Cards de métricas com ícones

## 🔄 Fluxos de Dados

### 1. Cadastro de Novo Usuário
```
Signup Form → Supabase Auth → Trigger handle_new_user() → 
  INSERT profiles → INSERT user_roles → Redirect to /
```

### 2. Exploração de Imóveis
```
Index Page → Load imoveis (RLS filtered) → Apply client filters → 
  Display PropertyCards
```

### 3. Dashboard do Proprietário
```
Dashboard Page → Load imoveis by proprietario_id → 
  Calculate stats → Display metrics + property list
```

## 📦 Decisões de Design

### 1. Multi-Imobiliária
- Campo `imobiliaria_id` em profiles e imoveis
- RLS policies verificam vínculo via `user_imobiliaria_id()`
- Filtros automáticos no frontend por imobiliária

### 2. Idempotência em Webhooks
- Todas as integrações n8n devem usar `INSERT ON CONFLICT`
- Chave única por contexto (email, telefone, nome+data)

### 3. Precificação Dinâmica
- Tabela eventos_locais com multiplicadores
- API calcula na hora (não armazena preços)
- Permite override manual por proprietário

### 4. Segurança
- NEVER usar raw SQL em edge functions
- ALWAYS usar Supabase client methods
- RLS policies em TODAS as tabelas
- Security definer functions para evitar recursão

## 🚧 Próximos Passos (Roadmap)

### Funcionalidades Pendentes:
1. ✅ Estrutura do banco de dados
2. ✅ Autenticação e roles
3. ✅ Interface de exploração
4. ✅ Painel do proprietário
5. ⏳ Edge Functions:
   - Webhook captação proprietário
   - Webhook alertas ocupação
   - Webhook ingestão eventos
   - API precificação dinâmica
6. ⏳ CRUD completo de imóveis
7. ⏳ Gestão de reservas
8. ⏳ Calendário de disponibilidade
9. ⏳ Dashboard multi-imobiliária
10. ⏳ Relatórios e analytics

## 📞 Suporte e Manutenção

### Debug
- Console logs: Disponíveis no Lovable Cloud
- Network requests: Via DevTools
- Database: Lovable Cloud → Tables

### Deployment
- Frontend: Lovable auto-deploy on git push
- Backend: Edge functions auto-deploy
- Migrations: Executadas via Lovable UI

### Variáveis de Ambiente
Gerenciadas automaticamente pelo Lovable Cloud. Não há .env manual.

---

**Versão**: 1.0.0  
**Última atualização**: 2025-01-10  
**Mantenedor**: Equipe Temporada Lite
