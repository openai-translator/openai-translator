import React from 'react'
import { createUseStyles } from 'react-jss'
import { RxSpeakerLoud, RxSpeakerModerate, RxSpeakerQuiet } from 'react-icons/rx'

const useStyles = createUseStyles({
    'speakerLoud': {
        animation: '$speaker-loud-animation 1.3s linear infinite',
    },
    'speakerModerate': {
        animation: '$speaker-moderate-animation 1.3s linear infinite',
        position: 'absolute',
    },
    'speakerQuiet': {
        animation: '$speaker-quiet-animation 1.3s linear infinite',
        position: 'absolute',
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

export default function SpeakerMotion() {
    const styles = useStyles()

    return (
        <>
            <RxSpeakerLoud className={styles.speakerLoud} size={13} />
            <RxSpeakerModerate className={styles.speakerModerate} size={13} />
            <RxSpeakerQuiet className={styles.speakerQuiet} size={13} />
        </>
    )
}
