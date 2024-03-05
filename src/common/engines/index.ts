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
import { ClaudeIcon } from '@/common/components/icons/ClaudeIcon'
import { Groq } from './groq'
import { GroqIcon } from '@/common/components/icons/GroqIcon'
import { Claude } from './claude'

export type Provider = 'OpenAI' | 'ChatGPT' | 'Azure' | 'MiniMax' | 'Moonshot' | 'Gemini' | 'Ollama' | 'Groq' | 'Claude'

export const engineIcons: Record<Provider, IconType> = {
    OpenAI: RiOpenaiFill,
    ChatGPT: RiOpenaiFill,
    Azure: VscAzureDevops,
    MiniMax: GiArtificialIntelligence,
    Moonshot: MoonshotIcon,
    Gemini: FaGoogle,
    Ollama: OllamaIcon,
    Groq: GroqIcon,
    Claude: ClaudeIcon,
}

export const providerToEngine: Record<Provider, { new (): IEngine }> = {
    OpenAI: OpenAI,
    ChatGPT: ChatGPT,
    Azure: Azure,
    MiniMax: MiniMax,
    Moonshot: Moonshot,
    Gemini: Gemini,
    Ollama: Ollama,
    Groq: Groq,
    Claude: Claude,
}

export function getEngine(provider: Provider): IEngine {
    const cls = providerToEngine[provider]
    return new cls()
}
