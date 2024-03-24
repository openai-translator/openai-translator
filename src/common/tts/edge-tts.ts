import { langCode2TTSLang } from '.'
import { getUniversalFetch } from '../universal-fetch'
import { SpeakOptions } from './types'
import { v4 as uuidv4 } from 'uuid'

function mkssml(text: string, voice: string, rate: number, volume: number) {
    return (
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
        `<voice name='${voice}'><prosody pitch='+0Hz' rate='${rate}' volume='${volume}'>` +
        `${text}</prosody></voice></speak>`
    )
}

function ssmlHeadersPlusData(requestId: string, timestamp: string, ssml: string) {
    return (
        `X-RequestId:${requestId}\r\n` +
        'Content-Type:application/ssml+xml\r\n' +
        `X-Timestamp:${timestamp}Z\r\n` + // This is not a mistake, Microsoft Edge bug.
        `Path:ssml\r\n\r\n` +
        `${ssml}`
    )
}

function getHeadersAndData(data: string) {
    const headers: { [key: string]: string } = {}
    data.slice(0, data.indexOf('\r\n\r\n'))
        .split('\r\n')
        .forEach((line) => {
            const [key, value] = line.split(':', 2)
            headers[key] = value
        })
    return { headers, data: data.slice(data.indexOf('\r\n\r\n') + 4) }
}

const trustedClientToken = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const wssURL =
    'wss://speech.platform.bing.com/consumer/speech/synthesize/' +
    'readaloud/edge/v1?TrustedClientToken=' +
    trustedClientToken

