import { IconBaseProps } from 'react-icons'
import Logo from '@/common/assets/images/cohere.svg?react'
import { createUseStyles } from 'react-jss'

const useStyles = createUseStyles({
    icon: {
        '& path': {
            fill: 'currentColor',
        },
    },
})

export function CohereIcon(props: IconBaseProps) {
    const styles = useStyles()
    return <Logo className={styles.icon} width={props.size} height={props.size} />
}
