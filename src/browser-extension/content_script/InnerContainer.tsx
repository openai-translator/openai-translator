import { computePosition, shift, flip, size, offset, type ReferenceElement } from '@floating-ui/dom'
import { PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import Draggable from 'react-draggable'
import {
    documentPadding,
    dragRegionSelector,
    popupCardInnerContainerId,
    popupCardMaxWidth,
    popupCardMinHeight,
    popupCardMinHeightAfterTranslation,
    popupCardMinWidth,
    popupCardOffset,
    zIndex,
} from './consts'
import { createUseStyles } from 'react-jss'

type Props = {
    reference: ReferenceElement
} & PropsWithChildren

const useStyles = createUseStyles({
    container: {
        position: 'fixed',
        zIndex,
        borderRadius: '4px',
        boxShadow: '0 0 8px rgba(0,0,0,.3)',
        minWidth: `${popupCardMinWidth}px`,
        maxWidth: `${popupCardMaxWidth}px`,
        lineHeight: '1.6',
        fontSize: '13px',
        color: '#333',
        font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
        minHeight: `${popupCardMinHeight}px`,
        width: 'max-content',
        overflowY: 'auto',
    },
})

export default function InnerContainer({ children, reference }: Props) {
    const styles = useStyles()

    const draggableRef = useRef<HTMLDivElement | null>(null)

    const updatePosition = useCallback(async () => {
        if (!draggableRef.current) {
            return
        }
        const { x, y } = await computePosition(reference, draggableRef.current, {
            placement: 'bottom',
            middleware: [
                shift({ padding: documentPadding }),
                offset(popupCardOffset),
                flip(),
                size({
                    apply({ availableHeight, elements }) {
                        Object.assign(elements.floating.style, {
                            maxHeight: `${Math.max(popupCardMinHeightAfterTranslation, availableHeight)}px`,
                        })
                    },
                }),
            ],
            strategy: 'fixed',
        })

        Object.assign(draggableRef.current.style, {
            left: `${Math.max(documentPadding, x)}px`,
            top: `${Math.max(documentPadding, y)}px`,
        })
    }, [reference])

    useEffect(() => {
        if (!draggableRef.current) {
            return
        }
        const resizeObserver = new ResizeObserver(updatePosition)
        resizeObserver.observe(draggableRef.current)
        return () => {
            resizeObserver.disconnect()
        }
    }, [reference, updatePosition])

    return (
        <Draggable nodeRef={draggableRef} handle={dragRegionSelector} bounds='html'>
            <div ref={draggableRef} className={styles.container} id={popupCardInnerContainerId}>
                {children}
            </div>
        </Draggable>
    )
}
