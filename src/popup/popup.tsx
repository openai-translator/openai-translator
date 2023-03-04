import React, { useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import icon from './assets/images/icon.png'
import * as utils from '../utils'

const Popup = () => {
  const [saved, setSaved] = useState(false)
  const [apiToken, setApiToken] = useState<string>()

  useEffect(() => {
    ; (async () => {
      setApiToken(await utils.getApiKey())
    })()
  }, [])

  const onApiTokenChange = useCallback((event) => {
    setApiToken(event.target.value.trim())
  }, [])

  const onSubmmit = useCallback(
    async (event) => {
      event.preventDefault()
      await utils.setApiKey(apiToken ?? '')
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
      }, 3000)
    },
    [apiToken],
  )

  return (
    <div
      style={{
        minWidth: 400,
      }}
    >
      <nav className='flex items-center justify-between flex-wrap bg-teal-500 p-6'>
        <div className='flex items-center flex-shrink-0 text-white mr-6'>
          <img width='26' src={icon} />
          <span className='ml-2 font-semibold text-xl tracking-tight'>OpenAI Translator</span>
        </div>
      </nav>
      <form className='bg-whiterounded px-8 pt-6 pb-6' onSubmit={onSubmmit}>
        <div className='mb-4'>
          <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='api_token'>
            API Token
          </label>
          <input
            className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
            id='api_token'
            name='api_token'
            type='password'
            value={apiToken}
            onChange={onApiTokenChange}
          />
        </div>
        <button className='bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-full'>
          Save
        </button>
        {saved && <span className='ml-1'>saved!</span>}
      </form>
    </div>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById('root'),
)
