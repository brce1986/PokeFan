import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Importa o ÍNDICE de busca das cartas para a tabela public.cards_catalog.
//
// Baixa da API oficial (paginado, com retry contra a instabilidade dela) e
// sobe para o seu Supabase em lotes. Guarda só o necessário para BUSCAR e
// LISTAR — não ataques, não preço. Rode a migration 002 antes.
//
//   node scripts/import_catalog_to_supabase.js
//
// Retomável: relê o que já está na tabela e continua de onde parou, então pode
// interromper com Ctrl+C e rodar de novo sem duplicar nem recomeçar do zero.
// =============================================================================

// Carrega .env manualmente (mesmo padrão dos outros scripts, sem dependência).
try {
  if (fs.existsSync('.env')) {
    for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (m) {
        let v = (m[2] || '').trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    }
  }
} catch { /* .env é opcional */ }

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.VITE_POKEMON_API_KEY || ''; // opcional, sobe o rate limit

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const API = 'https://api.pokemontcg.io/v2';
const PAGE_SIZE = 250;   // máximo da API
const UPSERT_BATCH = 500;

async function fetchWithRetry(url, retries = 6, delay = 2000) {
  const headers = API_KEY ? { 'X-Api-Key': API_KEY } : {};
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return res.json();
      console.warn(`  HTTP ${res.status} — tentativa ${i + 1}/${retries}, retry em ${delay}ms`);
    } catch (e) {
      console.warn(`  rede: ${e.message} — tentativa ${i + 1}/${retries}, retry em ${delay}ms`);
    }
    await new Promise(r => setTimeout(r, delay));
    delay = Math.min(delay * 2, 30000);
  }
  throw new Error(`Falha definitiva após ${retries} tentativas: ${url}`);
}

// Só os campos de busca/listagem. `?select=` reduz o payload de cada página.
const CAMPOS = 'id,name,number,rarity,supertype,images,set';

function mapear(card) {
  return {
    id: card.id,
    name: card.name,
    number: card.number ?? null,
    printed_total: card.set?.printedTotal ?? null,
    set_id: card.set?.id ?? null,
    set_name: card.set?.name ?? null,
    set_series: card.set?.series ?? null,
    rarity: card.rarity ?? null,
    supertype: card.supertype ?? null,
    image_small: card.images?.small ?? null,
    image_large: card.images?.large ?? null,
    release_date: card.set?.releaseDate ? card.set.releaseDate.replace(/\//g, '-') : null
  };
}

async function subir(linhas) {
  for (let i = 0; i < linhas.length; i += UPSERT_BATCH) {
    const lote = linhas.slice(i, i + UPSERT_BATCH);
    const { error } = await supabase.from('cards_catalog').upsert(lote, { onConflict: 'id' });
    if (error) throw new Error(`Falha no upsert: ${error.message}`);
  }
}

async function main() {
  const primeira = await fetchWithRetry(`${API}/cards?select=id&pageSize=1`);
  const total = primeira.totalCount;
  const totalPaginas = Math.ceil(total / PAGE_SIZE);
  console.log(`API reporta ${total} cartas (${totalPaginas} páginas de ${PAGE_SIZE}).`);

  const { count: jaImportadas } = await supabase
    .from('cards_catalog')
    .select('id', { count: 'exact', head: true });

  // Retomada real: as cartas vêm ordenadas por id em páginas cheias de 250, e
  // cada página é gravada de uma vez (all-or-nothing). Então a contagem atual é
  // sempre múltiplo de 250 até a última página, e dá para pular direto para a
  // primeira página ainda não importada — sem rebaixar a API instável relendo
  // o que já está no banco.
  const paginaInicial = Math.floor((jaImportadas ?? 0) / PAGE_SIZE) + 1;
  console.log(`Já na tabela: ${jaImportadas ?? 0}. Retomando da página ${paginaInicial}.\n`);

  let importadas = 0;
  for (let page = paginaInicial; page <= totalPaginas; page++) {
    const url = `${API}/cards?select=${CAMPOS}&page=${page}&pageSize=${PAGE_SIZE}&orderBy=id`;
    const { data } = await fetchWithRetry(url);
    if (!Array.isArray(data) || data.length === 0) break;

    await subir(data.map(mapear));
    importadas += data.length;
    console.log(`  página ${page}/${totalPaginas} — +${data.length} (acumulado nesta execução: ${importadas})`);
  }

  const { count: final } = await supabase
    .from('cards_catalog')
    .select('id', { count: 'exact', head: true });
  console.log(`\nConcluído. Total na tabela: ${final ?? '?'} de ${total} reportadas pela API.`);
}

main().catch(err => {
  console.error('\nInterrompido:', err.message);
  console.error('Rode de novo — o script continua de onde parou.');
  process.exit(1);
});
