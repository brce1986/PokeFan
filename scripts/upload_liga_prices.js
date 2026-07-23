import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Carregar variáveis do arquivo .env manualmente para evitar dependência externa
try {
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
} catch (e) {}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function upload() {
  console.log("Iniciando envio de preços locais para o Supabase...");

  const filePath = 'liga_prices.json';
  if (!fs.existsSync(filePath)) {
    console.error("Erro: Arquivo 'liga_prices.json' não foi encontrado na raiz do projeto.");
    console.error("Execute primeiro: node scripts/local_liga_scraper.js");
    return;
  }

  const pricesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const entries = Object.entries(pricesData);

  console.log(`Lendo ${entries.length} cartas do JSON local...`);

  for (const [cardId, data] of entries) {
    console.log(`Enviando ${cardId} ➔ Preço Médio: R$ ${data.avg}...`);

    try {
      const { error } = await supabase
        .from('ligapokemon_prices')
        .upsert({
          card_id: cardId,
          price_min: data.min,
          price_avg: data.avg,
          price_max: data.max,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Erro ao salvar ${cardId} no banco:`, error);
      }
    } catch (e) {
      console.error(`❌ Erro de requisição para ${cardId}:`, e);
    }
  }

  console.log("✅ Sincronização de preços concluída no Supabase!");
}

upload();
