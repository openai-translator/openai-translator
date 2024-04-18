import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Button } from 'baseui-sd/button'
import { useTheme } from '../hooks/useTheme'
import { createUseStyles } from 'react-jss'
import { StatefulTooltip } from 'baseui-sd/tooltip'
import { IThemedStyleProps } from '../types'
import { MdOutlineGrade, MdGrade } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import { FaDice } from 'react-icons/fa'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { Select } from 'baseui-sd/select'
import { FcIdea } from 'react-icons/fc'
import { toast } from 'react-hot-toast'
import { translate } from '../translate'
import CopyToClipboard from 'react-copy-to-clipboard'
import { RxCopy } from 'react-icons/rx'
import { format } from 'date-fns'
import { useCollectedWordTotal } from '../hooks/useCollectedWordTotal'
import { RiPictureInPictureExitLine } from 'react-icons/ri'
import { Tooltip } from './Tooltip'
import { isDesktopApp, isTauri } from '../utils'
import { vocabularyService } from '../services/vocabulary'
import { VocabularyItem } from '../internal-services/db'
import { trackEvent } from '@aptabase/tauri'
import { SpeakerIcon } from './SpeakerIcon'
import { useSettings } from '../hooks/useSettings'
import { LangCode, detectLang } from '../lang'

const RANDOM_SIZE = 10
const MAX_WORDS = 50

const useStyles = createUseStyles({
    'container': (props: IThemedStyleProps) => ({
        position: 'relative',
        minWidth: '600px',
        maxWidth: props.isDesktopApp ? undefined : '800px',
        minHeight: '480px',
        background: props.theme.colors.backgroundPrimary,
        borderRadius: '6px',
        boxSizing: 'border-box',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
    }),
    'closeBtn': {
        'cursor': 'pointer',
        'zIndex': '1',
        '&:active': {
            opacity: 0.6,
        },
    },
    'list': {
        position: 'relative',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        padding: '16px 0',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    },
    'display': (props: IThemedStyleProps) => ({
        display: 'flex',
        padding: '16px 10px 10px',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: props.themeType === 'dark' ? props.theme.colors.contentSecondary : props.theme.colors.contentPrimary,
    }),
    'articleDisplay': {
        'marginTop': '16px',
        'display': 'flex',
        'padding': '0 10px 10px',
        'flexDirection': 'column',
        'overflowY': 'auto',
        'overflowX': 'hidden',
        '-ms-user-select': 'text',
        '-webkit-user-select': 'text',
        'user-select': 'text',
        '& *': {
            '-ms-user-select': 'text',
            '-webkit-user-select': 'text',
            'user-select': 'text',
        },
    },
    'diceArea': {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%) translateY(50%)',
        fontSize: '10px',
        borderRadius: '4px',
        padding: '0 12px',
        background: '#FFF',
    },
    'diceIcon': {
        'cursor': 'pointer',
        '&:active': {
            opacity: 0.6,
        },
    },
    'actionButtonsContainer': {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
    },
    'actionButton': (props: IThemedStyleProps) => ({
        color: props.theme.colors.contentSecondary,
        cursor: 'pointer',
        display: 'flex',
        paddingTop: '6px',
        paddingBottom: '6px',
    }),
    'select': {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: '8px',
    },
    'actionStr': (props: IThemedStyleProps) => ({
        position: 'absolute',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6px',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%) translateY(50%)',
        fontSize: '10px',
        padding: '2px 12px',
        borderRadius: '4px',
        background: props.theme.colors.backgroundTertiary,
        color: props.theme.colors.contentSecondary,
    }),
    'error': {
        background: '#f8d7da',
    },
    'writing': {
        'marginLeft': '3px',
        'width': '10px',
        '&::after': {
            content: '"✍️"',
            animation: '$writing 1.3s infinite',
        },
    },
    '@keyframes writing': {
        '50%': {
            marginLeft: '-3px',
            marginBottom: '-3px',
        },
    },
})

interface IVocabularyProps {
    type: 'vocabulary' | 'article'
    onCancel: () => void
    onInsert: (content: string, highlightWords: string[]) => void
}

