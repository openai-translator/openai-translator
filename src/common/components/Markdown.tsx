import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark'
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light'
import { useTheme } from '../hooks/useTheme'

export interface IMarkdownProps {
    children: string
}

export function Markdown({ children }: IMarkdownProps) {
    const { themeType } = useTheme()

    return (
        <ReactMarkdown
            components={{
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                        <SyntaxHighlighter
                            {...props}
                            style={themeType === 'dark' ? oneDark : oneLight}
                            language={match[1]}
                            PreTag='div'
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code {...props} className={className}>
                            {children}
                        </code>
                    )
                },
            }}
        >
            {children}
        </ReactMarkdown>
    )
}
