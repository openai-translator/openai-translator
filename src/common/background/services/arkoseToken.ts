import { arkoseToken } from '../../internal-services/db'
import { IarkoseTokenInternalService } from '../../internal-services/arkoseToken'
import { callMethod } from './base'

class BackgroundTokenService implements IarkoseTokenInternalService {
    async putItem(item: arkoseToken): Promise<void> {
        return await callMethod('tokenInternalService', 'putItem', [item])
    }

    async getNextValidToken(): Promise<string | undefined> {
        return await callMethod('tokenInternalService', 'getNextValidToken', [])
    }
    async initializeTokens(): Promise<void> {
        return await callMethod('tokenInternalService', 'getNextValidToken', [])
    }
    initializeTokenInternalService(): void {
        callMethod('tokenInternalService', 'initializeTokenInternalService', []);
    }

    getTokenInternalService(): TokenInternalService | null {
        return callMethod('tokenInternalService', 'getTokenInternalService', []);
    }
}

export const backgroundTokenService = new BackgroundTokenService()
