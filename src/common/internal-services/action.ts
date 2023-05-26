import { Action, LocalDB, getLocalDB } from './db'

export interface IActionInternalService {
    put(action: Action): Promise<void>
    get(id: number): Promise<Action | undefined>
    delete(id: number): Promise<void>
    list(): Promise<Action[]>
    count(): Promise<number>
}

class ActionInternalService implements IActionInternalService {
    db: LocalDB

    constructor() {
        this.db = getLocalDB()
    }

    async put(action: Action): Promise<void> {
        await this.db.action.put(action)
    }

    async get(id: number): Promise<Action | undefined> {
        return await this.db.action.get(id)
    }

    async delete(id: number): Promise<void> {
        return await this.db.action.delete(id)
    }

    async list(): Promise<Action[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (this.db.action.orderBy('id') as any).desc().toArray()
    }

    async count(): Promise<number> {
        return await this.db.action.count()
    }
}

export const actionInternalService = new ActionInternalService()
