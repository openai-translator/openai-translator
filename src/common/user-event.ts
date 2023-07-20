export type UserEventType = MouseEvent | TouchEvent | PointerEvent

export const getPageX = (event: UserEventType) => {
    return event instanceof MouseEvent ? event.pageX : event.changedTouches[0].pageX
}

export const getPageY = (event: UserEventType) => {
    return event instanceof MouseEvent ? event.pageY : event.changedTouches[0].pageY
}

export const getClientX = (event: UserEventType) => {
    return event instanceof MouseEvent ? event.clientX : event.changedTouches[0].clientX
}

export const getClientY = (event: UserEventType) => {
    return event instanceof MouseEvent ? event.clientY : event.changedTouches[0].clientY
}
