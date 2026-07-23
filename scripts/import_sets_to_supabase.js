import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Importa os ~174 sets para public.card_sets. Endpoint pequeno e estável —
// uma execução resolve. Rode a migration 003 antes.
//
//   node scripts/import_sets_to_supabase.js
// =============================================================================

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
} catch { /* .env opcional */ }

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.VITE_POKEMON_API_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

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

const mapear = (set) => ({
  id: set.id,
  name: set.name,
  series: set.series ?? null,
  printed_total: set.printedTotal ?? null,
  total: set.total ?? null,
  release_date: set.releaseDate ? set.releaseDate.replace(/\//g, '-') : null,
  logo: set.images?.logo ?? null,
  symbol: set.images?.symbol ?? null
});

async function main() {
  console.log('Baixando sets...');
  const { data } = await fetchWithRetry('https://api.pokemontcg.io/v2/sets?pageSize=250&orderBy=releaseDate');
  if (!Array.isArray(data) || data.length === 0) throw new Error('Nenhum set retornado.');

  const { error } = await supabase.from('card_sets').upsert(data.map(mapear), { onConflict: 'id' });
  if (error) throw new Error(`Falha no upsert: ${error.message}`);

  const { count } = await supabase.from('card_sets').select('id', { count: 'exact', head: true });
  console.log(`Concluído. ${count ?? '?'} sets na tabela.`);
}

main().catch(err => {
  console.error('\nInterrompido:', err.message);
  console.error('Rode de novo — o upsert não duplica.');
  process.exit(1);
});
