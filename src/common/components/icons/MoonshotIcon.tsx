import { IconBaseProps } from 'react-icons'
import moonshotLightSrc from '@/common/assets/images/moonshot-light.png'
import moonshotDarkSrc from '@/common/assets/images/moonshot-dark.png'
import { useTheme } from '@/common/hooks/useTheme'

export function MoonshotIcon(props: IconBaseProps) {
    const { themeType } = useTheme()
    let src = moonshotLightSrc
    if (themeType === 'dark') {
        src = moonshotDarkSrc
    }
    return <img src={src} alt='Moonshot' height={props.size} width={props.size} />
}
