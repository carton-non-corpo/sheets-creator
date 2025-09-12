import type { SheetContentCard } from '~~/common/types/sheet';

/**
 * Interface for page data structure used in PDF generation
 */
interface PageData {
  pageNumber: number;
  cards: Array<SheetContentCard & { printIndex: number }>;
  bleed: number; // in mm, e.g., 0 or 1
}

/**
 * Composable for exporting strip board pages to PDF
 * Uses browser's native print functionality to generate PDFs without external libraries
 */
export const usePdfExport = () => {
  // Constants
  const CARDS_PER_PAGE = 9; // 3x3 grid layout
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const CARD_WIDTH_MM = 63;
  const CARD_HEIGHT_MM = 88;

  /**
   * Generates CSS styles for PDF pages
   * Includes A4 sizing, grid layout, and print-specific styles
   */
  function generatePageStyles(): string {
    return `
      /* A4 page setup with no margins */
      @page {
        size: A4;
        margin: 0;
      }
      
      /* Reset body styles for consistent rendering */
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      /* Page container with A4 dimensions */
      .page {
        width: ${A4_WIDTH_MM}mm;
        height: ${A4_HEIGHT_MM}mm;
        display: flex;
        flex-direction: column;
        background: white;
        position: relative; /* Required for absolute positioning of landmarks */
      }
      
      /* Page break configuration - only between pages, not after last page */
      .page:not(:last-child) {
        page-break-after: always;
      }
      
      .page:last-child {
        page-break-after: never;
      }
      
      /* Prevent browser from adding extra space */
      html, body {
        height: auto;
        overflow: hidden;
      }
      
      /* 3x3 grid layout for cards */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(3, ${CARD_WIDTH_MM}mm);
        grid-template-rows: repeat(3, ${CARD_HEIGHT_MM}mm);
        place-content: center;
        width: 100%;
        height: 100%;
      }
      
      /* Individual card slot styling */
      .card-slot {
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
      }
      
      /* Card images - fill entire slot */
      .card-slot img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      /* Placeholder for cards without images */
      .card-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 12px;
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
      }
      
      .card-placeholder span {
        color: #6b7280;
        font-size: 12px;
        word-break: break-all;
        text-align: center;
      }
      
      /* Empty slots styling */
      .empty-slot {
        border: 1px solid #f3f4f6;
      }
      
      /* Cutting guidelines overlay */
      .landmarks {
        position: absolute;
        inset: 0;
        pointer-events: none; 
      }
      
      /* Print-specific optimizations */
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        
        /* Ensure no page break after final page */
        body > .page:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
      }
    `;
  }

  /**
   * Generates SVG cutting guidelines (landmarks) for professional printing
   * These lines help with precise cutting of the printed cards
   */
  async function generateLandmarksSvg(bleed: number): Promise<string> {
    let svgPath = '';
    switch (bleed) {
    case 1:
      // get /app/assets/landmarks-1mm-bleed.svg content
      svgPath = '/landmarks-bleed-1mm.svg';
      break;
    case 0:
    default:
      // get /app/assets/landmarks-no-bleed.svg content
      svgPath = '/landmarks-bleed-0mm.svg';
      break;
    }

    const response = await fetch(svgPath);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.status}`);
    }

    const svgContent = await response.text();
    return svgContent;
  }

  /**
   * Generates HTML for a single card slot
   * Handles both image cards and placeholder cards
   */
  function generateCardHtml(card: SheetContentCard & { printIndex: number }): string {
    return `
      <div class="card-slot">
        ${card.imageUrl
    ? `<img src="${card.imageUrl}" alt="${card.name || 'Card image'}" />`
    : `<div class="card-placeholder"><span>${card.name || 'No image'}</span></div>`
}
      </div>
    `;
  }

  /**
   * Generates HTML for a complete page with cards and cutting guidelines
   * Fills empty slots to maintain 3x3 grid layout
   */
  async function generatePageHtml(pageData: PageData): Promise<string> {
    const emptySlots = CARDS_PER_PAGE - pageData.cards.length;
    const emptySlotsHtml = Array.from({ length: emptySlots }, () =>
      '<div class="card-slot empty-slot"></div>',
    ).join('');

    const landmarksSvg = await generateLandmarksSvg(pageData.bleed);

    return `
      <div class="page">
        <div class="cards-grid">
          ${pageData.cards.map(card => generateCardHtml(card)).join('')}
          ${emptySlotsHtml}
        </div>
        <div class="landmarks">
          ${landmarksSvg}
        </div>
      </div>
    `;
  }

  /**
   * Generates complete HTML document for PDF export
   * Includes all necessary styles and page content
   */
  async function generateHtmlDocument(pages: PageData[], title: string): Promise<string> {
    const pageHtmlPromises = pages.map(page => generatePageHtml(page));
    const pagesHtml = await Promise.all(pageHtmlPromises);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${generatePageStyles()}
        </style>
      </head>
      <body>
        ${pagesHtml.join('')}
      </body>
      </html>
    `;
  }

  /**
   * Waits for all images in the document to load
   * Ensures all content is rendered before PDF generation
   */
  function waitForImages(doc: Document): Promise<void> {
    const images = Array.from(doc.images);
    if (images.length === 0) return Promise.resolve();

    const imagePromises = images.map(img => {
      if (img.complete) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
      });
    });

    return Promise.all(imagePromises).then(() => { });
  }

  /**
   * Creates a hidden iframe, renders content, and triggers PDF download
   * Uses browser's native print functionality to generate PDF
   */
  async function downloadPdf(htmlContent: string, _filename: string): Promise<void> {
    try {
      // Create invisible iframe for rendering
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px'; // Move off-screen
      iframe.style.width = `${A4_WIDTH_MM}mm`;
      iframe.style.height = `${A4_HEIGHT_MM}mm`;
      document.body.appendChild(iframe);

      // Get iframe document for content manipulation
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
      }

      // Write HTML content to iframe
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for all images to load before printing
      await waitForImages(iframe.contentWindow!.document);

      // Focus iframe and trigger print dialog
      // User can save as PDF from the print dialog
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up iframe after print dialog closes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  }

  /**
   * Exports all pages as a single PDF document
   */
  async function exportAllPages(pages: PageData[], sheetName?: string): Promise<void> {
    const title = `Carton Club - ${sheetName || 'Planches'}`;
    const filename = `${sheetName || 'sheet'}-all-pages.pdf`;
    const htmlContent = await generateHtmlDocument(pages, title);
    await downloadPdf(htmlContent, filename);
  }

  /**
   * Exports a single page as a PDF document
   */
  async function exportSinglePage(pageData: PageData, sheetName?: string): Promise<void> {
    const title = `Sheet Page ${pageData.pageNumber} - ${sheetName || 'Planche'}`;
    const filename = `${sheetName || 'sheet'}-page-${pageData.pageNumber}.pdf`;
    const htmlContent = await generateHtmlDocument([pageData], title);
    await downloadPdf(htmlContent, filename);
  }

  // Public API
  return {
    cardsPerPage: CARDS_PER_PAGE,
    exportAllPages,
    exportSinglePage,
  };
};
