import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_POKEMON_API_KEY || ''; // Opcional, aumenta limites de requisição

async function generateCatalog() {
  console.log("Iniciando geração do catálogo completo de cartas...");
  
  let page = 1;
  const pageSize = 250;
  let hasMore = true;
  const catalog = [];

  const headers = {};
  if (API_KEY) {
    headers['X-Api-Key'] = API_KEY;
  }

  while (hasMore) {
    console.log(`Buscando página ${page}...`);
    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}&select=id,name,number,set`, { headers });
      if (!response.ok) {
        console.error(`Erro ao buscar página ${page}: ${response.statusText}`);
        break;
      }

      const result = await response.json();
      const cards = result.data;

      if (Array.isArray(cards) && cards.length > 0) {
        for (const card of cards) {
          catalog.push({
            id: card.id,
            name: card.name,
            number: card.number,
            setName: card.set?.name || 'Promo'
          });
        }
        console.log(`Adicionadas ${cards.length} cartas. Total no catálogo: ${catalog.length}`);
        
        // Finaliza se receber menos itens que o tamanho da página ou atingir o total do banco
        if (cards.length < pageSize || catalog.length >= result.totalCount) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error("Erro na requisição:", e);
      break;
    }

    // Intervalo leve para respeitar a cota de requisição da API base
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Grava o arquivo de catálogo na raiz do projeto
  fs.writeFileSync('all_cards_catalog.json', JSON.stringify(catalog, null, 2));
  console.log(`\n✅ Catálogo concluído com sucesso! Salvo em 'all_cards_catalog.json' com ${catalog.length} cartas.`);
}

generateCatalog();
