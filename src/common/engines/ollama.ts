import { getSettings } from '../utils'
import { AbstractOpenAI } from './abstract-openai'
import { IModel } from './interfaces'

export class Ollama extends AbstractOpenAI {
    isLocal() {
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        return [
            { id: 'llama2', name: 'Llama 2' },
            { id: 'mistral', name: 'Mistral' },
            { id: 'dolphin-phi', name: 'Dolphin Phi' },
            { id: 'phi', name: 'Phi-2' },
            { id: 'neural-chat', name: 'Neural Chat' },
            { id: 'starling-lm', name: 'Starling' },
            { id: 'codellama', name: 'Code Llama' },
            { id: 'llama2-uncensored', name: 'Llama 2 Uncensored' },
            { id: 'llama2:13b', name: 'Llama 2 13B' },
            { id: 'llama2:70b', name: 'Llama 2 70B' },
            { id: 'orca-mini', name: 'Orca Mini' },
            { id: 'vicuna', name: 'Vicuna' },
            { id: 'llava', name: 'LLaVA' },
            { id: 'gemma:2b', name: 'Gemma 2B' },
            { id: 'gemma:7b', name: 'Gemma 7B' },
        ]
    }

    async getAPIModel(): Promise<string> {
        const settings = await getSettings()
        return settings.ollamaAPIModel
    }

    async getAPIKey(): Promise<string> {
        return 'donotneed'
    }

    async getAPIURL(): Promise<string> {
        const settings = await getSettings()
        return settings.ollamaAPIURL
    }

    async getAPIURLPath(): Promise<string> {
        return '/v1/chat/completions'
    }
}
