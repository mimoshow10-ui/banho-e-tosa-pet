-- Criar tabela de categorias
CREATE TABLE public.categorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.categorias(id), -- Para suportar Subcategorias (ex: Coleiras > Luxo)
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de produtos
CREATE TABLE public.produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bling_id TEXT UNIQUE, -- ID do produto no Bling para sincronização
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    preco_promocional DECIMAL(10,2),
    -- Dados Fiscais e Logística
    codigo_barras TEXT, -- EAN / GTIN
    ncm TEXT,
    peso_liquido DECIMAL(10,3) DEFAULT 0,
    peso_bruto DECIMAL(10,3) DEFAULT 0,
    largura DECIMAL(10,2) DEFAULT 0,
    altura DECIMAL(10,2) DEFAULT 0,
    profundidade DECIMAL(10,2) DEFAULT 0,
    
    -- Organização e Mídia
    marca TEXT,
    video_url TEXT, -- Link do YouTube do produto (muito comum no Bling)
    descricao_curta TEXT, -- Resumo do produto
    
    -- Relacionamentos e Variações
    categoria_id UUID REFERENCES public.categorias(id),
    imagens TEXT[] DEFAULT '{}', -- Array de URLs das imagens
    tamanhos TEXT[] DEFAULT '{}', -- Ex: ['P', 'M', 'G']
    cores TEXT[] DEFAULT '{}', -- Ex: ['#FF0000', '#0000FF']
    produtos_relacionados UUID[] DEFAULT '{}', -- Array de IDs para "Mais opções de compra"
    
    -- SEO (Otimização para o Google que vem do Bling)
    seo_title TEXT,
    seo_description TEXT,
    parent_id UUID REFERENCES public.produtos(id), -- Para Variações do Bling (Preços diferentes por tamanho)
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para segurança
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir que qualquer um leia os produtos e categorias (Acesso público no site)
CREATE POLICY "Permitir leitura pública de categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de produtos" ON public.produtos FOR SELECT USING (true);

-- Inserir algumas categorias iniciais
INSERT INTO public.categorias (nome, slug) VALUES 
('Coleiras', 'coleiras'),
('Gravatas', 'gravatas'),
('Acessórios', 'acessorios'),
('Bandanas', 'bandanas'),
('Roupinhas', 'roupinhas');
