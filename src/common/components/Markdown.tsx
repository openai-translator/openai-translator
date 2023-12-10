import ReactMarkdown from 'react-markdown'
import { CodeBlock } from './CodeBlock'
import { useTheme } from '../hooks/useTheme'
import { HTMLAttributeAnchorTarget } from 'react'

export interface IMarkdownProps {
    children: string
    linkTarget?: HTMLAttributeAnchorTarget
}

export function Markdown({ children, linkTarget }: IMarkdownProps) {
    const { theme } = useTheme()

    return (
        <ReactMarkdown
            components={{
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                a({ node, className, children, ...props }) {
                    const newProps = {
                        target: linkTarget,
                        ...props,
                    }
                    return <a {...newProps}>{children}</a>
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                code({ node, inline, className, children, ...props }) {
                    if (inline) {
                        return (
                            <code
                                {...props}
                                className={className}
                                style={{
                                    backgroundColor: theme.colors.backgroundSecondary,
                                    color: theme.colors.contentSecondary,
                                    padding: '0.2rem',
                                    borderRadius: '0.2rem',
                                }}
                            >
                                {children}
                            </code>
                        )
                    }
                    const match = /language-(\w+)/.exec(className || '')
                    let language = 'text'
                    if (match) {
                        language = match[1]
                    }
                    const code = (children as string[])[0]
                    return <CodeBlock code={code} language={language} />
                },
            }}
        >
            {children}
        </ReactMarkdown>
    )
}
