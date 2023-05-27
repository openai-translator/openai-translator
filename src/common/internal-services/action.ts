import { Action, LocalDB, getLocalDB } from './db'

export interface ICreateActionOption {
    name: string
    mode?: string
    icon?: string
    rolePrompt?: string
    commandPrompt?: string
}

export interface IUpdateActionOption {
    idx?: number
    name?: string
    mode?: string
    icon?: string
    rolePrompt?: string
    commandPrompt?: string
}

export interface IActionInternalService {
    create(opt: ICreateActionOption): Promise<Action>
    update(action: Action, opt: IUpdateActionOption): Promise<Action>
    get(id: number): Promise<Action | undefined>
    getByMode(mode: string): Promise<Action | undefined>
    delete(id: number): Promise<void>
    list(): Promise<Action[]>
    count(): Promise<number>
}

class ActionInternalService implements IActionInternalService {
    db: LocalDB

    constructor() {
        this.db = getLocalDB()
    }

    async create(opt: ICreateActionOption): Promise<Action> {
        const now = new Date().valueOf().toString()
        const action: Action = {
            idx: await this.db.action.count(),
            name: opt.name,
            mode: opt.mode,
            icon: opt.icon,
            rolePrompt: opt.rolePrompt,
            commandPrompt: opt.commandPrompt,
            createdAt: now,
            updatedAt: now,
        }
        const id = await this.db.action.add(action)
        action.id = id as number
        return action
    }

    async update(action: Action, opt: IUpdateActionOption): Promise<Action> {
        if (opt.idx !== undefined) {
            let actions: Action[]
            if (action.idx < opt.idx) {
                actions = await this.db.action.where('idx').between(action.idx, opt.idx).toArray()
                actions.forEach((a) => a.idx--)
            } else {
                actions = await this.db.action.where('idx').between(opt.idx, action.idx).toArray()
                actions.forEach((a) => a.idx++)
            }
            await this.db.action.bulkPut(actions)
        }
        const now = new Date().valueOf().toString()
        const newAction = {
            ...action,
            ...opt,
            updatedAt: now,
        }
        await this.db.action.update(action.id as number, newAction)
        return newAction
    }

    async get(id: number): Promise<Action | undefined> {
        return await this.db.action.get(id)
    }

    async getByMode(mode: string): Promise<Action | undefined> {
        return await this.db.action.where('mode').equals(mode).first()
    }

    async delete(id: number): Promise<void> {
        const action = await this.db.action.get(id)
        if (!action) {
            return
        }
        if (action.mode) {
            return
        }
        const actions = await this.db.action.where('idx').above(action.idx).toArray()
        actions.forEach((a) => a.idx--)
        await this.db.action.bulkPut(actions)
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
