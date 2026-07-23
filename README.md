# ⚡ PokéFan - Coleção TCG & Pokébola ⚡

O **PokéFan** é um gerenciador de coleções para entusiastas do Pokémon TCG. A aplicação permite gerenciar sua coleção usando um catálogo armazenado no Supabase, oferecendo ferramentas de precificação estimadas, controle de pastas e lista de desejos.

---

## 🛠️ Stack Tecnológica

- **Frontend Core**: React 19 (Hooks, Context API), TypeScript, Vite.
- **Estilização & UI**: Tailwind CSS (design responsivo, paletas HSL premium, efeitos de glassmorphic, animações customizadas), Lucide React (iconografia).
- **Backend & Auth**: Supabase (PostgreSQL para coleções e catálogo de cartas, Supabase Auth para controle de usuários e sessões, e Supabase Storage Buckets para armazenamento de fotos de perfil).
- **Segurança**: Sanitização de entrada contra XSS (remoção de tags HTML) e validação de formato de IDs. A busca preserva caracteres legítimos de nomes de carta (hífen, apóstrofo), sem a antiga "proteção contra SQL injection" que apenas mutilava a entrada.

---

## 🏆 Principais Funcionalidades

### 📊 1. Painel Inicial (Dashboard)
- **Gráfico de Evolução Financeira**: Gráfico vetorial (SVG) responsivo com largura dinâmica. Atualmente exibe uma série de demonstração — o histórico real de valor (snapshots diários) ainda não foi implementado.
- **Resumos Rápidos**: Exibição da quantidade total de cartas, conjuntos colecionados e valor total convertido.
- **Lista de Desejos (Wishlist)**: Acesso direto no painel com scroll horizontal para as cartas mais cobiçadas.
- **Progresso de Coleção**: Barras de progresso com porcentagens de conclusão para coleções clássicas e modernas (ex: 151, Estrelas Brilhantes, Céus Evolventes).

### 🗂️ 2. Minha Coleção (Binder Virtual)
- Visualização por pastas de coleções (Sets) com logos oficiais e contadores.
- Filtros refinados por cartas que você já tem, faltantes ou catálogo completo.
- Ordenação por valor de mercado, data de adição recente, número e ordem alfabética.

### 📷 3. Escaneamento com Câmera (Pokédex Scan)
- Interface inspirada em uma Pokédex com animações visuais.
- **Não há reconhecimento de imagem real:** A tela permite apenas que o usuário escolha uma carta a partir de uma lista pré-definida de arquivos locais para fins de simulação e teste de usabilidade.
- **Gaveta de Adição:** Após selecionar o arquivo simulado, uma gaveta permite ajustar a condição (NM, LP, MP, HP, DMG), variante (Normal, Holo, Reverse Holo) e quantidade antes de guardar.

### 🔍 4. Busca e Catálogo ("Cartas")
- Utiliza um catálogo de ~20.000 cartas e ~174 sets armazenados no Supabase (tabelas `cards_catalog` e `card_sets`) para uma busca rápida e local. A API pública `pokemontcg.io` é usada apenas como fallback ou para carregar os detalhes completos ao abrir a carta.
- Busca inteligente por nome e **Código de Carta (ex: `121/88`, `6/151`)**.
- Inclusão imediata na Coleção ou na Lista de Desejos (Wishlist) através de botão de coração dinâmico.

### 💰 5. Precificação
- Os preços das cartas em USD são consultados via API.
- A conversão para BRL é uma **estimativa** baseada no câmbio ao vivo (USD→BRL via `src/services/fxRates.ts`) mais um ágio de mercado.
- **Importante:** O preço real e oficial da LigaPokémon ainda não está implementado. O valor exibido não é um preço em tempo real de lojas brasileiras.

### 🔄 6. Pasta de Trocas (Trade Binder)
- Exibição das cartas repetidas (excedentes, com quantidade maior que 1) disponíveis para troca.
- Geração automática de templates e mensagens formatadas para compartilhamento em redes sociais com condição e valores de mercado.
- Integração global com a seleção de cartas para compartilhamento sob demanda.

### 👤 7. Perfil do Treinador, Ajustes e Autenticação
- Cadastro por e-mail com confirmação, login com Google (OAuth) e recuperação de senha (via Supabase Auth).
- **Modo Demonstração (Acesso Rápido de Teste):** Funciona sem nuvem/internet para experimentar o app offline.
- Personalização de nome de usuário e cargo de colecionador.
- **Upload de Fotos (Crop & Zoom)**: Exportação automatizada via Canvas HTML5 a `200x200` pixels e 80% de qualidade JPEG.
- Salvamento híbrido (Base64 local se estiver usando acesso de teste, ou bucket público do Supabase se estiver logado com e-mail).

