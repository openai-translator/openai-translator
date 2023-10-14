import { getLocalDB, arkoseToken } from './db'
import { arkoseTokenGenerator } from '../arkose/generator'

export interface IarkoseTokenInternalService {
    putItem(item: arkoseToken): Promise<void>
    getNextValidToken(): Promise<string | undefined>
    initializeTokens(): Promise<void>
    initializeTokenInternalService(): void
    getTokenInternalService(): TokenInternalService | null
}

class TokenInternalService implements IarkoseTokenInternalService {
    initializeTokenInternalService(): void {
        throw new Error('Method not implemented.')
    }
    getTokenInternalService(): TokenInternalService | null {
        throw new Error('Method not implemented.')
    }
    private get db() {
        return getLocalDB()
    }

    public async putItem(item: arkoseToken): Promise<void> {
        const count = await this.db.arkoseToken.count()
        if (count >= 3) {
            const oldestItem = await this.db.arkoseToken.orderBy('timestamp').first()
            if (oldestItem) {
                await this.db.arkoseToken.delete(oldestItem.value)
            }
        }
        item.timestamp = new Date().getTime()
        await this.db.arkoseToken.put(item)
    }

    public async getNextValidToken(): Promise<string | undefined> {
        const oldestItem = await this.db.arkoseToken.orderBy('timestamp').first()
        if (!oldestItem) {
            const newTokenValue = await arkoseTokenGenerator.generate()
            if (newTokenValue) {
                const newToken: arkoseToken = { value: newTokenValue, timestamp: new Date().getTime() }
                await this.putItem(newToken)
            }
            return newTokenValue
        }
        await this.db.arkoseToken.delete(oldestItem.value)
        return oldestItem.value
    }

    public async initializeTokens(): Promise<void> {
        const currentCount = await this.db.arkoseToken.count()
        const tokensToGenerate = 3 - currentCount

        for (let i = 0; i < tokensToGenerate; i++) {
            const newTokenValue = await arkoseTokenGenerator.generate()
            if (newTokenValue) {
                const newToken: arkoseToken = { value: newTokenValue, timestamp: new Date().getTime() }
                await this.putItem(newToken)
            }
        }
    }
}

let tokenInternalService: TokenInternalService

// 初始化函数
export function initializeTokenInternalService() {
    tokenInternalService = new TokenInternalService()
}

// Getter 函数
export function getTokenInternalService(): TokenInternalService {
    return tokenInternalService
}
