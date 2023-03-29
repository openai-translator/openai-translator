import { type FC, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { formatDate, LocalDB, VocabularyItem } from './utils'
import { Button } from 'baseui-sd/button'
import { useTheme } from '../common/hooks/useTheme'
import { createUseStyles } from 'react-jss'
import { StatefulTooltip } from 'baseui-sd/tooltip'
import { IThemedStyleProps } from '../common/types'
import { MdOutlineGrade, MdGrade } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import { FaDice } from 'react-icons/fa'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { Select } from 'baseui-sd/select'
import { FcIdea } from 'react-icons/fc'
import { toast } from 'react-hot-toast'
import { translate } from './translate'
import { BaseProvider } from 'baseui-sd'
import { Provider as StyletronProvider } from 'styletron-react'
import { Client as Styletron } from 'styletron-engine-atomic'
import CopyToClipboard from 'react-copy-to-clipboard'
import { RxCopy } from 'react-icons/rx'
const RANDOM_SIZE = 10
const MAX_WORDS = 50

const useStyles = createUseStyles({
    'container': (props: IThemedStyleProps) => ({
        position: 'relative',
        width: '360px',
        height: '480px',
        background: props.themeType === 'dark' ? '#1f1f1f' : '#fff',
        borderRadius: '6px',
        boxSizing: 'border-box',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
    }),
    'closeBtn': {
        'position': 'absolute',
        'right': '8px',
        'top': '8px',
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
        marginTop: '16px',
        display: 'flex',
        padding: '0 10px 10px',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    'diceArea': (props: IThemedStyleProps) => ({
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%) translateY(50%)',
        fontSize: '10px',
        borderRadius: '4px',
        padding: '0 12px',
        background: '#FFF',
    }),
    'diceIcon': {
        'cursor': 'pointer',
        '&:active': {
            opacity: 0.6,
        },
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

interface VocabularyProps {
    engine: Styletron
    type: 'vocabulary' | 'article'
    onCancel: () => void
}
const Vocabulary: FC<VocabularyProps> = (props) => {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })

    const [list, setList] = useState<VocabularyItem[]>([])
    const [selectWord, setWord] = useState<VocabularyItem>()
    const [collectd, setColleced] = useState<boolean>(false)
    const { t } = useTranslation()
    const controlRef = useRef(new AbortController())
    const ArticleOptions = [
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
    const [articleType, setArticleType] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [article, setArticle] = useState<string>('')
    const ArticleTxt = useRef<string>('')
    const descriptionLines = useMemo(() => selectWord?.description.split('\n') ?? [], [selectWord?.description])
    const ArticleUsedWord = useRef<string[]>()
    useEffect(() => {
        onRandomList()
    }, [])

    const checkCollection = useCallback(async () => {
        try {
            const arr = await LocalDB.vocabulary
                .where('word')
                .equals(selectWord?.word ?? '')
                .toArray()
            if (arr.length > 0) {
                setColleced(true)
            } else {
                setColleced(false)
            }
        } catch (e) {
            console.error(e)
        }
    }, [selectWord?.word])

    useEffect(() => {
        checkCollection()
    }, [selectWord?.word])

    const onRandomList = async () => {
        try {
            let randomList: VocabularyItem[] = []
            const count = await LocalDB.vocabulary.count()
            if (count === 0) {
                props.onCancel()
            }
            setWord(undefined)
            if (count <= RANDOM_SIZE) {
                randomList = await LocalDB.vocabulary.toArray()
            } else {
                const arr: number[] = []
                while (arr.length < RANDOM_SIZE) {
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        const random = Math.floor(count * Math.random())
                        if (!arr.includes(random)) {
                            arr.push(random)
                            const wordInfoArr = await LocalDB.vocabulary.offset(random).limit(1).toArray()
                            randomList.push(wordInfoArr[0])
                            break
                        }
                    }
                }
            }
            setList([...randomList])
        } catch (e) {
            console.error(e)
        }
    }

    const onWordCollection = async () => {
        try {
            if (collectd) {
                const wordInfo = await LocalDB.vocabulary.get(selectWord?.word ?? '')
                await LocalDB.vocabulary.delete(wordInfo?.word ?? '')
                setColleced(false)
            } else {
                const wordInfo = list.filter((item) => item.word == selectWord?.word)
                await LocalDB.vocabulary.put({
                    ...wordInfo[0],
                })
                setColleced(true)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const onGenerageArticle = async () => {
        if (!articleType) {
            toast(t('No article type selected'), {
                duration: 3000,
                icon: '😰',
            })
            return
        }
        setArticle('')
        const prompt = ArticleOptions.find((item) => item.id == articleType)?.prompt
        setIsLoading(true)
        controlRef.current.abort()
        controlRef.current = new AbortController()
        const { signal } = controlRef.current
        const frequentWords = await (LocalDB.vocabulary.orderBy('count') as any).desc().limit(MAX_WORDS).toArray()
        const frequentWordsArr = frequentWords.map((item: VocabularyItem) => item.word)
        ArticleUsedWord.current = [...frequentWordsArr]
        ArticleTxt.current = ''
        const str = frequentWordsArr.join(',')
        try {
            await translate({
                mode: 'big-bang',
                signal,
                text: str,
                selectedWord: '',
                detectFrom: '',
                detectTo: '',
                articlePrompt: prompt,
                onMessage: (message) => {
                    if (message.role) {
                        return
                    }
                    setArticle((e) => {
                        console.log('include===', ArticleUsedWord.current, message.content)
                        ArticleTxt.current += message.content
                        if (ArticleUsedWord.current?.includes(message.content.trim())) {
                            return e + `<b style=color:#f40>${message.content}</b>`
                        } else {
                            return e + message.content
                        }
                    })
                },
                onFinish: (reason) => {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setIsLoading(false)
        } finally {
            setIsLoading(false)
        }
    }

    const DangerArticle = useMemo(
        () => (article ? '<div>' + article.replace(/\n/g, '<br/>').replace(/\r/g, '<br//>') + '</div>' : ''),
        [article]
    )
    return (
        <>
            <StyletronProvider value={props.engine}>
                <BaseProvider theme={theme}>
                    <div
                        className={styles.container}
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                        }}
                    >
                        <div className={styles.closeBtn} onClick={props.onCancel}>
                            <AiOutlineCloseCircle fontSize={13} />
                        </div>
                        <div className={styles.list}>
                            {props.type == 'vocabulary' && (
                                <>
                                    {list.map((item, index) => (
                                        <Button
                                            key={index}
                                            size='mini'
                                            kind={selectWord?.word == item.word ? 'primary' : 'secondary'}
                                            onClick={() => setWord(item)}
                                        >
                                            {item.word}
                                        </Button>
                                    ))}
                                </>
                            )}
                            {props.type == 'article' && (
                                <div className={styles.select}>
                                    <Select
                                        size='mini'
                                        clearable={false}
                                        options={ArticleOptions}
                                        value={[{ id: articleType }]}
                                        onChange={({ value }) => {
                                            controlRef.current.abort()
                                            setArticle('')
                                            setArticleType(`${value[0].id ?? ''}`)
                                        }}
                                    />
                                    <StatefulTooltip content='Big Bang' placement='bottom' showArrow>
                                        <div className={styles.actionButton} onClick={onGenerageArticle}>
                                            <Button size='mini' kind={'secondary'}>
                                                <FcIdea size={20} />
                                            </Button>
                                        </div>
                                    </StatefulTooltip>
                                </div>
                            )}
                            {props.type == 'vocabulary' && (
                                <StatefulTooltip content={t('Random Change')} placement='bottom' showArrow>
                                    <div className={styles.diceArea}>
                                        <FaDice fontSize={20} className={styles.diceIcon} onClick={onRandomList} />
                                    </div>
                                </StatefulTooltip>
                            )}
                            {props.type == 'article' && isLoading && (
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
                        {props.type == 'vocabulary' && (
                            <div className={styles.display}>
                                {selectWord?.word && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                        }}
                                    >
                                        {selectWord.word}
                                        <StatefulTooltip
                                            content={collectd ? t('Remove from collection') : t('Add to collection')}
                                            showArrow
                                            placement='right'
                                        >
                                            <div className={styles.actionButton} onClick={onWordCollection}>
                                                {collectd ? <MdGrade size={15} /> : <MdOutlineGrade size={15} />}
                                            </div>
                                        </StatefulTooltip>
                                    </div>
                                )}
                                {descriptionLines.length > 0 &&
                                    descriptionLines.map((line, idx) => <p key={idx}>{line}</p>)}
                                {selectWord?.count && <p>{`[${t('review count')}] ${selectWord?.count}`}</p>}
                                {selectWord?.updateAt && (
                                    <p>
                                        {`[${t('last review')}] ${formatDate(
                                            +selectWord?.updateAt,
                                            'YYYY-MM-DD HH:mm:ss'
                                        )}`}
                                    </p>
                                )}
                            </div>
                        )}
                        {props.type == 'article' && (
                            <div
                                className={`${styles.display} ${styles.articleDisplay}`}
                                dangerouslySetInnerHTML={{ __html: DangerArticle }}
                            ></div>
                        )}
                        {props.type == 'article' && !isLoading && article.length > 0 && (
                            <StatefulTooltip content={t('Copy to clipboard')} showArrow placement='left'>
                                <div style={{ marginLeft: 'auto', marginTop: '10px' }}>
                                    <CopyToClipboard
                                        text={ArticleTxt.current}
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
                            </StatefulTooltip>
                        )}
                    </div>
                </BaseProvider>
            </StyletronProvider>
        </>
    )
}

export default Vocabulary
