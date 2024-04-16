import { IEngine, IMessageRequest, IModel } from './interfaces'

export abstract class AbstractEngine implements IEngine {
    async checkLogin(): Promise<boolean> {
        return true
    }
    isLocal() {
        return false
    }
    supportCustomModel() {
        return false
    }
    abstract getModel(): Promise<string>
    abstract listModels(apiKey: string | undefined): Promise<IModel[]>
    abstract sendMessage(req: IMessageRequest): Promise<void>
}
