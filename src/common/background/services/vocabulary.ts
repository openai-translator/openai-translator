import { VocabularyItem } from '../../internal-services/db'
import { IVocabularyInternalService } from '../../internal-services/vocabulary'
import { callMethod } from './base'

class BackgroundVocabularyService implements IVocabularyInternalService {
    async putItem(item: VocabularyItem): Promise<void> {
        return await callMethod('vocabularyService', 'putItem', [item])
    }

    async getItem(word: string): Promise<VocabularyItem | undefined> {
        return await callMethod('vocabularyService', 'getItem', [word])
    }

    async deleteItem(word: string): Promise<void> {
        return await callMethod('vocabularyService', 'deleteItem', [word])
    }

    async countItems(): Promise<number> {
        return await callMethod('vocabularyService', 'countItems', [])
    }

    async listItems(): Promise<VocabularyItem[]> {
        return await callMethod('vocabularyService', 'listItems', [])
    }

    async listRandomItems(limit: number): Promise<VocabularyItem[]> {
        return await callMethod('vocabularyService', 'listRandomItems', [limit])
    }

    async listFrequencyItems(limit: number): Promise<VocabularyItem[]> {
        return await callMethod('vocabularyService', 'listFrequencyItems', [limit])
    }

    async isCollected(word: string): Promise<boolean> {
        return await callMethod('vocabularyService', 'isCollected', [word])
    }
}

export const backgroundVocabularyService = new BackgroundVocabularyService()
