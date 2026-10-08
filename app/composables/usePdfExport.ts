import type { SheetContentCard, SheetPage } from '~~/common/types/sheet';
import type { CardFormat } from '~~/common/types/games';
import { CARD_FORMAT_LAYOUTS, getCardsPerPage, getLandmarksUrl } from '~~/common/utils/card-formats';

/**
 * Composable for exporting strip board pages to PDF
 * Uses browser's native print functionality to generate PDFs without external libraries
 */
export const usePdfExport = () => {
  /**
   * Generates CSS styles for PDF pages
   * Includes A4 sizing, grid layout, and print-specific styles
   * Page and grid sizes depend on the card format and are set inline on each page
   */
  function generatePageStyles(): string {
    return `
      /* A4 page setup with no margins */
      @page {
        size: A4 portrait;
        margin: 0;
      }

      /* Named page so landscape pages can be mixed with portrait ones */
      @page landscape {
        size: A4 landscape;
        margin: 0;
      }

      .page-landscape {
        page: landscape;
      }
      
      /* Reset body styles for consistent rendering */
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      /* Page container */
      .page {
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
      
      /* Prevent browser from adding extra space, without clipping landscape pages wider than the first page */
      html, body {
        height: auto;
        overflow-x: visible;
        overflow-y: clip;
      }
      
      /* Cards grid, columns and rows are set per page */
      .cards-grid {
        display: grid;
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
  async function generateLandmarksSvg(format: CardFormat, bleed: number): Promise<string> {
    const response = await fetch(getLandmarksUrl(format, bleed));
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
   * Fills empty slots to maintain the grid layout of the page format
   */
  async function generatePageHtml(pageData: SheetPage): Promise<string> {
    const { cardWidth, cardHeight, columns, rows, pageWidth, pageHeight } = CARD_FORMAT_LAYOUTS[pageData.format];
    const emptySlots = getCardsPerPage(pageData.format) - pageData.cards.length;
    const emptySlotsHtml = Array.from({ length: emptySlots }, () =>
      '<div class="card-slot empty-slot"></div>',
    ).join('');

    const landmarksSvg = await generateLandmarksSvg(pageData.format, pageData.bleed);

    const pageStyle = `width: ${pageWidth}mm; height: ${pageHeight}mm;`;
    const gridStyle = `grid-template-columns: repeat(${columns}, ${cardWidth + pageData.bleed * 2}mm); grid-template-rows: repeat(${rows}, ${cardHeight + pageData.bleed * 2}mm);`;

    return `
      <div class="page ${pageWidth > pageHeight ? 'page-landscape' : ''}" style="${pageStyle}">
        <div class="cards-grid" style="${gridStyle}">
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
  async function generateHtmlDocument(pages: SheetPage[], title: string): Promise<string> {
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
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
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
  async function exportAllPages(pages: SheetPage[], sheetName?: string): Promise<void> {
    const title = `Carton Club - ${sheetName || 'Planches'}`;
    const filename = `${sheetName || 'sheet'}-all-pages.pdf`;
    const htmlContent = await generateHtmlDocument(pages, title);
    await downloadPdf(htmlContent, filename);
  }

  /**
   * Exports a single page as a PDF document
   */
  async function exportSinglePage(pageData: SheetPage, sheetName?: string): Promise<void> {
    const title = `Sheet Page ${pageData.pageNumber} - ${sheetName || 'Planche'}`;
    const filename = `${sheetName || 'sheet'}-page-${pageData.pageNumber}.pdf`;
    const htmlContent = await generateHtmlDocument([pageData], title);
    await downloadPdf(htmlContent, filename);
  }

  // Public API
  return {
    exportAllPages,
    exportSinglePage,
  };
};
