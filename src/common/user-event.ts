export type UserEventType = MouseEvent | TouchEvent | PointerEvent

export const getPageX = (event: UserEventType) => {
    return event instanceof MouseEvent ? event.pageX : event.changedTouches[0].pageX
}

export const getPageY = (event: UserEventType) => {
    return event instanceof MouseEvent ? event.pageY : event.changedTouches[0].pageY
}
