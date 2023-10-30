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

export function getCaretNodeType(event: UserEventType) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (document.caretPositionFromPoint) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const range = document?.caretPositionFromPoint(getClientX(event), getClientY(event))
        if (!range) return null
        return range.offsetNode.nodeType
    } else if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(getClientX(event), getClientY(event))

        if (!range) return null
        return range.startContainer.nodeType
    } else {
        return null
    }
}
