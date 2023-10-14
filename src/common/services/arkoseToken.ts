import { backgroundTokenService } from '../background/services/arkoseToken'
import { IarkoseTokenInternalService, getTokenInternalService } from '../internal-services/arkoseToken'
import { isDesktopApp } from '../utils'

export const tokenService: IarkoseTokenInternalService = isDesktopApp()
    ? getTokenInternalService
    : backgroundTokenService