// https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/e6faf6b7fc1febb45993b940617719e8ed1358b2/src/sdk/SpeechSynthesizer.ts#L216
const languageToDefaultVoice: { [key: string]: string } = {
    ['af-ZA']: 'af-ZA-AdriNeural',
    ['am-ET']: 'am-ET-AmehaNeural',
    ['ar-AE']: 'ar-AE-FatimaNeural',
    ['ar-BH']: 'ar-BH-AliNeural',
    ['ar-DZ']: 'ar-DZ-AminaNeural',
    ['ar-EG']: 'ar-EG-SalmaNeural',
    ['ar-IQ']: 'ar-IQ-BasselNeural',
    ['ar-JO']: 'ar-JO-SanaNeural',
    ['ar-KW']: 'ar-KW-FahedNeural',
    ['ar-LY']: 'ar-LY-ImanNeural',
    ['ar-MA']: 'ar-MA-JamalNeural',
    ['ar-QA']: 'ar-QA-AmalNeural',
    ['ar-SA']: 'ar-SA-HamedNeural',
    ['ar-SY']: 'ar-SY-AmanyNeural',
    ['ar-TN']: 'ar-TN-HediNeural',
    ['ar-YE']: 'ar-YE-MaryamNeural',
    ['bg-BG']: 'bg-BG-BorislavNeural',
    ['bn-BD']: 'bn-BD-NabanitaNeural',
    ['bn-IN']: 'bn-IN-BashkarNeural',
    ['ca-ES']: 'ca-ES-JoanaNeural',
    ['cs-CZ']: 'cs-CZ-AntoninNeural',
    ['cy-GB']: 'cy-GB-AledNeural',
    ['da-DK']: 'da-DK-ChristelNeural',
    ['de-AT']: 'de-AT-IngridNeural',
    ['de-CH']: 'de-CH-JanNeural',
    ['de-DE']: 'de-DE-KatjaNeural',
    ['el-GR']: 'el-GR-AthinaNeural',
    ['en-AU']: 'en-AU-NatashaNeural',
    ['en-CA']: 'en-CA-ClaraNeural',
    ['en-GB']: 'en-GB-LibbyNeural',
    ['en-HK']: 'en-HK-SamNeural',
    ['en-IE']: 'en-IE-ConnorNeural',
    ['en-IN']: 'en-IN-NeerjaNeural',
    ['en-KE']: 'en-KE-AsiliaNeural',
    ['en-NG']: 'en-NG-AbeoNeural',
    ['en-NZ']: 'en-NZ-MitchellNeural',
    ['en-PH']: 'en-PH-JamesNeural',
    ['en-SG']: 'en-SG-LunaNeural',
    ['en-TZ']: 'en-TZ-ElimuNeural',
    ['en-US']: 'en-US-JennyNeural',
    ['en-ZA']: 'en-ZA-LeahNeural',
    ['es-AR']: 'es-AR-ElenaNeural',
    ['es-BO']: 'es-BO-MarceloNeural',
    ['es-CL']: 'es-CL-CatalinaNeural',
    ['es-CO']: 'es-CO-GonzaloNeural',
    ['es-CR']: 'es-CR-JuanNeural',
    ['es-CU']: 'es-CU-BelkysNeural',
    ['es-DO']: 'es-DO-EmilioNeural',
    ['es-EC']: 'es-EC-AndreaNeural',
    ['es-ES']: 'es-ES-AlvaroNeural',
    ['es-GQ']: 'es-GQ-JavierNeural',
    ['es-GT']: 'es-GT-AndresNeural',
    ['es-HN']: 'es-HN-CarlosNeural',
    ['es-MX']: 'es-MX-DaliaNeural',
    ['es-NI']: 'es-NI-FedericoNeural',
    ['es-PA']: 'es-PA-MargaritaNeural',
    ['es-PE']: 'es-PE-AlexNeural',
    ['es-PR']: 'es-PR-KarinaNeural',
    ['es-PY']: 'es-PY-MarioNeural',
    ['es-SV']: 'es-SV-LorenaNeural',
    ['es-US']: 'es-US-AlonsoNeural',
    ['es-UY']: 'es-UY-MateoNeural',
    ['es-VE']: 'es-VE-PaolaNeural',
    ['et-EE']: 'et-EE-AnuNeural',
    ['fa-IR']: 'fa-IR-DilaraNeural',
    ['fi-FI']: 'fi-FI-SelmaNeural',
    ['fil-PH']: 'fil-PH-AngeloNeural',
    ['fr-BE']: 'fr-BE-CharlineNeural',
    ['fr-CA']: 'fr-CA-SylvieNeural',
    ['fr-CH']: 'fr-CH-ArianeNeural',
    ['fr-FR']: 'fr-FR-DeniseNeural',
    ['ga-IE']: 'ga-IE-ColmNeural',
    ['gl-ES']: 'gl-ES-RoiNeural',
    ['gu-IN']: 'gu-IN-DhwaniNeural',
    ['he-IL']: 'he-IL-AvriNeural',
    ['hi-IN']: 'hi-IN-MadhurNeural',
    ['hr-HR']: 'hr-HR-GabrijelaNeural',
    ['hu-HU']: 'hu-HU-NoemiNeural',
    ['id-ID']: 'id-ID-ArdiNeural',
    ['is-IS']: 'is-IS-GudrunNeural',
    ['it-IT']: 'it-IT-IsabellaNeural',
    ['ja-JP']: 'ja-JP-NanamiNeural',
    ['jv-ID']: 'jv-ID-DimasNeural',
    ['kk-KZ']: 'kk-KZ-AigulNeural',
    ['km-KH']: 'km-KH-PisethNeural',
    ['kn-IN']: 'kn-IN-GaganNeural',
    ['ko-KR']: 'ko-KR-SunHiNeural',
    ['lo-LA']: 'lo-LA-ChanthavongNeural',
    ['lt-LT']: 'lt-LT-LeonasNeural',
    ['lv-LV']: 'lv-LV-EveritaNeural',
    ['mk-MK']: 'mk-MK-AleksandarNeural',
    ['ml-IN']: 'ml-IN-MidhunNeural',
    ['mr-IN']: 'mr-IN-AarohiNeural',
    ['ms-MY']: 'ms-MY-OsmanNeural',
    ['mt-MT']: 'mt-MT-GraceNeural',
    ['my-MM']: 'my-MM-NilarNeural',
    ['nb-NO']: 'nb-NO-PernilleNeural',
    ['nl-BE']: 'nl-BE-ArnaudNeural',
    ['nl-NL']: 'nl-NL-ColetteNeural',
    ['pl-PL']: 'pl-PL-AgnieszkaNeural',
    ['ps-AF']: 'ps-AF-GulNawazNeural',
    ['pt-BR']: 'pt-BR-FranciscaNeural',
    ['pt-PT']: 'pt-PT-DuarteNeural',
    ['ro-RO']: 'ro-RO-AlinaNeural',
    ['ru-RU']: 'ru-RU-SvetlanaNeural',
    ['si-LK']: 'si-LK-SameeraNeural',
    ['sk-SK']: 'sk-SK-LukasNeural',
    ['sl-SI']: 'sl-SI-PetraNeural',
    ['so-SO']: 'so-SO-MuuseNeural',
    ['sr-RS']: 'sr-RS-NicholasNeural',
    ['su-ID']: 'su-ID-JajangNeural',
    ['sv-SE']: 'sv-SE-SofieNeural',
    ['sw-KE']: 'sw-KE-RafikiNeural',
    ['sw-TZ']: 'sw-TZ-DaudiNeural',
    ['ta-IN']: 'ta-IN-PallaviNeural',
    ['ta-LK']: 'ta-LK-KumarNeural',
    ['ta-SG']: 'ta-SG-AnbuNeural',
    ['te-IN']: 'te-IN-MohanNeural',
    ['th-TH']: 'th-TH-PremwadeeNeural',
    ['tr-TR']: 'tr-TR-AhmetNeural',
    ['uk-UA']: 'uk-UA-OstapNeural',
    ['ur-IN']: 'ur-IN-GulNeural',
    ['ur-PK']: 'ur-PK-AsadNeural',
    ['uz-UZ']: 'uz-UZ-MadinaNeural',
    ['vi-VN']: 'vi-VN-HoaiMyNeural',
    ['zh-CN']: 'zh-CN-XiaoxiaoNeural',
    ['zh-HK']: 'zh-HK-HiuMaanNeural',
    ['zh-TW']: 'zh-TW-HsiaoChenNeural',
    ['zu-ZA']: 'zu-ZA-ThandoNeural',
}

