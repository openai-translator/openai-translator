import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../types'
import { useTheme } from '../hooks/useTheme'
import { getAssetUrl } from '../utils'
import icon from '../assets/images/icon.png'

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
    }),
})
export default function Logo() {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })

    return (
        <div data-tauri-drag-region className={styles.iconContainer}>
            <img data-tauri-drag-region className={styles.icon} src={getAssetUrl(icon)} />
            <div data-tauri-drag-region className={styles.iconText}>
                OpenAI Translator
            </div>
        </div>
    )
}
