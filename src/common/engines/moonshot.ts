import { urlJoin } from 'url-join-ts'
import { getSettings } from '../utils'
import { AbstractOpenAI } from './abstract-openai'
import { IModel } from './interfaces'

export class Moonshot extends AbstractOpenAI {
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        let apiKey = apiKey_
        if (!apiKey) {
            apiKey = await this.getAPIKey()
        }
        const apiURL = await this.getAPIURL()
        if (!apiKey || !apiURL) {
            return []
        }
        const url = urlJoin(apiURL, '/v1/models')
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        })
        if (response.status !== 200) {
            if (response.status === 401) {
                throw new Error('Invalid API key')
            }
            if (response.status === 404) {
                throw new Error('Invalid API URL')
            }
            if (response.status === 403) {
                throw new Error('Invalid API Key')
            }
            throw new Error(`Failed to list models: ${response.statusText}`)
        }
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
