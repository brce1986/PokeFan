import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// IMPORTANTE: Usar a Service Role Key (secret) para poder escrever ignorando o RLS de leitura pública
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const apifyToken = process.env.APIFY_TOKEN;

if (!supabaseUrl || !supabaseServiceRoleKey || !apifyToken) {
  console.error("Erro: Variáveis SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e APIF_TOKEN devem estar configuradas no ambiente/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  console.log("Iniciando cron job de sincronização de preços da LigaPokémon...");

  // 1. Obter a lista de todas as cartas exclusivas que existem na coleção de todos os usuários
  console.log("Buscando cartas ativas nas coleções dos usuários...");
  const { data: activeCards, error: cardError } = await supabase
    .from('collection_items')
    .select('card_id, card_details');

  if (cardError) {
    console.error("Erro ao buscar cartas da coleção:", cardError);
    return;
  }

  if (!activeCards || activeCards.length === 0) {
    console.log("Nenhuma carta encontrada nas coleções para atualizar.");
    return;
  }

  // Filtrar duplicados para otimizar requisições do Apify
  const uniqueCards = [];
  const seenIds = new Set();
  for (const item of activeCards) {
    if (!seenIds.has(item.card_id)) {
      seenIds.add(item.card_id);
      uniqueCards.push({
        id: item.card_id,
        name: item.card_details.name,
        number: item.card_details.number
      });
    }
  }

  console.log(`Encontradas ${uniqueCards.length} cartas únicas nas pastas dos treinadores.`);

  // 2. Para cada carta única, executa o scraper e salva na tabela ligapokemon_prices
  for (const card of uniqueCards) {
    console.log(`Consultando LigaPokémon no Apify para: ${card.name} (#${card.number})...`);

    try {
      const queryText = `${card.name} ${card.number}`;
      const response = await fetch(`https://api.apify.com/v2/actors/gio21~ligapokemon-scraper/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          language: 'any',
          maxItems: 1
        })
      });

      if (response.ok) {
        const items = await response.json();
        if (Array.isArray(items) && items.length > 0) {
          const matchedItem = items[0];
          
          const priceMin = parseFloat(matchedItem.priceMin || matchedItem.minPrice || '0') || 0;
          const priceAvg = parseFloat(matchedItem.priceAvg || matchedItem.avgPrice || '0') || 0;
          const priceMax = parseFloat(matchedItem.priceMax || matchedItem.maxPrice || '0') || 0;

          if (priceAvg > 0) {
            console.log(`➔ Sucesso! R$ ${priceAvg}. Atualizando no banco...`);
            
            const { error: upsertError } = await supabase
              .from('ligapokemon_prices')
              .upsert({
                card_id: card.id,
                price_min: priceMin || priceAvg * 0.85,
                price_avg: priceAvg,
                price_max: priceMax || priceAvg * 1.15,
                updated_at: new Date().toISOString()
              });

            if (upsertError) {
              console.error(`Erro ao salvar no banco para ${card.name}:`, upsertError);
            }
          } else {
            console.log(`⚠ Preço nulo ou não retornado para ${card.name}.`);
          }
        } else {
          console.log(`⚠ Nenhum resultado retornado no Apify para ${card.name}.`);
        }
      } else {
        console.warn(`⚠ Falha na API do Apify para ${card.name}: ${response.statusText}`);
      }
    } catch (e) {
      console.error(`❌ Erro crítico ao processar ${card.name}:`, e);
    }

    // Pequeno intervalo de 1.5s para evitar sobrecarregar o scraper
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log("Cron job de atualização concluído com sucesso!");
}

run();
