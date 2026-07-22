import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inicializa o cliente do Supabase para ler as cartas da coleção
const supabase = (supabaseUrl && supabaseServiceRoleKey) 
  ? createClient(supabaseUrl, supabaseServiceRoleKey) 
  : null;

async function scrape() {
  console.log("Iniciando scraper local da LigaPokémon...");

  let cardsToScrape = [];

  // 1. Tentar ler as cartas reais cadastradas na coleção dos usuários no Supabase
  if (supabase) {
    console.log("Buscando cartas ativas nas coleções do Supabase para raspar...");
    try {
      const { data, error } = await supabase
        .from('collection_items')
        .select('card_id, card_details');

      if (!error && data) {
        const seen = new Set();
        for (const item of data) {
          if (!seen.has(item.card_id)) {
            seen.add(item.card_id);
            cardsToScrape.push({
              id: item.card_id,
              name: item.card_details.name,
              number: item.card_details.number
            });
          }
        }
      }
    } catch (e) {
      console.warn("Não foi possível carregar cartas do banco, usando fallback local.", e);
    }
  }

  // Fallback para teste se o banco estiver vazio ou offline
  if (cardsToScrape.length === 0) {
    console.log("Usando lista de cartas padrão de demonstração para o scrape...");
    cardsToScrape = [
      { id: "sv3pt5-6", name: "Charizard ex", number: "6" },
      { id: "swsh9-182", name: "Galarian Zapdos V", number: "182" },
      { id: "sv5-1", name: "Turtwig", number: "1" }
    ];
  }

  console.log(`Total de cartas a consultar: ${cardsToScrape.length}`);

  // Abre o navegador localmente no modo visível (headless: false)
  // Isso reduz em 95% o risco de bloqueios do Cloudflare na sua rede doméstica
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const pricesOutput = {};

  for (const card of cardsToScrape) {
    console.log(`\n🔍 Buscando LigaPokémon para: ${card.name} (#${card.number})...`);
    
    try {
      const searchQuery = encodeURIComponent(`${card.name} ${card.number}`);
      await page.goto(`https://www.ligapokemon.com.br/?view=cards/cards&search=${searchQuery}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Simular comportamento humano
      await page.waitForTimeout(2000);

      // Se a busca retornar uma lista, clica no primeiro card correspondente
      const firstResultLink = page.locator('a[href*="view=cards/card&id="]').first();
      if (await firstResultLink.count() > 0) {
        await firstResultLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }

      // Extrai os textos do corpo da página para análise via regex (robusto contra alterações de classes HTML)
      const bodyText = await page.innerText('body');

      // Encontrar strings como: "Menor: R$ 12,34", "Média: R$ 15,00", "Maior: R$ 20,00"
      const minMatch = bodyText.match(/(?:Menor|Mínimo|Menor Preço):\s*R\$\s*([\d.,]+)/i);
      const avgMatch = bodyText.match(/(?:Média|Médio|Preço Médio|Media):\s*R\$\s*([\d.,]+)/i);
      const maxMatch = bodyText.match(/(?:Maior|Máximo|Maior Preço):\s*R\$\s*([\d.,]+)/i);

      let priceMin = minMatch ? parseFloat(minMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
      let priceAvg = avgMatch ? parseFloat(avgMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
      let priceMax = maxMatch ? parseFloat(maxMatch[1].replace(/\./g, '').replace(',', '.')) : 0;

      // Fallback: se não achar texto estruturado, tenta pegar os valores das ofertas ativas na tabela
      if (priceAvg === 0) {
        const offerTexts = await page.locator('.preco-produto, .vlr-venda, td:has-text("R$")').allInnerTexts();
        const cleanPrices = offerTexts
          .map(t => parseFloat(t.replace(/[^\d,]/g, '').replace(',', '.')))
          .filter(p => !isNaN(p) && p > 0);

        if (cleanPrices.length > 0) {
          priceMin = Math.min(...cleanPrices);
          priceMax = Math.max(...cleanPrices);
          priceAvg = cleanPrices.reduce((a, b) => a + b, 0) / cleanPrices.length;
        }
      }

      if (priceAvg > 0) {
        console.log(`➔ Preços extraídos: Mín R$ ${priceMin} | Média R$ ${priceAvg} | Máx R$ ${priceMax}`);
        pricesOutput[card.id] = {
          min: priceMin || priceAvg * 0.85,
          avg: priceAvg,
          max: priceMax || priceAvg * 1.15
        };
      } else {
        console.log(`⚠ Não foi possível obter valores para esta carta.`);
      }

    } catch (err) {
      console.error(`❌ Erro ao raspar ${card.name}:`, err);
    }
  }

  // Salvar no arquivo JSON local na raiz do projeto
  fs.writeFileSync('liga_prices.json', JSON.stringify(pricesOutput, null, 2));
  console.log("\n✅ Scraping concluído! Arquivo 'liga_prices.json' gerado com sucesso na raiz do projeto.");
  
  await browser.close();
}

scrape();
