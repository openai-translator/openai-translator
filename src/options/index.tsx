import React from 'react'
import ReactDOM from 'react-dom'
import { Popup } from '../popup'

const Options = () => {
  return <Popup />
}

ReactDOM.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
  document.getElementById('root'),
)
