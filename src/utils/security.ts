/**
 * Sanitiza inputs de texto para prevenir injeções de SQL, script e tags HTML.
 */
export const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove qualquer tag HTML/script
    .replace(/['";\-]/g, '') // Remove caracteres especiais de SQL
    .trim();
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