---

## 📁 Estrutura de Diretórios e Arquivos

```text
pokefan/
├── all_cards_catalog.json          # Banco de dados de catálogo completo das cartas Pokémon
├── .env.example                    # Exemplo de variáveis de ambiente necessárias
├── index.html                      # Ponto de entrada do HTML5 da aplicação
├── package.json                    # Dependências, scripts e configurações npm (Type: Module)
├── tailwind.config.js              # Configurações e tokens de design do Tailwind CSS
├── vite.config.ts                  # Configurações do Vite e plugins do React
├── docs/                           # Documentação e regras de tarefas para agentes
├── public/                         # Assets públicos estáticos (ícones, logos e favicons)
├── supabase/                       # Migrações e configurações do banco de dados Supabase
├── scripts/                        # Scripts de manipulação do banco de dados e scraping
│   ├── check_env.js                # Valida a presença das variáveis de ambiente necessárias
│   ├── generate_card_catalog.js    # Baixa todas as cartas da API do Pokémon TCG e monta o catálogo JSON
│   ├── import_catalog_to_supabase.js # Importa o catálogo JSON de cartas para o Supabase
│   ├── import_sets_to_supabase.js  # Importa os sets para a tabela card_sets do Supabase
│   ├── local_liga_scraper.js       # Scraper local pausável (via Playwright Chromium)
│   ├── update_liga_prices.js       # Script agendado para atualização de preços das coleções via nuvem (Apify)
│   └── upload_liga_prices.js       # Importador/Sincronizador do JSON local de preços para o Supabase
└── src/                            # Código-fonte do frontend
    ├── App.tsx                     # Componente raiz, controla o roteamento de abas e layout responsivo
    ├── index.css                   # Estilos globais, variáveis HSL e animações do laser do scanner
    ├── components/                 # Componentes principais da interface de abas
    │   ├── Collection.tsx          # Tela de gerenciamento da Coleção e progresso do Set
    │   ├── Dashboard.tsx           # Tela inicial, gráficos e lista de desejos
    │   ├── Onboarding.tsx          # Tela de cadastro/login com Supabase Auth ou acesso rápido de teste
    │   ├── ProfileSettings.tsx     # Configurações de perfil, controle de moedas, exportação e crop de foto
    │   ├── Scan.tsx                # Tela do scanner Pokédex
    │   ├── SearchDetails.tsx       # Tela de buscas avançadas e visualização de detalhes da carta
    │   └── TradeBinder.tsx         # Tela de trocas e compartilhamento de cartas
    ├── context/
    │   └── AppContext.tsx          # Contexto central, gerencia estados globais (Coleção, Wishlist, Usuário, Moeda)
    ├── services/
    │   ├── catalogApi.ts           # Busca de cartas contra o catálogo local no Supabase e fallback
    │   ├── fxRates.ts              # Serviço de câmbio USD -> BRL ao vivo
    │   ├── pokemonApi.ts           # Cliente de requisições para a API oficial Pokémon TCG (V2)
    │   ├── ligaPokemonApi.ts       # Serviço de consulta de preços (placeholder)
    │   └── supabaseClient.ts       # Configuração e inicialização do cliente Supabase
    └── utils/
        ├── pricing.ts              # Regras de resolução e formatação de preços de mercado
        └── security.ts             # Helpers de segurança (limpeza de XSS e validação de formato)
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Iniciar o Servidor de Desenvolvimento
```bash
# Copiar o arquivo de exemplo do .env e configurar as chaves do Supabase
cp .env.example .env

# Instalar as dependências do projeto
npm install

# Iniciar o servidor local (Vite)
npm run dev
```

### 2. Sincronizar o Banco de Dados (Supabase)
O catálogo de cartas agora é armazenado no seu banco Supabase. Para abastecer as tabelas (requer credenciais configuradas no `.env`):

```bash
# 1. Verifique se o .env está configurado (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)
node scripts/check_env.js

# 2. Importe os Sets (coleções)
node scripts/import_sets_to_supabase.js

# 3. Importe o catálogo completo de Cartas
node scripts/import_catalog_to_supabase.js
```
