import { IActionInternalService } from '../../internal-services/action'
import { Action } from '../../internal-services/db'
import { callMethod } from './base'

class BackgroundActionService implements IActionInternalService {
    async put(action: Action): Promise<void> {
        return await callMethod('actionService', 'put', [action])
    }

    async get(id: number): Promise<Action | undefined> {
        return await callMethod('actionService', 'get', [id])
    }

    async delete(id: number): Promise<void> {
        return await callMethod('actionService', 'delete', [id])
    }

    async list(): Promise<Action[]> {
        return await callMethod('actionService', 'list', [])
    }

    async count(): Promise<number> {
        return await callMethod('actionService', 'count', [])
    }
}

export const backgroundActionService = new BackgroundActionService()
