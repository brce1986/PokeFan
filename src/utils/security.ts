/**
 * Sanitiza texto livre (ex: termo de busca) antes de enviar à API.
 *
 * Antes, esta função também removia hífen, apóstrofo, aspas e ponto-e-vírgula
 * alegando "proteção contra SQL injection". Essa proteção nunca existiu de
 * verdade — o Supabase usa queries parametrizadas e o React escapa JSX
 * automaticamente — e o único efeito prático era mutilar nomes de carta
 * legítimos: "Ho-Oh" virava "HoOh" (a API devolve HTTP 500 pra esse nome
 * quebrado, deixando as 37 cartas de Ho-Oh inalcançáveis), "Farfetch'd" virava
 * "Farfetchd" (0 resultados nas 20 cartas existentes). O mesmo problema afeta
 * "Mr. Mime", "Will-o-Wisp", "Porygon-Z", "Jangmo-o" e "Type: Null".
 *
 * Agora só removemos o que é de fato perigoso (tags HTML/script) e
 * normalizamos espaços e tamanho. Hífen, apóstrofo e ponto são preservados.
 */
export const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove qualquer tag HTML/script
    .replace(/\s+/g, ' ') // Normaliza espaços em excesso
    .trim()
    .slice(0, 100); // Limite de tamanho para evitar entrada absurda
};

/**
 * Valida se um ID de carta Pokémon segue o formato esperado (ex: sv3pt5-6 ou swsh9-122)
 * para evitar injeções ou caminhos arbitrários.
 */
export const isValidCardId = (id: string): boolean => {
  return /^[a-z0-9\-]+$/i.test(id);
};

/**
 * Valida caminhos de arquivos locais de scan.
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  // Mantém apenas letras, números, hífen, underline e ponto
  return fileName.replace(/[^a-zA-Z0-9_\-\.]/g, '');
};