const Vocabulary = (props: IVocabularyProps) => {
    useEffect(() => {
        if (!isTauri()) {
            return
        }

        trackEvent('screen_view', { name: 'Vocabulary' })
    }, [])

    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType, isDesktopApp: isDesktopApp() })
    const { settings } = useSettings()
    const editableTextSpeakingIconRef = useRef<HTMLDivElement>(null)

    const [words, setWords] = useState<VocabularyItem[]>([])
    const [selectedWord, setSelectedWord] = useState<VocabularyItem>()
    const [isCollectedWord, setIsCollectedWord] = useState(false)
    const { t } = useTranslation()
    const controlRef = useRef(new AbortController())
    const articleOptions = [
        {
            id: 'story',
            prompt: 'an insteresting story',
            label: t('An insteresting story'),
        },
        {
            id: 'newsletter',
            prompt: 'a political newsletter',
            label: t('A political newsletter'),
        },
        {
            id: 'sports',
            prompt: 'a sports bulletin',
            label: t('A sports bulletin'),
        },
        {
            id: 'lyric',
            prompt: 'a catchy lyric',
            label: t('A catchy lyric'),
        },
        {
            id: 'poem',
            prompt: 'a smooth poem',
            label: t('A smooth poem'),
        },
    ]
    const [articleType, setArticleType] = useState<string>(articleOptions[0].id)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [article, setArticle] = useState<string>('')
    const articleTxt = useRef<string>('')
    const descriptionLines = useMemo(() => selectedWord?.description.split('\n') ?? [], [selectedWord?.description])
    const wordLanguage = useMemo(() => {
        if (!selectedWord?.word) return 'en'
        let sourceLang: LangCode = 'en'
        detectLang(selectedWord?.word ?? '').then((lang: LangCode) => {
            sourceLang = lang
        })
        return sourceLang
    }, [selectedWord])

    const articleUsedWord = useRef<string[]>()
    const { collectedWordTotal, setCollectedWordTotal } = useCollectedWordTotal()

    const checkCollection = useCallback(async () => {
        try {
            const isCollected = await vocabularyService.isCollected(selectedWord?.word ?? '')
            setIsCollectedWord(isCollected)
        } catch (e) {
            console.error(e)
        }
    }, [selectedWord?.word])

    useEffect(() => {
        checkCollection()
    }, [checkCollection])

    const onRandomWords = async () => {
        try {
            setSelectedWord(undefined)
            const randomWords = await vocabularyService.listRandomItems(RANDOM_SIZE)
            setWords(randomWords)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        onRandomWords()
    }, [])

    const onWordCollection = async () => {
        try {
            if (isCollectedWord) {
                const wordInfo = await vocabularyService.getItem(selectedWord?.word ?? '')
                await vocabularyService.deleteItem(wordInfo?.word ?? '')
                setIsCollectedWord(false)
                setCollectedWordTotal((prev: number) => prev - 1)
            } else {
                const wordInfo = words.find((item) => item.word === selectedWord?.word)
                if (wordInfo) {
                    await vocabularyService.putItem({
                        ...wordInfo,
                    })
                    setIsCollectedWord(true)
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    const onGenerateArticle = async () => {
        if (!articleType) {
            toast(t('No article type selected'), {
                duration: 3000,
                icon: '😰',
            })
            return
        }
        setArticle('')
        const prompt = articleOptions.find((item) => item.id === articleType)?.prompt
        setIsLoading(true)
        controlRef.current.abort()
        controlRef.current = new AbortController()
        const { signal } = controlRef.current
        const frequentWords = await vocabularyService.listFrequencyItems(MAX_WORDS)
        const frequentWordsArr = frequentWords.map((item: VocabularyItem) => item.word)
        articleUsedWord.current = [...frequentWordsArr]
        articleTxt.current = ''
        const str = frequentWordsArr.join(',')
        try {
            await translate({
                mode: 'big-bang',
                signal,
                text: str,
                articlePrompt: prompt || '',
                onMessage: async (message) => {
                    if (!message.content) {
                        return
                    }
                    setArticle((e) => {
                        if (message.isFullText) {
                            articleTxt.current = message.content
                        } else {
                            articleTxt.current += message.content
                        }
                        if (
                            articleUsedWord.current?.find(
                                (word) => word.toLowerCase().trim() === message.content.toLowerCase().trim()
                            )
                        ) {
                            return e + `<b style="color: #f40;">${message.content}</b>`
                        } else {
                            return e + message.content
                        }
                    })
                },
                onFinish: () => {
                    setIsLoading(false)
                },
                onError: (error) => {
                    setIsLoading(false)
                    toast(error, {
                        duration: 3000,
                        icon: '😰',
                    })
                },
            })
        } finally {
            setIsLoading(false)
        }
    }

    const DangerArticle = useMemo(
        () => (article ? '<div>' + article.replace(/\n/g, '<br/>').replace(/\r/g, '<br//>') + '</div>' : ''),
        [article]
    )

    return (
        <div
            className={styles.container}
            onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    color: themeType === 'dark' ? theme.colors.contentSecondary : theme.colors.contentPrimary,
                }}
            >
                <div
                    style={{
                        fontWeight: '600',
                    }}
                >
                    {t(props.type === 'article' ? 'generate article' : props.type)}
                </div>
                <div style={{ flex: 1 }}></div>
                <div className={styles.closeBtn} onClick={props.onCancel}>
                    <AiOutlineCloseCircle fontSize={13} />
                </div>
            </div>
            <div className={styles.list}>
                {props.type === 'vocabulary' && (
                    <>
                        {collectedWordTotal > 0
                            ? words.map((item, index) => (
                                  <Button
                                      key={index}
                                      size='mini'
                                      kind={selectedWord?.word === item.word ? 'primary' : 'secondary'}
                                      onClick={() => {
                                          setSelectedWord(item)
                                      }}
                                  >
                                      {item.word}
                                  </Button>
                              ))
                            : 'no words'}
                    </>
                )}
                {props.type === 'article' && (
                    <div className={styles.select}>
                        <Select
                            size='mini'
                            clearable={false}
                            options={articleOptions}
                            value={[{ id: articleType }]}
                            onChange={({ value }) => {
                                controlRef.current.abort()
                                setArticle('')
                                setArticleType(`${value[0].id ?? ''}`)
                            }}
                        />
                        <StatefulTooltip content='Big Bang' placement='bottom' showArrow>
                            <div className={styles.actionButton} onClick={onGenerateArticle}>
                                <Button size='mini' kind={'secondary'}>
                                    <FcIdea size={20} />
                                </Button>
                            </div>
                        </StatefulTooltip>
                    </div>
                )}
                {props.type === 'vocabulary' && (
                    <StatefulTooltip content={t('Random Change')} placement='bottom' showArrow>
                        <div className={styles.diceArea}>
                            <FaDice fontSize={20} className={styles.diceIcon} onClick={onRandomWords} />
                        </div>
                    </StatefulTooltip>
                )}
                {props.type === 'article' && isLoading && (
                    <div className={styles.actionStr}>
                        {isLoading && (
                            <>
                                <div>{t('is writing')}</div>
                                <span className={styles.writing} key={'1'} />
                            </>
                        )}
                    </div>
                )}
            </div>
            {props.type === 'vocabulary' && (
                <div className={styles.display}>
                    {selectedWord?.word && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                            }}
                        >
                            {selectedWord.word}
                            <Tooltip content={t('Speak')} placement='bottom'>
                                <div className={styles.actionButton}>
                                    <SpeakerIcon
                                        size={15}
                                        divRef={editableTextSpeakingIconRef}
                                        provider={settings.tts?.provider}
                                        text={selectedWord?.word}
                                        lang={wordLanguage}
                                        voice={settings.tts?.voices?.find((item) => item.lang === wordLanguage)?.voice}
                                        rate={settings.tts?.rate}
                                        volume={settings.tts?.volume}
                                    />
                                </div>
                            </Tooltip>
                            <StatefulTooltip
                                content={isCollectedWord ? t('Remove from collection') : t('Add to collection')}
                                showArrow
                                placement='right'
                            >
                                <div className={styles.actionButton} onClick={onWordCollection}>
                                    {isCollectedWord ? <MdGrade size={15} /> : <MdOutlineGrade size={15} />}
                                </div>
                            </StatefulTooltip>
                        </div>
                    )}

                    {descriptionLines.length > 0 && descriptionLines.map((line, idx) => <p key={idx}>{line}</p>)}
                    {selectedWord?.reviewCount && <p>{`[${t('review count')}] ${selectedWord?.reviewCount}`}</p>}
                    {selectedWord?.updatedAt && (
                        <p>{`[${t('last review')}] ${format(+selectedWord?.updatedAt, 'yyyy-MM-dd HH:mm:ss')}`}</p>
                    )}
                </div>
            )}
            {props.type === 'article' && (
                <div
                    className={`${styles.display} ${styles.articleDisplay}`}
                    dangerouslySetInnerHTML={{ __html: DangerArticle }}
                ></div>
            )}
            {props.type === 'article' && !isLoading && article.length > 0 && (
                <div
                    className={styles.actionButtonsContainer}
                    style={{
                        marginLeft: 'auto',
                        marginTop: '10px',
                    }}
                >
                    <Tooltip content={t('insert to editor')}>
                        <div
                            className={styles.actionButton}
                            onClick={() => props.onInsert(articleTxt.current, articleUsedWord.current ?? [])}
                        >
                            <RiPictureInPictureExitLine size={13} />
                        </div>
                    </Tooltip>
                    <Tooltip content={t('Copy to clipboard')} showArrow placement='left'>
                        <div>
                            <CopyToClipboard
                                text={articleTxt.current}
                                onCopy={() => {
                                    toast(t('Copy to clipboard'), {
                                        duration: 3000,
                                        icon: '👏',
                                    })
                                }}
                                options={{ format: 'text/plain' }}
                            >
                                <div className={styles.actionButton}>
                                    <RxCopy size={13} />
                                </div>
                            </CopyToClipboard>
                        </div>
                    </Tooltip>
                </div>
            )}
        </div>
    )
}

export default Vocabulary
