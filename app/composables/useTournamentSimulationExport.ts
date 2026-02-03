import type { Deck, MatchupWinRates } from '~~/common/types/tournament';

/**
 * Tournament simulation configuration interface for export/import
 */
export interface TournamentSimulationConfig {
  decks: Deck[];
  matchupWinRates: MatchupWinRates;
  numberOfRounds: number;
  numberOfPlayers: number;
  version?: string; // For future compatibility
}

/**
 * Composable for exporting and importing tournament simulation configurations as JSON
 */
export const useTournamentSimulationExport = () => {
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
   * Validates imported tournament simulation configuration
   */
  function validateConfig(config: unknown): config is TournamentSimulationConfig {
    if (!config || typeof config !== 'object') return false;

    const obj = config as Record<string, unknown>;

    if (!Array.isArray(obj.decks)) return false;
    if (!obj.matchupWinRates || typeof obj.matchupWinRates !== 'object') return false;
    if (typeof obj.numberOfRounds !== 'number') return false;
    if (typeof obj.numberOfPlayers !== 'number') return false;

    // Validate deck structure
    for (const deck of obj.decks) {
      if (!deck.name || typeof deck.name !== 'string') return false;
      if (typeof deck.presence !== 'number') return false;
    }

    return true;
  }

  /**
   * Exports tournament simulation configuration as JSON
   */
  function exportConfiguration(config: TournamentSimulationConfig): void {
    const exportData: TournamentSimulationConfig = {
      ...config,
      version: '1.0', // For future compatibility
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `tournament-simulation-${date}.json`;
    downloadJson(jsonContent, filename);
  }

  /**
   * Imports tournament simulation configuration from JSON file
   */
  function importConfiguration(
    onSuccess: (config: TournamentSimulationConfig) => void,
    onError?: (error: string) => void,
  ): void {
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
          const importedConfig = JSON.parse(jsonContent);

          if (!validateConfig(importedConfig)) {
            const errorMsg = 'Invalid tournament simulation configuration file';
            if (onError) {
              onError(errorMsg);
            } else {
              alert(errorMsg);
            }
            return;
          }

          onSuccess(importedConfig);
        } catch {
          const errorMsg = 'Invalid JSON file';
          if (onError) {
            onError(errorMsg);
          } else {
            alert(errorMsg);
          }
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  return {
    exportConfiguration,
    importConfiguration,
  };
};
