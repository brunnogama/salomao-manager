import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do PDF.js dinamicamente pelo CDN global de acordo com a versão exata instalada.
// Na versão 5+, o pdf.js utiliza .mjs no build
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Converte um arquivo PDF de múltiplas páginas em um único arquivo de imagem JPEG (Panorâmico Vertical).
 * Retorna o Arquivo .jpeg com o mesmo nome base do original.
 */
export async function convertPdfToTallImage(file: File, scale = 1.5): Promise<File> {
  // 1. Carrega o arquivo na memória e passa para a engine do PDF.js
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  // Limite de segurança: renderizar apenas até as primeiras 10 páginas para evitar esgotamento de RAM
  const numPages = Math.min(pdf.numPages, 10);
  
  // 2. Pré-calculamos as dimensões de TODAS as páginas para criar um único layout grandioso.
  let totalHeight = 0;
  let maxWidth = 0;
  const pagesData: { page: any; viewport: any; height: number; width: number }[] = [];
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    totalHeight += viewport.height;
    if (viewport.width > maxWidth) {
      maxWidth = viewport.width;
    }
    pagesData.push({ page, viewport, height: viewport.height, width: viewport.width });
  }
  
  // Se não tem páginas, retorna erro.
  if (pagesData.length === 0) {
    throw new Error("O PDF não possui páginas válidas.");
  }

  // 3. Cria o Canvas longo contendo a soma das alturas de todas as páginas.
  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Não foi possível iniciar o Canvas 2D");
  
  // Pode ser que uma página seja mais estreita que a outra, então preenchemos o fundo com branco.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 4. Desenha as as páginas em sequência de cima para baixo
  let currentYOffset = 0;
  for (const pData of pagesData) {
    // Para simplificar, desenhamos a página num mini-canvas e copiamos pro canvas grandão
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = pData.width;
    tempCanvas.height = pData.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    await pData.page.render({
      canvasContext: tempCtx!,
      viewport: pData.viewport
    }).promise;
    
    // Cola o mini canvas no Y centralizado (casos bizarros de páginas minúsculas misturadas com A4)
    const xOffset = (maxWidth - pData.width) / 2;
    ctx.drawImage(tempCanvas, xOffset, currentYOffset);
    currentYOffset += pData.height;
  }
  
  // 5. Encapsula o resultado final num File do formato JPG (Otimizado)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return reject(new Error("Falha ao embutir Imagem JPG final."));
      }
      const newName = file.name.replace(/\.pdf$/i, '_thumb.jpg');
      const jpegFile = new File([blob], newName, { type: 'image/jpeg' });
      resolve(jpegFile);
    }, 'image/jpeg', 0.85); // 85% de qualidade JPEG
  });
}
