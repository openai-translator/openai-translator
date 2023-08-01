import { useState } from 'react'
import { createUseStyles } from 'react-jss'
import { useTranslation } from 'react-i18next'
import { BaseProvider } from 'baseui-sd'
import { Provider as StyletronProvider } from 'styletron-react'
import { Client as Styletron } from 'styletron-engine-atomic'
import { IThemedStyleProps } from '../../common/types'
import { useTheme } from '../../common/hooks/useTheme'
import { RxCross2, RxDrawingPin, RxDrawingPinFilled } from 'react-icons/rx'
import LogoWithText from '../../common/components/LogoWithText'
import { setSettings } from '../../common/utils'
import { Tooltip } from '../../common/components/Tooltip'

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
    engine: Styletron
    onClose: () => void
}

export default function TitleBar({ pinned = false, onClose, engine }: TitleBarProps) {
    const { theme, themeType } = useTheme()
    const { t } = useTranslation()

    const styles = useStyles({ theme, themeType })
    const [isPinned, setIsPinned] = useState(pinned)

    async function handleTogglePin() {
        setIsPinned((prevIsPinned) => {
            setSettings({ pinned: !prevIsPinned })
            return !prevIsPinned
        })
    }

    return (
        <StyletronProvider value={engine}>
            <BaseProvider theme={theme}>
                <div data-tauri-drag-region className={styles.container}>
                    <LogoWithText />
                    <div className={styles.actionsContainer}>
                        <Tooltip content={isPinned ? t('Unpin') : t('Pin')} placement='bottom' onMouseEnterDelay={1000}>
                            <div
                                className={styles.actionIconContainer}
                                onClick={handleTogglePin}
                                data-testid='titlebar-pin-btn'
                            >
                                {isPinned ? (
                                    <RxDrawingPinFilled size={13} className={styles.pinIcon} />
                                ) : (
                                    <RxDrawingPin size={13} className={styles.pinIcon} />
                                )}
                            </div>
                        </Tooltip>
                        <Tooltip content={t('Close')} placement='bottom' onMouseEnterDelay={1000}>
                            <div
                                className={styles.actionIconContainer}
                                onClick={onClose}
                                data-testid='titlebar-close-btn'
                            >
                                <RxCross2 size={16} />
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </BaseProvider>
        </StyletronProvider>
    )
}
