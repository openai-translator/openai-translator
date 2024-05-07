import { forwardRef, useImperativeHandle, useRef } from 'react'
import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../types'
import { useTheme } from '../hooks/useTheme'
import { getAssetUrl } from '../utils'
import icon from '@/common/assets/images/icon.png'

const useStyles = createUseStyles({
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        marginRight: 'auto',
    },
    icon: {
        'display': 'block',
        'width': '16px',
        'height': '16px',
        '-ms-user-select': 'none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
        'pointerEvents': 'none',
    },
    iconText: (props: IThemedStyleProps) => ({
        color: props.themeType === 'dark' ? props.theme.colors.contentSecondary : props.theme.colors.contentPrimary,
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'unset',
        userSelect: 'none',
    }),
})

export type LogoWithTextRef = {
    hideText: () => void
    showText: () => void
}

const LogoWithText = forwardRef<LogoWithTextRef, unknown>(function LogoWithText(_props, ref) {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })

    const logoTextRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(
        ref,
        () => {
            return {
                hideText() {
                    if (logoTextRef.current) {
                        logoTextRef.current.style.display = 'none'
                    }
                },
                showText() {
                    if (logoTextRef.current) {
                        logoTextRef.current.style.display = 'flex'
                    }
                },
            }
        },
        []
    )

    return (
        <div data-tauri-drag-region className={styles.iconContainer}>
            <img data-tauri-drag-region className={styles.icon} src={getAssetUrl(icon)} />
            <div data-tauri-drag-region className={styles.iconText} ref={logoTextRef}>
                OpenAI Translator
            </div>
        </div>
    )
})

export default LogoWithText
