import { useToaster } from 'react-hot-toast/headless'
import { createUseStyles } from 'react-jss'
import clsx from 'clsx'

const useStyles = createUseStyles({
    'rootContainer': {
        pointerEvents: 'none',
        zIndex: 2147483647,
        position: 'fixed',
        inset: '16px',
    },
    'container': {
        left: '0px',
        right: '0px',
        top: '0px',
        position: 'absolute',
        transition: 'all 230ms cubic-bezier(0.21, 1.02, 0.73, 1)',
        justifyContent: 'center',
        display: 'flex',
    },
    '@keyframes enter': {
        '0%': { transform: 'translate3d(0,-100%,0) scale(.6)', opacity: '.5' },
        '100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '1' },
    },
    '@keyframes exit': {
        '0%': { transform: 'translate3d(0,0,-1px) scale(1)', opacity: '1' },
        '100%': { transform: 'translate3d(0,-100%,-1px) scale(.6)', opacity: '0' },
    },
    '@keyframes icon-anim': {
        '0%': {
            transform: 'scale(0.6)',
            opacity: '0.4',
        },
        '100%': {
            transform: 'scale(1)',
            opacity: 1,
        },
    },
    'innerContainer': {
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        color: '#363636',
        lineHeight: 1.3,
        willChange: 'transform',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05)',
        maxWidth: '350px',
        pointerEvents: 'auto',
        padding: '8px 10px',
        borderRadius: '8px',
    },
    'enterAnimation': {
        animation: '$enter 0.35s cubic-bezier(.21,1.02,.73,1) forwards',
    },
    'exitAnimation': {
        animation: '$exit 0.4s forwards cubic-bezier(.06,.71,.55,1)',
    },
    'icon': {
        position: 'relative',
        transform: 'scale(0.6)',
        opacity: '0.4',
        minWidth: '20px',
        animation: '$icon-anim 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
    },
    'message': {
        display: 'flex',
        justifyContent: 'center',
        margin: '4px 10px',
        color: 'inherit',
        flex: '1 1 auto',
        whiteSpace: 'pre-line',
    },
})

export default function Toaster() {
    const { toasts, handlers } = useToaster()
    const { startPause, endPause, calculateOffset, updateHeight } = handlers
    const styles = useStyles()

    return (
        <div onMouseEnter={startPause} onMouseLeave={endPause} className={styles.rootContainer}>
            {toasts.map((toast) => {
                const offset = calculateOffset(toast, {
                    reverseOrder: false,
                    gutter: 8,
                })

                const ref = (el: HTMLDivElement | null) => {
                    if (el && typeof toast.height !== 'number') {
                        const height = el.getBoundingClientRect().height
                        updateHeight(toast.id, height)
                    }
                }

                return (
                    <div
                        key={toast.id}
                        ref={ref}
                        {...toast.ariaProps}
                        className={styles.container}
                        style={{ transform: `translateY(${offset}px)` }}
                    >
                        <div
                            className={clsx(styles.innerContainer, {
                                [styles.enterAnimation]: toast.visible,
                                [styles.exitAnimation]: !toast.visible,
                            })}
                        >
                            <div className={styles.icon}>{toast.icon}</div>
                            <div className={styles.message} role='status' aria-live='polite'>
                                {toast.message?.toString()}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
