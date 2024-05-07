import icon from '@/common/assets/images/icon.png'
import { useTheme } from '@/common/hooks/useTheme'
import { BaseProvider } from 'baseui-sd'

export function ThumbWindow() {
    const { theme } = useTheme()

    return (
        <BaseProvider theme={theme}>
            <div
                className='thumb'
                style={{
                    background: theme.colors.backgroundPrimary,
                }}
            >
                <img
                    draggable={false}
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                    }}
                    src={icon}
                />
            </div>
        </BaseProvider>
    )
}
