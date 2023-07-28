import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../../common/types'
import { useTheme } from '../../common/hooks/useTheme'
import { RxDrawingPin, RxDrawingPinFilled } from 'react-icons/rx'
import LogoWithText from '../../common/components/LogoWithText'
import { setSettings } from '../../common/utils'
import { useState } from 'react'

const useStyles = createUseStyles({
    container: ({ theme }: IThemedStyleProps) => ({
        display: 'flex',
        background: theme.colors.backgroundPrimary,
        padding: '8px 16px 4px 16px',
        cursor: 'move',
        justifyContent: 'space-between',
    }),
    actionsContainer: {
        display: 'flex',
        gap: '8px',
    },
    actionIconContainer: {
        display: 'flex',
        alignItems: 'center',
        padding: '2px',
        cursor: 'pointer',
    },
    pinIcon: {
        rotate: '-45deg',
    },
})

type TitleBarProps = {
    pinned?: boolean
}

export default function TitleBar({ pinned = false }: TitleBarProps) {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })
    const [isPinned, setIsPinned] = useState(pinned)

    async function handleTogglePin() {
        setIsPinned((prevIsPinned) => {
            setSettings({ pinned: !prevIsPinned })
            return !prevIsPinned
        })
    }

    return (
        <div data-tauri-drag-region className={styles.container}>
            <LogoWithText />
            <div className={styles.actionsContainer}>
                <div className={styles.actionIconContainer} onClick={handleTogglePin}>
                    {isPinned ? (
                        <RxDrawingPinFilled size={15} className={styles.pinIcon} />
                    ) : (
                        <RxDrawingPin size={15} className={styles.pinIcon} />
                    )}
                </div>
            </div>
        </div>
    )
}
