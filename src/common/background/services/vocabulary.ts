/* eslint-disable @typescript-eslint/no-explicit-any */
import { VocabularyItem } from '../../internal-services/db'
import { IVocabularyInternalService } from '../../internal-services/vocabulary'
import { BackgroundEventNames } from '../eventnames'

const callMethod = async (methodName: string, args: any[]): Promise<any> => {
    const browser = await require('webextension-polyfill')
    const resp = await browser.runtime.sendMessage({
        type: BackgroundEventNames.vocabularyService,
        method: methodName,
        args: args,
    })
    return resp.result
}

class BackgroundVocabularyService implements IVocabularyInternalService {
    async putItem(item: VocabularyItem): Promise<void> {
        return await callMethod('putItem', [item])
    }

    async getItem(word: string): Promise<VocabularyItem | undefined> {
        return await callMethod('getItem', [word])
    }

    async deleteItem(word: string): Promise<void> {
        return await callMethod('deleteItem', [word])
    }

    async countItems(): Promise<number> {
        return await callMethod('countItems', [])
    }

    async listItems(): Promise<VocabularyItem[]> {
        return await callMethod('listItems', [])
    }

    async listRandomItems(limit: number): Promise<VocabularyItem[]> {
        return await callMethod('listRandomItems', [limit])
    }

    async listFrequencyItems(limit: number): Promise<VocabularyItem[]> {
        return await callMethod('listFrequencyItems', [limit])
    }

    async isCollected(word: string): Promise<boolean> {
        return await callMethod('isCollected', [word])
    }
}

export const backgroundVocabularyService = new BackgroundVocabularyService()
