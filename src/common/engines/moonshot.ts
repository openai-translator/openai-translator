import { getSettings } from '../utils'
import { AbstractOpenAI } from './abstract-openai'
import { IModel } from './interfaces'

export class Moonshot extends AbstractOpenAI {
    async listModels(): Promise<IModel[]> {
        const apiKey = await this.getAPIKey()
        const apiURL = await this.getAPIURL()
        const url = `${apiURL}/v1/models`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        })
        const json = await response.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return json.data.map((model: any) => {
            return {
                id: model.id,
                name: model.id,
            }
        })
    }

    async getAPIModel(): Promise<string> {
        const settings = await getSettings()
        return settings.moonshotAPIModel
    }
    async getAPIKey(): Promise<string> {
        const settings = await getSettings()
        return settings.moonshotAPIKey
    }
    async getAPIURL(): Promise<string> {
        return 'https://api.moonshot.cn'
    }
    async getAPIURLPath(): Promise<string> {
        return '/v1/chat/completions'
    }
}
