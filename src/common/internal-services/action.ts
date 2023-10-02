import { builtinActionModes } from '../constants'
import { TranslateMode } from '../translate'
import { Action, ActionOutputRenderingFormat, getLocalDB } from './db'

export interface ICreateActionOption {
    name: string
    group?: string
    mode?: TranslateMode
    icon?: string
    rolePrompt?: string
    commandPrompt?: string
    outputRenderingFormat?: ActionOutputRenderingFormat
}

export interface IUpdateActionOption {
    idx?: number
    name?: string
    group?: string
    mode?: TranslateMode
    icon?: string
    rolePrompt?: string
    commandPrompt?: string
    outputRenderingFormat?: ActionOutputRenderingFormat
}

export interface IActionInternalService {
    create(opt: ICreateActionOption): Promise<Action>
    update(action: Action, opt: IUpdateActionOption): Promise<Action>
    bulkPut(actions: Action[]): Promise<void>
    get(id: number): Promise<Action | undefined>
    getByMode(mode: string): Promise<Action | undefined>
    delete(id: number): Promise<void>
    list(): Promise<Action[]>
    count(): Promise<number>
    exportActions(filename: string, filteredActions: Action[]): Promise<void>
    importActions(file: File): Promise<void>
}

class ActionInternalService implements IActionInternalService {
    private get db() {
        return getLocalDB()
    }

    async create(opt: ICreateActionOption): Promise<Action> {
        if (!opt.name) {
            throw new Error('name is required')
        }
        return this.db.transaction('rw', this.db.action, async () => {
            const now = new Date().valueOf().toString()
            const action: Action = {
                idx: await this.db.action.count(),
                name: opt.name,
                mode: opt.mode,
                icon: opt.icon,
                rolePrompt: opt.rolePrompt,
                commandPrompt: opt.commandPrompt,
                outputRenderingFormat: opt.outputRenderingFormat,
                group: opt.group,
                createdAt: now,
                updatedAt: now,
            }
            const id = await this.db.action.add(action)
            action.id = id as number
            return action
        })
    }

    async update(action: Action, opt: IUpdateActionOption): Promise<Action> {
        return this.db.transaction('rw', this.db.action, async () => {
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
        })
    }

    async bulkPut(actions: Action[]): Promise<void> {
        await this.db.action.bulkPut(actions)
    }

    async get(id: number): Promise<Action | undefined> {
        return await this.db.action.get(id)
    }

    async getByGroup(group: string): Promise<Action | undefined> {
        return await this.db.action.get(group)
    }

    async getByMode(mode: string): Promise<Action | undefined> {
        return await this.db.action.where('mode').equals(mode).first()
    }

    async delete(id: number): Promise<void> {
        return this.db.transaction('rw', this.db.action, async () => {
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
        })
    }

    async list(): Promise<Action[]> {
        return this.db.transaction('rw', this.db.action, async () => {
            let count = await this.db.action.count()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const actions = await (this.db.action.orderBy('idx') as any).desc().toArray()
            builtinActionModes.forEach(async (m) => {
                const now = new Date().valueOf().toString()
                const action = actions.find((a: Action) => a.mode === m.mode)
                if (action) {
                    return
                }
                await this.db.action.add({
                    idx: count++,
                    name: m.name,
                    mode: m.mode,
                    icon: m.icon,
                    createdAt: now,
                    updatedAt: now,
                })
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (this.db.action.orderBy('idx') as any).toArray()
        })
    }

    async count(): Promise<number> {
        return await this.db.action.count()
    }

    async exportActions(filename: string, filteredActions: Action[]): Promise<void> {
        try {
            // 将数据对象转换为JSON字符串
            const jsonString = JSON.stringify(filteredActions, null, 2)

            // 创建一个新的<a>元素
            const link = document.createElement('a')

            // 检查浏览器是否支持下载属性
            if (link.download !== undefined) {
                // 将JSON字符串编码到data URL中
                const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString)

                // 设置<a>元素的href属性和download属性
                link.setAttribute('href', dataUrl)
                link.setAttribute('download', filename)

                // 将<a>元素添加到文档中
                document.body.appendChild(link)

                // 模拟点击<a>元素以触发下载
                link.click()

                // 从文档中删除<a>元素
                document.body.removeChild(link)
            } else {
                // 如果浏览器不支持下载属性，可能需要使用其他方法来触发下载
                console.error('Browser does not support the download attribute')
            }
        } catch (error) {
            console.error('Error exporting data to file:', error)
        }
    }

    async importActions(file: File): Promise<void> {
        try {
            // Read and parse file content
            const fileContent = await file.text()
            const parsedData = JSON.parse(fileContent)

            // Simple validation to check if parsedData is an array of actions
            if (!Array.isArray(parsedData)) {
                throw new Error('Invalid file format: Expected an array of actions')
            }
            for (const action of parsedData) {
                if (typeof action.name !== 'string' || typeof action.idx !== 'number') {
                    throw new Error('Invalid action format: Missing required properties')
                }
            }

            // Prepare actions for import
            const actions = parsedData.map((action) => ({
                ...action,
                id: undefined, // Remove id to allow the database to assign new ids
            }))

            // Import actions into the database
            await this.bulkPut(actions)
        } catch (error) {
            console.error('Error importing actions:', error)
            // Optionally, show an error message to the user
        }
    }
}

export const actionInternalService = new ActionInternalService()
