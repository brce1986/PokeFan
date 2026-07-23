# ⚡ PokéFan - Coleção TCG & Pokébola ⚡

O **PokéFan** é um gerenciador de coleções e scanner digital premium para entusiastas do Pokémon TCG. A aplicação combina a API oficial internacional com o mercado brasileiro da LigaPokémon, oferecendo ferramentas avançadas de precificação, controle de pastas, lista de desejos e escaneamento visual no formato Pokedex.

---

## 🛠️ Stack Tecnológica

- **Frontend Core**: React 19 (Hooks, Context API), TypeScript, Vite.
- **Estilização & UI**: Tailwind CSS (design responsivo, paletas HSL premium, efeitos de glassmorphic, animações customizadas), Lucide React (iconografia).
- **Backend & Auth**: Supabase (PostgreSQL para coleções, Supabase Auth para controle de usuários e sessões, e Supabase Storage Buckets para armazenamento de fotos de perfil).
- **Automação & Scraping**: Playwright (automação Chromium local) e Apify API (execução do robô `gio21/ligapokemon-scraper` na nuvem).
- **Segurança**: Sanitização ativa contra scripts maliciosos (XSS) e injeções de SQL nas áreas de input de texto e buscas.

---

## 🏆 Principais Funcionalidades

### 📊 1. Painel Inicial (Dashboard)
- **Gráfico de Evolução Financeira**: Gráfico vetorial interativo (SVG) que renderiza a valorização da coleção com cálculo de largura dinâmico (`ResizeObserver`).
- **Resumos Rápidos**: Exibição da quantidade total de cartas, conjuntos colecionados e valor total convertido.
- **Lista de Desejos (Wishlist)**: Acesso direto no painel com scroll horizontal para as cartas mais cobiçadas.
- **Progresso de Coleção**: Barras de progresso com porcentagens de conclusão para coleções clássicas e modernas (ex: 151, Estrelas Brilhantes, Céus Evolventes).

### 🗂️ 2. Minha Coleção (Binder Virtual)
- Visualização por pastas de coleções (Sets) com logos oficiais e contadores.
- Filtros refinados por cartas que você já tem, faltantes ou catálogo completo.
- Ordenação por valor de mercado, data de adição recente, número e ordem alfabética.

### 📷 3. Escaneamento com Câmera (Pokédex Scan)
- Interface de câmera realista simulando uma Pokédex com cantoneiras de foco e retícula de mira central em vermelho neon.
- Linha de laser animada para simulação de varredura ativa.
- **Fallback Local**: Seletor rápido de arquivos de simulação local para testar a detecção em ambientes de desenvolvimento.
- **Slidable Bottom Sheet**: Gaveta deslizante inferior que surge dinamicamente ao detectar uma carta, permitindo ajustar a condição (NM, LP, MP, HP, DMG), variante (Normal, Holo, Reverse Holo) e quantidade antes de guardar.

### 🔍 4. Busca Avançada de Cartas ("Cartas")
- Busca inteligente por nome e **Código de Carta (ex: `121/88`, `6/151`)**: O sistema quebra a string no caractere `/` e busca exatamente a carta pela numeração e total do set impresso.
- Inclusão imediata na Coleção ou na Lista de Desejos (Wishlist) através de botão de coração dinâmico.

### 🔄 5. Pasta de Trocas (Trade Binder)
- Exibição de todas as cartas da coleção disponíveis para troca.
- Geração automática de templates e mensagens formatadas para compartilhamento em redes sociais com condição e valores de mercado.
- Integração global com a seleção de cartas para compartilhamento sob demanda.

### 👤 6. Perfil do Treinador & Ajustes
- Personalização de nome de usuário e cargo de colecionador.
- **Upload de Fotos (Crop & Zoom)**: Modal interativo para carregar imagens do dispositivo, permitindo ajustar o zoom (1.0x a 3.0x) e arrastar (pan) a imagem para centralização.
- **Compressão de Imagem**: Exportação automatizada via Canvas HTML5 a `200x200` pixels e 80% de qualidade JPEG, reduzindo arquivos de MBs para ~15KB.
- Salvamento híbrido (Base64 local se estiver usando acesso de teste, ou bucket público do Supabase se estiver logado com e-mail).

---

## 📁 Estrutura de Diretórios e Arquivos

```text
pokefan/
├── all_cards_catalog.json          # Banco de dados de catálogo completo das cartas Pokémon
├── index.html                      # Ponto de entrada do HTML5 da aplicação
├── package.json                    # Dependências, scripts e configurações npm (Type: Module)
├── tailwind.config.js              # Configurações e tokens de design do Tailwind CSS
├── vite.config.ts                  # Configurações do Vite e plugins do React
├── public/                         # Assets públicos estáticos (ícones, logos e favicons)
├── scripts/                        # Scripts de automação e scraping para o banco de dados
│   ├── generate_card_catalog.js    # Baixa todas as cartas da API do Pokémon TCG e monta o catálogo JSON
│   ├── local_liga_scraper.js       # Scraper local pausável (via Playwright Chromium) para coletar preços da LigaPokémon
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
    │   ├── Scan.tsx                # Tela do scanner Pokédex e processamento de imagens
    │   ├── SearchDetails.tsx       # Tela de buscas avançadas e visualização de detalhes da carta
    │   └── TradeBinder.tsx         # Tela de trocas e compartilhamento de cartas
    ├── context/
    │   └── AppContext.tsx          # Contexto central, gerencia estados globais (Coleção, Wishlist, Usuário, Moeda)
    ├── services/
    │   ├── pokemonApi.ts           # Cliente de requisições para a API oficial Pokémon TCG (V2)
    │   ├── ligaPokemonApi.ts       # Serviço de consulta de preços LigaPokémon (Supabase e fallback cambial BRL)
    │   └── supabaseClient.ts       # Configuração e inicialização do cliente Supabase
    └── utils/
        └── security.ts             # Helpers de segurança (limpeza de XSS/SQL injections e sanitização)
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Iniciar o Servidor de Desenvolvimento
```bash
# Instalar as dependências do projeto
npm install

# Iniciar o servidor local (Vite)
npm run dev
```

### 2. Sincronizar Preços da LigaPokémon no Supabase
Para atualizar os preços de todas as cartas da Liga no Supabase de forma local e gratuita:

```bash
# 1. Crie o catálogo de cartas
node scripts/generate_card_catalog.js

# 2. Rode o scraper local para ler os preços (usa seu IP doméstico para passar do Cloudflare)
node scripts/local_liga_scraper.js

# 3. Suba o JSON gerado direto para seu Supabase
node scripts/upload_liga_prices.js
```
*(Nota: Certifique-se de configurar as chaves `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no seu arquivo `.env` local antes de rodar os scripts de banco de dados).*
