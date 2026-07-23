import { chromium } from 'playwright';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Parâmetros opcionais de linha de comando:
// Ex: node scripts/local_liga_scraper.js --limit 500 --set "Forças Temporais"
const args = process.argv.slice(2);
const limitArgIdx = args.indexOf('--limit');
const limit = limitArgIdx !== -1 ? parseInt(args[limitArgIdx + 1]) : null;
const setArgIdx = args.indexOf('--set');
const filterSet = setArgIdx !== -1 ? args[setArgIdx + 1] : null;

async function scrape() {
  console.log("Iniciando scraper local da LigaPokémon com Catálogo Completo...");

  // 1. Carregar catálogo completo gerado
  const catalogPath = 'all_cards_catalog.json';
  if (!fs.existsSync(catalogPath)) {
    console.error("Erro: Arquivo 'all_cards_catalog.json' não encontrado na raiz do projeto.");
    console.error("Por favor, execute primeiro: node scripts/generate_card_catalog.js");
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  let cardsToScrape = catalog;

  // Filtrar por set se solicitado via argumento
  if (filterSet) {
    console.log(`Filtrando busca para o conjunto: "${filterSet}"`);
    cardsToScrape = cardsToScrape.filter(c => c.setName.toLowerCase().includes(filterSet.toLowerCase()));
  }

  // 2. Carregar progresso anterior para permitir retomar (resume) de onde parou
  let pricesOutput = {};
  const progressPath = 'liga_prices.json';
  if (fs.existsSync(progressPath)) {
    try {
      pricesOutput = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
      console.log(`Retomando progresso! Carregados ${Object.keys(pricesOutput).length} registros anteriores de '${progressPath}'`);
    } catch (e) {
      console.log("Criando novo arquivo de progresso.");
    }
  }

  // Filtrar cartas que já foram raspadas
  cardsToScrape = cardsToScrape.filter(c => !pricesOutput[c.id]);
  console.log(`Restam ${cardsToScrape.length} cartas a raspar.`);

  // Aplicar limite de busca por lote se especificado
  if (limit && cardsToScrape.length > limit) {
    console.log(`Limitando este lote para raspar apenas ${limit} cartas.`);
    cardsToScrape = cardsToScrape.slice(0, limit);
  }

  if (cardsToScrape.length === 0) {
    console.log("Nenhuma carta pendente para raspar. Tudo atualizado!");
    return;
  }

  // Abre navegador visível (headless: false) para evitar bloqueios Cloudflare de rede doméstica
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  let batchCount = 0;

  for (const card of cardsToScrape) {
    console.log(`\n🔍 [Set: ${card.setName}] Raspando: ${card.name} (#${card.number})...`);
    
    try {
      const searchQuery = encodeURIComponent(`${card.name} ${card.number}`);
      await page.goto(`https://www.ligapokemon.com.br/?view=cards/cards&search=${searchQuery}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Simular intervalo humano
      await page.waitForTimeout(1500);

      // Clica no primeiro card se vier lista de resultados
      const firstResultLink = page.locator('a[href*="view=cards/card&id="]').first();
      if (await firstResultLink.count() > 0) {
        await firstResultLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
      }

      const bodyText = await page.innerText('body');

      const minMatch = bodyText.match(/(?:Menor|Mínimo|Menor Preço):\s*R\$\s*([\d.,]+)/i);
      const avgMatch = bodyText.match(/(?:Média|Médio|Preço Médio|Media):\s*R\$\s*([\d.,]+)/i);
      const maxMatch = bodyText.match(/(?:Maior|Máximo|Maior Preço):\s*R\$\s*([\d.,]+)/i);

      let priceMin = minMatch ? parseFloat(minMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
      let priceAvg = avgMatch ? parseFloat(avgMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
      let priceMax = maxMatch ? parseFloat(maxMatch[1].replace(/\./g, '').replace(',', '.')) : 0;

      // Fallback: busca na tabela de ofertas ativas
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
        console.log(`➔ Sucesso! R$ ${priceAvg}`);
        pricesOutput[card.id] = {
          min: priceMin || priceAvg * 0.85,
          avg: priceAvg,
          max: priceMax || priceAvg * 1.15
        };
      } else {
        console.log(`⚠ Preço indisponível.`);
      }

    } catch (err) {
      console.error(`❌ Erro ao processar ${card.name}:`, err);
    }

    // Salvar progresso a cada 10 cartas para não perder nada se você fechar o script
    batchCount++;
    if (batchCount % 10 === 0) {
      fs.writeFileSync(progressPath, JSON.stringify(pricesOutput, null, 2));
      console.log(`💾 Progresso salvo temporariamente (${Object.keys(pricesOutput).length} registros).`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Grava o arquivo de progresso final
  fs.writeFileSync(progressPath, JSON.stringify(pricesOutput, null, 2));
  console.log(`\n✅ Scraping concluído! Progresso total salvo em '${progressPath}'.`);
  
  await browser.close();
}

scrape();
