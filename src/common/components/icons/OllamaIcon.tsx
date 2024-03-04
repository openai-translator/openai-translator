import { IconBaseProps } from 'react-icons'
import Logo from '@/common/assets/images/ollama.svg?react'
import { createUseStyles } from 'react-jss'

const useStyles = createUseStyles({
    icon: {
        '& path': {
            fill: 'currentColor',
        },
    },
})

export function OllamaIcon(props: IconBaseProps) {
    const styles = useStyles()
    return (
        <Logo
            className={styles.icon}
            height={props.size}
            width={typeof props.size === 'number' ? props.size * (646 / 854) : undefined}
        />
    )
}
