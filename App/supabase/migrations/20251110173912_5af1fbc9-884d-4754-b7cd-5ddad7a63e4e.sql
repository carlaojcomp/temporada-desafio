-- Criação do sistema Temporada Lite

-- Enum para tipos de imóveis
CREATE TYPE public.property_type AS ENUM ('apartamento', 'casa', 'studio', 'cobertura', 'chalé');

-- Enum para roles de usuários
CREATE TYPE public.app_role AS ENUM ('admin', 'imobiliaria', 'proprietario');

-- Tabela de imobiliárias
CREATE TABLE public.imobiliarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cnpj TEXT UNIQUE,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Tabela de imóveis
CREATE TABLE public.imoveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo property_type NOT NULL,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL DEFAULT 'Rio de Janeiro',
  estado TEXT NOT NULL DEFAULT 'RJ',
  endereco_completo TEXT,
  quartos INTEGER NOT NULL DEFAULT 1,
  banheiros INTEGER NOT NULL DEFAULT 1,
  capacidade INTEGER NOT NULL DEFAULT 2,
  preco_base DECIMAL(10,2) NOT NULL,
  imagens JSONB DEFAULT '[]'::jsonb,
  amenidades JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de reservas
CREATE TABLE public.reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID REFERENCES public.imoveis(id) ON DELETE CASCADE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL,
  hospede_nome TEXT,
  hospede_email TEXT,
  hospede_telefone TEXT,
  status TEXT DEFAULT 'confirmada' CHECK (status IN ('pendente', 'confirmada', 'cancelada', 'concluida')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de eventos locais (para precificação dinâmica)
CREATE TABLE public.eventos_locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  bairro TEXT,
  impacto_preco DECIMAL(5,2) DEFAULT 1.0, -- multiplicador de preço
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_imoveis_bairro ON public.imoveis(bairro);
CREATE INDEX idx_imoveis_tipo ON public.imoveis(tipo);
CREATE INDEX idx_imoveis_imobiliaria ON public.imoveis(imobiliaria_id);
CREATE INDEX idx_imoveis_proprietario ON public.imoveis(proprietario_id);
CREATE INDEX idx_reservas_imovel ON public.reservas(imovel_id);
CREATE INDEX idx_reservas_datas ON public.reservas(data_inicio, data_fim);
CREATE INDEX idx_eventos_datas ON public.eventos_locais(data_inicio, data_fim);

-- Enable RLS em todas as tabelas
ALTER TABLE public.imobiliarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_locais ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para verificar se usuário pertence a uma imobiliária
CREATE OR REPLACE FUNCTION public.user_imobiliaria_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT imobiliaria_id FROM public.profiles WHERE id = _user_id
$$;

-- RLS Policies para imobiliarias
CREATE POLICY "Todos podem ver imobiliárias ativas"
  ON public.imobiliarias FOR SELECT
  USING (ativa = true);

CREATE POLICY "Admins podem gerenciar imobiliárias"
  ON public.imobiliarias FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para imoveis
CREATE POLICY "Todos podem ver imóveis ativos"
  ON public.imoveis FOR SELECT
  USING (ativo = true);

CREATE POLICY "Proprietários podem ver seus próprios imóveis"
  ON public.imoveis FOR SELECT
  USING (auth.uid() = proprietario_id);

CREATE POLICY "Proprietários podem criar seus imóveis"
  ON public.imoveis FOR INSERT
  WITH CHECK (auth.uid() = proprietario_id);

CREATE POLICY "Proprietários podem atualizar seus imóveis"
  ON public.imoveis FOR UPDATE
  USING (auth.uid() = proprietario_id);

CREATE POLICY "Imobiliárias podem ver imóveis de seus proprietários"
  ON public.imoveis FOR SELECT
  USING (
    public.has_role(auth.uid(), 'imobiliaria') AND
    imobiliaria_id = public.user_imobiliaria_id(auth.uid())
  );

-- RLS Policies para reservas
CREATE POLICY "Proprietários podem ver reservas de seus imóveis"
  ON public.reservas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE imoveis.id = reservas.imovel_id
      AND imoveis.proprietario_id = auth.uid()
    )
  );

CREATE POLICY "Imobiliárias podem ver reservas de seus imóveis"
  ON public.reservas FOR SELECT
  USING (
    public.has_role(auth.uid(), 'imobiliaria') AND
    EXISTS (
      SELECT 1 FROM public.imoveis
      WHERE imoveis.id = reservas.imovel_id
      AND imoveis.imobiliaria_id = public.user_imobiliaria_id(auth.uid())
    )
  );

CREATE POLICY "Admins podem gerenciar reservas"
  ON public.reservas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para eventos_locais
CREATE POLICY "Todos podem ver eventos"
  ON public.eventos_locais FOR SELECT
  USING (true);

CREATE POLICY "Admins podem gerenciar eventos"
  ON public.eventos_locais FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Primeiro usuário é admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Demais usuários são proprietários por padrão
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'proprietario');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_imobiliarias_updated_at
  BEFORE UPDATE ON public.imobiliarias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imoveis_updated_at
  BEFORE UPDATE ON public.imoveis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();