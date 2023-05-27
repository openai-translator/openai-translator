import { getLocalDB, VocabularyItem } from './db'

export interface IVocabularyInternalService {
    putItem(item: VocabularyItem): Promise<void>
    getItem(word: string): Promise<VocabularyItem | undefined>
    deleteItem(word: string): Promise<void>
    countItems(): Promise<number>
    listItems(): Promise<VocabularyItem[]>
    listRandomItems(limit: number): Promise<VocabularyItem[]>
    listFrequencyItems(limit: number): Promise<VocabularyItem[]>
    isCollected(word: string): Promise<boolean>
}

class VocabularyInternalService implements IVocabularyInternalService {
    private get db() {
        return getLocalDB()
    }

    public async putItem(item: VocabularyItem): Promise<void> {
        await this.db.vocabulary.put(item)
    }

    public async getItem(word: string): Promise<VocabularyItem | undefined> {
        return await this.db.vocabulary.get(word)
    }

    public async deleteItem(word: string): Promise<void> {
        await this.db.vocabulary.delete(word)
    }

    public async listFrequencyItems(limit: number): Promise<VocabularyItem[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (this.db.vocabulary.orderBy('reviewCount') as any).desc().limit(limit).toArray()
    }

    public async countItems(): Promise<number> {
        return await this.db.vocabulary.count()
    }

    public async isCollected(word: string): Promise<boolean> {
        const count = await this.db.vocabulary.where('word').equals(word).count()
        return count > 0
    }

    public async listItems(): Promise<VocabularyItem[]> {
        return await this.db.vocabulary.toArray()
    }

    public async listRandomItems(limit: number): Promise<VocabularyItem[]> {
        const collectedWordTotal = await this.db.vocabulary.count()
        if (collectedWordTotal <= limit) {
            return await this.db.vocabulary.toArray()
        }
        const randomVocabularyItems: VocabularyItem[] = []
        const idxSeen: Set<number> = new Set([])
        while (idxSeen.size < limit) {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const idx = Math.floor(collectedWordTotal * Math.random())
                if (idxSeen.has(idx)) {
                    continue
                }
                idxSeen.add(idx)
                const words_ = await this.db.vocabulary.offset(idx).limit(1).toArray()
                randomVocabularyItems.push(words_[0])
                break
            }
        }
        return randomVocabularyItems
    }
}

export const vocabularyInternalService = new VocabularyInternalService()
