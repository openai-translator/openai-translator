import Dexie, { Table } from 'dexie'

export interface VocabularyItem {
    word: string
    reviewCount: number
    description: string
    updatedAt: string
    createdAt: string
    [prop: string]: string | number
}

export interface Action {
    id?: number
    name: string
    icon: string
    rolePrompt: string
    commandPrompt: string
    updatedAt: string
    createdAt: string
}

export class LocalDB extends Dexie {
    vocabulary!: Table<VocabularyItem>
    action!: Table<Action>

    constructor() {
        super('openai-translator')
        this.version(2).stores({
            vocabulary: 'word, reviewCount, description, updatedAt, createdAt',
            action: '++id, name, icon, rolePrompt, commandPrompt, updatedAt, createdAt',
        })
    }
}

let localDB: LocalDB

export const getLocalDB = () => {
    if (!localDB) {
        localDB = new LocalDB()
    }
    return localDB
}
