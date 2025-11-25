import { TradeImport, Trade, ConsolidationRequest } from '../types/tradeImport';
import { API_BASE_URL } from '../config/api';

export const tradeImportService = {
  async uploadCsv(file: File): Promise<TradeImport> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/imports/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload CSV');
    }

    return response.json();
  },

  async getAllImports(): Promise<TradeImport[]> {
    const response = await fetch(`${API_BASE_URL}/imports`);

    if (!response.ok) {
      throw new Error('Failed to fetch imports');
    }

    return response.json();
  },

  async getImportById(id: number): Promise<TradeImport> {
    const response = await fetch(`${API_BASE_URL}/imports/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch import');
    }

    return response.json();
  },

  async consolidate(id: number, request: ConsolidationRequest): Promise<TradeImport> {
    const response = await fetch(`${API_BASE_URL}/imports/${id}/consolidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to consolidate import');
    }

    return response.json();
  },

  async generateMXML(id: number): Promise<TradeImport> {
    const response = await fetch(`${API_BASE_URL}/imports/${id}/generate-mxml`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to generate MXML');
    }

    return response.json();
  },

  async pushToMurex(id: number): Promise<TradeImport> {
    const response = await fetch(`${API_BASE_URL}/imports/${id}/push-to-murex`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to push to Murex');
    }

    return response.json();
  },

  async downloadMXMLFile(fileId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/imports/mxml/${fileId}/download`);

    if (!response.ok) {
      throw new Error('Failed to download MXML file');
    }

    return response.blob();
  },

  async clearAllImports(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/imports/clear-all`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear all imports');
    }
  },

  async getOriginalTrades(id: number): Promise<Trade[]> {
    const response = await fetch(`${API_BASE_URL}/imports/${id}/trades/original`);

    if (!response.ok) {
      throw new Error('Failed to fetch original trades');
    }

    return response.json();
  },

  async getConsolidatedTrades(id: number): Promise<Trade[]> {
    const response = await fetch(`${API_BASE_URL}/imports/${id}/trades/consolidated`);

    if (!response.ok) {
      throw new Error('Failed to fetch consolidated trades');
    }

    return response.json();
  },

  async deleteImport(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/imports/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete import');
    }
  },

  async downloadAllMXMLFiles(id: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/imports/${id}/mxml/download-all`);

    if (!response.ok) {
      throw new Error('Failed to download MXML files');
    }

    return response.blob();
  },

  async clearAllConsolidatedImports(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/imports/consolidated/clear-all`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear all consolidated imports');
    }
  },

  async generateMXMLForAllConsolidated(): Promise<TradeImport[]> {
    const response = await fetch(`${API_BASE_URL}/imports/consolidated/generate-mxml-all`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to generate MXML for all consolidated imports');
    }

    return response.json();
  },

  async pushAllToMurex(): Promise<TradeImport[]> {
    const response = await fetch(`${API_BASE_URL}/imports/mxml/push-all-to-murex`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to push all MXML imports to Murex');
    }

    return response.json();
  },

  async clearAllMXMLImports(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/imports/mxml/clear-all`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear all MXML imports');
    }
  },

  async clearAllMurexImports(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/imports/murex/clear-all`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear all Murex imports');
    }
  },
};
