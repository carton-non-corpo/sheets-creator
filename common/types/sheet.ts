import type { EnhancedFile } from './drive'

export interface Sheet {
    id: string;
    name: string;
    content: SheetContentCard[];
}

export interface SheetContentCard extends EnhancedFile {
    quantity: number;
}
