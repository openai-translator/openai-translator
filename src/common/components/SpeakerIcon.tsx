import { useCallback, useEffect, useRef, useState } from 'react'
import { LangCode } from '../lang'
import { defaultTTSProvider, doSpeak } from '../tts'
import { TTSProvider } from '../tts/types'
import SpeakerMotion from './SpeakerMotion'
import { RxSpeakerLoud } from 'react-icons/rx'
import { IconBaseProps } from 'react-icons'
import { SpinnerIcon } from './SpinnerIcon'

interface ISpeakerIconProps extends IconBaseProps {
    divRef?: React.Ref<HTMLDivElement>
    provider?: TTSProvider
    lang: LangCode
    voice?: string
    rate?: number
    volume?: number
    text?: string
}

export function SpeakerIcon({
    divRef,
    provider = defaultTTSProvider,
    text,
    lang,
    voice,
    rate,
    volume,
    ...iconProps
}: ISpeakerIconProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const stopRef = useRef<() => void>()

    useEffect(() => {
        return () => {
            stopRef.current?.()
        }
    }, [])

    const handleSpeak = useCallback(() => {
        if (!text) {
            return
        }
        console.debug('provider', provider, 'lang', lang, 'voice', voice)
        setIsLoading(true)
        setIsSpeaking(true)
        const controller = new AbortController()
        const { signal } = controller
        stopRef.current = () => {
            controller.abort()
            setIsSpeaking(false)
            setIsLoading(false)
        }
        doSpeak({
            provider,
            lang,
            text,
            voice,
            volume: volume,
            rate: rate,
            onFinish: () => {
                setIsSpeaking(false)
            },
            onStartSpeaking: () => {
                setIsLoading(false)
            },
            signal,
        })
    }, [lang, provider, rate, text, voice, volume])

    return (
        <div
            ref={divRef}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (isSpeaking || isLoading) {
                    stopRef.current?.()
                    return
                }
                handleSpeak()
            }}
        >
            {isLoading && (
                <SpinnerIcon
                    style={{
                        display: 'block',
                    }}
                    {...iconProps}
                />
            )}
            {!isLoading &&
                (isSpeaking ? (
                    <SpeakerMotion
                        style={{
                            display: 'block',
                        }}
                        {...iconProps}
                    />
                ) : (
                    <RxSpeakerLoud
                        style={{
                            display: 'block',
                        }}
                        {...iconProps}
                    />
                ))}
        </div>
    )
}
