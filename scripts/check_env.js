import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Preflight: confere se o .env está pronto para a importação, SEM imprimir
// nenhum segredo. Reporta só presença (sim/não), comprimento e um teste de
// conexão. Seguro para o assistente rodar.
//
//   node scripts/check_env.js
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

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const apiKey = process.env.VITE_POKEMON_API_KEY || '';

const mascara = (v) => (v ? `presente (${v.length} caracteres)` : 'AUSENTE');

console.log('SUPABASE_URL:              ', url || 'AUSENTE');
console.log('SUPABASE_SERVICE_ROLE_KEY: ', mascara(key));
console.log('VITE_POKEMON_API_KEY:      ', mascara(apiKey), apiKey ? '' : '(opcional)');

if (!url || !key) {
  console.error('\nFaltam chaves obrigatórias no .env. Preencha e rode de novo.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { count, error } = await supabase
  .from('cards_catalog')
  .select('id', { count: 'exact', head: true });

if (error) {
  console.error('\nConexão FALHOU:', error.message);
  console.error('Verifique se a URL e a service_role estão corretas e se a migration 002 rodou.');
  process.exit(1);
}

console.log(`\nConexão OK. Tabela cards_catalog acessível. Linhas hoje: ${count ?? 0}.`);
console.log(count ? 'Já há dados — a importação vai completar o que faltar.' : 'Vazia — pronta para importar.');
