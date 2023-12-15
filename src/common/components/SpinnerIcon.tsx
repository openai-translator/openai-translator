import { IconBaseProps } from 'react-icons'
import { createUseStyles } from 'react-jss'
import { CgSpinner } from 'react-icons/cg'

const useStyles = createUseStyles({
    'root': {
        animation: '$spin 1s linear infinite',
    },
    '@keyframes spin': {
        '0%': {
            transform: 'rotate(0deg)',
        },
        '50%': {
            transform: 'rotate(180deg)',
        },
        '100%': {
            transform: 'rotate(360deg)',
        },
    },
})

export interface ISpinnerIconProps extends IconBaseProps {}

export function SpinnerIcon(props: ISpinnerIconProps) {
    const styles = useStyles()
    return <CgSpinner className={styles.root} {...props} />
}