function dictReplace(s: string, d: Record<string, string>): string {
    for (const [key, value] of Object.entries(d)) {
        s = s.split(key).join(value)
    }
    return s
}

function escape(data: string, entities: Record<string, string> = {}): string {
    data = data.replace(/&/g, '&amp;')
    data = data.replace(/>/g, '&gt;')
    data = data.replace(/</g, '&lt;')
    if (Object.keys(entities).length > 0) {
        data = dictReplace(data, entities)
    }
    return data
}

function removeIncompatibleCharacters(str: string): string {
    const chars: string[] = Array.from(str)

    for (let idx = 0; idx < chars.length; idx++) {
        const char = chars[idx]
        const code = char.charCodeAt(0)
        if ((code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31)) {
            chars[idx] = ' '
        }
    }

    return chars.join('')
}

function* splitTextByByteLength(text: string, byteLength: number): Generator<string, void, void> {
    if (byteLength <= 0) {
        throw new Error('byteLength must be greater than 0')
    }

    while (text.length > byteLength) {
        // Find the last space in the string
        let splitAt = text.lastIndexOf(' ', byteLength)

        // If no space found, splitAt is byteLength
        splitAt = splitAt !== -1 ? splitAt : byteLength

        // Verify all & are terminated with a ;
        while (text.slice(0, splitAt).includes('&')) {
            const ampersandIndex = text.lastIndexOf('&', splitAt)
            if (text.slice(ampersandIndex, splitAt).includes(';')) {
                break
            }

            splitAt = ampersandIndex - 1
            if (splitAt < 0) {
                throw new Error('Maximum byte length is too small or invalid text')
            }
            if (splitAt === 0) {
                break
            }
        }

        // Append the string to the list
        const newText = text.slice(0, splitAt).trim()
        if (newText.length > 0) {
            yield newText
        }
        if (splitAt === 0) {
            splitAt = 1
        }
        text = text.slice(splitAt)
    }

    text = text.trim()
    if (text.length > 0) {
        yield text
    }
}

function calcMaxMesgSize(voice: string, rate: number, volume: number): number {
    const connectId = uuidv4().replace(/-/g, '')
    const date = new Date().toString()
    const websocketMaxSize: number = 2 ** 16
    const overheadPerMessage: number = ssmlHeadersPlusData(connectId, date, mkssml('', voice, rate, volume)).length + 50 // margin of error

    return websocketMaxSize - overheadPerMessage
}

interface EdgeTTSOptions extends SpeakOptions {
    voice?: string
    rate?: number
    volume?: number
}

