import { backgroundActionService } from '../background/services/action'
import { IActionInternalService, actionInternalService } from '../internal-services/action'
import { isDesktopApp, isUserscript } from '../utils'

export const actionService: IActionInternalService =
    isDesktopApp() || isUserscript() ? actionInternalService : backgroundActionService
