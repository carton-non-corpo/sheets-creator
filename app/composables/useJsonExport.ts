import type { Sheet } from '~~/common/types/sheet';

/**
 * Composable for exporting and importing sheets as JSON
 * Simple export/import functionality without complex transformations
 */
export const useJsonExport = () => {
  /**
   * Downloads JSON data as a file
   */
  function downloadJson(jsonContent: string, filename: string): void {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exports current sheet as JSON
   */
  function exportSheetsAsJson(): void {
    const sheetStore = useSheetStore();
    const { sheet } = storeToRefs(sheetStore);

    if (!sheet.value) {
      alert('No sheet to export');
      return;
    }

    const jsonContent = JSON.stringify(sheet.value, null, 2);
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `carton-club-sheets-${date}.json`;
    downloadJson(jsonContent, filename);
  }

  /**
   * Imports sheet from JSON file and replaces current sheet
   */
  function importSheetsAsJson(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const jsonContent = e.target?.result as string;
          const sheet = JSON.parse(jsonContent) as Sheet;
          const sheetStore = useSheetStore();
          sheetStore.sheet = sheet;
        } catch {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  return {
    exportSheetsAsJson,
    importSheetsAsJson,
  };
};
