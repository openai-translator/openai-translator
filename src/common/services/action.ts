import { backgroundActionService } from '../background/services/action'
import { IActionInternalService, actionInternalService } from '../internal-services/action'
import { isDesktopApp } from '../utils'

export const actionService: IActionInternalService = isDesktopApp() ? actionInternalService : backgroundActionService
