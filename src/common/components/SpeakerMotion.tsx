import React from 'react'
import { createUseStyles } from 'react-jss'
import { RxSpeakerLoud, RxSpeakerModerate, RxSpeakerQuiet } from 'react-icons/rx'
import { IconBaseProps } from 'react-icons'

const useStyles = createUseStyles({
    'speakerLoud': {
        display: 'block',
        animation: '$speaker-loud-animation 1.3s linear infinite',
    },
    'speakerModerate': {
        display: 'block',
        animation: '$speaker-moderate-animation 1.3s linear infinite',
        position: 'absolute',
        left: 0,
        top: 0,
    },
    'speakerQuiet': {
        display: 'block',
        animation: '$speaker-quiet-animation 1.3s linear infinite',
        position: 'absolute',
        left: 0,
        top: 0,
    },
    '@keyframes speaker-loud-animation': {
        '0%': {
            opacity: 0,
        },
        '50%': {
            opacity: 0,
        },
        '100%': {
            opacity: 1,
        },
    },
    '@keyframes speaker-moderate-animation': {
        '0%': {
            opacity: 0,
        },
        '50%': {
            opacity: 1,
        },
        '100%': {
            opacity: 0,
        },
    },
    '@keyframes speaker-quiet-animation': {
        '0%': {
            opacity: 1,
        },
        '50%': {
            opacity: 0,
        },
        '100%': {
            opacity: 0,
        },
    },
})

export default function SpeakerMotion({ style, ...props }: IconBaseProps) {
    const styles = useStyles()

    return (
        <div
            style={{
                position: 'relative',
                display: 'inline-block',
                ...style,
            }}
        >
            <RxSpeakerLoud className={styles.speakerLoud} {...props} />
            <RxSpeakerModerate className={styles.speakerModerate} {...props} />
            <RxSpeakerQuiet className={styles.speakerQuiet} {...props} />
        </div>
    )
}