export async function speak({
    text,
    lang: lang_,
    onFinish,
    voice,
    rate = 1,
    volume = 100,
    signal,
    onStartSpeaking,
}: EdgeTTSOptions) {
    const lang = langCode2TTSLang[lang_ ?? 'en'] ?? 'en-US'
    const connectId = uuidv4().replace(/-/g, '')
    const date = new Date().toString()
    const audioContext = new AudioContext()
    const audioBufferSource = audioContext.createBufferSource()

    const texts = splitTextByByteLength(
        escape(removeIncompatibleCharacters(text)),
        calcMaxMesgSize(voice ?? languageToDefaultVoice[lang], rate, volume)
    )

    let stopped = false

    signal.addEventListener(
        'abort',
        () => {
            try {
                stopped = true
                audioBufferSource.stop()
            } catch (e) {
                // ignore
            }
        },
        { once: true }
    )

    for (const text of texts) {
        const ws = new WebSocket(`${wssURL}&ConnectionId=${connectId}`)
        ws.binaryType = 'arraybuffer'
        ws.addEventListener('open', () => {
            ws.send(
                `X-Timestamp:${date}\r\n` +
                    'Content-Type:application/json; charset=utf-8\r\n' +
                    'Path:speech.config\r\n\r\n' +
                    '{"context":{"synthesis":{"audio":{"metadataoptions":{' +
                    '"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":true},' +
                    '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"' +
                    '}}}}\r\n'
            )
            ws.send(
                ssmlHeadersPlusData(
                    connectId,
                    date,
                    mkssml(text, voice ?? languageToDefaultVoice[lang ?? 'en-US'], rate, volume)
                )
            )
        })

        signal.addEventListener(
            'abort',
            () => {
                try {
                    ws.close()
                } catch (e) {
                    // ignore
                }
            },
            { once: true }
        )

        let audioData = new ArrayBuffer(0)
        let downloadAudio = false
        let startSpeaking = false
        ws.addEventListener('message', async (event) => {
            if (typeof event.data === 'string') {
                const { headers } = getHeadersAndData(event.data)
                const path = headers['Path']
                switch (path) {
                    case 'turn.start':
                        downloadAudio = true
                        break
                    case 'turn.end': {
                        downloadAudio = false
                        if (!audioData.byteLength || stopped) {
                            return
                        }
                        const buffer = await audioContext.decodeAudioData(audioData)
                        audioBufferSource.buffer = buffer
                        audioBufferSource.connect(audioContext.destination)
                        if (!startSpeaking) {
                            startSpeaking = true
                            onStartSpeaking?.()
                        }
                        audioBufferSource.start()
                        audioBufferSource.addEventListener('ended', () => {
                            onFinish?.()
                            audioContext.close()
                        })
                        break
                    }
                }
            } else if (event.data instanceof ArrayBuffer) {
                if (!downloadAudio) {
                    return
                }
                // See: https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/d071d11d1e9f34d6f79d0ab6114c90eecb02ba1f/src/common.speech/WebsocketMessageFormatter.ts#L46-L47
                const dataview = new DataView(event.data)
                const headerLength = dataview.getInt16(0)
                if (event.data.byteLength > headerLength + 2) {
                    const newBody = event.data.slice(2 + headerLength)
                    const newAudioData = new ArrayBuffer(audioData.byteLength + newBody.byteLength)
                    const mergedUint8Array = new Uint8Array(newAudioData)
                    mergedUint8Array.set(new Uint8Array(audioData), 0)
                    mergedUint8Array.set(new Uint8Array(newBody), audioData.byteLength)
                    audioData = newAudioData
                }
            }
        })
    }
}

const voiceListURL =
    'https://speech.platform.bing.com/consumer/speech/synthesize/' +
    'readaloud/voices/list?trustedclienttoken=' +
    trustedClientToken

interface EdgeVoice {
    FriendlyName: string
    Gender: string
    Locale: string
    ShortName: string
    Name: string
    SuggestedCodec: string
}
export async function fetchEdgeVoices() {
    const fetcher = getUniversalFetch()
    const response = await fetcher(voiceListURL, {})
    const voices: EdgeVoice[] = await response.json()
    return voices.map((voice) => ({
        name: voice.FriendlyName,
        lang: voice.Locale,
        voiceURI: voice.Name,
    })) as SpeechSynthesisVoice[]
}
