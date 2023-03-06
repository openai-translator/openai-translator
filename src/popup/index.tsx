import React, { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import icon from './assets/images/icon.png'
import beams from './assets/images/beams.jpg'
import toast, { Toaster } from 'react-hot-toast'
import * as utils from '../common/utils'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { LightTheme, BaseProvider } from 'baseui'
import { Input } from 'baseui/input'
import { createForm } from '../components/Form'
import { Button } from 'baseui/button'
import './index.css'

interface SettingsSchema {
  apiKey: string
}

const engine = new Styletron()

const { Form, FormItem, useForm } = createForm<SettingsSchema>()

export function Popup() {
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<SettingsSchema>({
    apiKey: '',
  })

  const [form] = useForm()

  useEffect(() => {
    form.setFieldsValue(values)
  }, [form, values])

  useEffect(() => {
    ; (async () => {
      const apiKey = await utils.getApiKey()
      setValues((values_) => ({ ...values_, apiKey }))
    })()
  }, [])

  const onChange = useCallback((_changes: Partial<SettingsSchema>, values_: SettingsSchema) => {
    setValues(values_)
  }, [])
  const onSubmmit = useCallback(async (data: SettingsSchema) => {
    setLoading(true)
    await utils.setApiKey(data.apiKey)
    toast('Saved', {
      icon: '👍',
      duration: 3000,
    })
    setLoading(false)
  }, [])

  return (
    <div
      style={{
        minWidth: 400,
      }}
    >
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <nav
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '15px 25px',
              color: '#333',
              background: `url(${beams}) no-repeat center center`,
              gap: 10,
            }}
          >
            <img width='22' src={icon} alt='logo' />
            <h2>OpenAI Translator</h2>
          </nav>
          <Form
            form={form}
            style={{
              padding: '20px 25px',
            }}
            onFinish={onSubmmit}
            initialValues={values}
            onValuesChange={onChange}
          >
            <FormItem required name='apiKey' label='API Key'>
              <Input
                type='password'
                size='compact'
                overrides={{
                  Root: {
                    style: {
                      width: '392px',
                    },
                  },
                }}
              />
            </FormItem>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'row',
                gap: 10,
              }}
            >
              <div
                style={{
                  marginRight: 'auto',
                }}
              />
              <Button isLoading={loading} size='compact'>
                Save
              </Button>
            </div>
            <Toaster />
          </Form>
        </BaseProvider>
      </StyletronProvider>
    </div>
  )
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)
