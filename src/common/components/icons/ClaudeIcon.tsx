import { IconBaseProps } from 'react-icons'
import Logo from '@/common/assets/images/claude.svg?react'
import { createUseStyles } from 'react-jss'
import { useTheme } from '@/common/hooks/useTheme'
import { IThemedStyleProps } from '@/common/types'

const useStyles = createUseStyles({
    icon: ({ theme }: IThemedStyleProps) => ({
        '& rect': {
            fill: 'currentColor',
        },
        '& path': {
            fill: theme.colors.backgroundPrimary,
        },
    }),
})

export function ClaudeIcon(props: IconBaseProps) {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })
    return <Logo className={styles.icon} width={props.size} height={props.size} />
}
