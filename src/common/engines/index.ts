import { RiOpenaiFill } from 'react-icons/ri'
import { Azure } from './azure'
import { ChatGPT } from './chatgpt'
import { Gemini } from './gemini'
import { IEngine } from './interfaces'
import { MiniMax } from './minimax'
import { Moonshot } from './moonshot'
import { OpenAI } from './openai'
import { IconType } from 'react-icons'
import { VscAzureDevops } from 'react-icons/vsc'
import { FaGoogle } from 'react-icons/fa'
import { GiArtificialIntelligence } from 'react-icons/gi'
import { Ollama } from './ollama'
import { OllamaIcon } from '@/common/components/icons/OllamaIcon'
import { MoonshotIcon } from '@/common/components/icons/MoonshotIcon'
import { Groq } from './groq'
import { GroqIcon } from '@/common/components/icons/GroqIcon'

export type Provider = 'OpenAI' | 'ChatGPT' | 'Azure' | 'MiniMax' | 'Moonshot' | 'Gemini' | 'Ollama' | 'Groq'

export const engineIcons: Record<Provider, IconType> = {
    OpenAI: RiOpenaiFill,
    ChatGPT: RiOpenaiFill,
    Azure: VscAzureDevops,
    MiniMax: GiArtificialIntelligence,
    Moonshot: MoonshotIcon,
    Gemini: FaGoogle,
    Ollama: OllamaIcon,
    Groq: GroqIcon,
}

export function getEngine(provider: Provider): IEngine {
    let engine: IEngine = new OpenAI()
    switch (provider) {
        case 'Azure':
            engine = new Azure()
            break
        case 'ChatGPT':
            engine = new ChatGPT()
            break
        case 'MiniMax':
            engine = new MiniMax()
            break
        case 'Moonshot':
            engine = new Moonshot()
            break
        case 'Gemini':
            engine = new Gemini()
            break
        case 'Ollama':
            engine = new Ollama()
            break
        case 'Groq':
            engine = new Groq()
            break
    }
    return engine
}
