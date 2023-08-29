import { Tooltip } from 'baseui-sd/tooltip'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { RxCopy } from 'react-icons/rx'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast/headless'

export function CopyButton({ text, styles }: { text: string; styles: { actionButton: string } }) {
    const { t } = useTranslation()
    return (
        <Tooltip content={t('Copy to clipboard')} placement='bottom'>
            <div>
                <CopyToClipboard
                    text={text}
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
    )
}
