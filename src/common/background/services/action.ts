import { IActionInternalService, ICreateActionOption, IUpdateActionOption } from '../../internal-services/action'
import { Action } from '../../internal-services/db'
import { callMethod } from './base'

class BackgroundActionService implements IActionInternalService {
    create(opt: ICreateActionOption): Promise<Action> {
        return callMethod('actionService', 'create', [opt])
    }
    update(action: Action, opt: IUpdateActionOption): Promise<Action> {
        return callMethod('actionService', 'update', [action, opt])
    }
    bulkPut(actions: Action[]): Promise<void> {
        return callMethod('actionService', 'bulkPut', [actions])
    }
    get(id: number): Promise<Action | undefined> {
        return callMethod('actionService', 'get', [id])
    }
    getByMode(mode: string): Promise<Action | undefined> {
        return callMethod('actionService', 'getByMode', [mode])
    }
    delete(id: number): Promise<void> {
        return callMethod('actionService', 'delete', [id])
    }
    list(): Promise<Action[]> {
        return callMethod('actionService', 'list', [])
    }
    count(): Promise<number> {
        return callMethod('actionService', 'count', [])
    }
}

export const backgroundActionService = new BackgroundActionService()
