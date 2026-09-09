/**
 * Funcao estrita para garantir que NENHUM produto sem foto valida apareca na loja de vendas.
 */
export function hasValidPhoto(produto: any): boolean {
  if (!produto || !produto.imagens) return false;

  let imgs: string[] = [];
  if (Array.isArray(produto.imagens)) {
    imgs = produto.imagens;
  } else if (typeof produto.imagens === 'string') {
    try {
      const parsed = JSON.parse(produto.imagens);
      if (Array.isArray(parsed)) imgs = parsed;
    } catch {
      if (produto.imagens.startsWith('http') || produto.imagens.startsWith('/')) {
        imgs = [produto.imagens];
      }
    }
  }

  if (imgs.length === 0) return false;

  const firstImg = imgs[0];
  if (typeof firstImg !== 'string' || !firstImg.trim()) return false;

  const lower = firstImg.toLowerCase().trim();
  if (
    lower.includes('placeholder') ||
    lower.includes('no-image') ||
    lower.includes('sem-foto') ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return false;
  }

  return lower.startsWith('http') || lower.startsWith('/');
}
