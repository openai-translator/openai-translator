/* eslint-disable no-case-declarations */
import browser from 'webextension-polyfill'
import { BackgroundEventNames } from '../../common/background/eventnames'
import { BackgroundFetchRequestMessage, BackgroundFetchResponseMessage } from '../../common/background/fetch'
import { vocabularyInternalService } from '../../common/internal-services/vocabulary'
import { actionInternalService } from '../../common/internal-services/action'
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, DocumentData } from 'firebase/firestore'
import { setUserConfig } from '../../common/utils'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyByHatBXjUmc2_ACN7mIOA2EWE_uwGoR00',
    authDomain: 'gpt-tutor-6347c.firebaseapp.com',
    databaseURL: 'https://gpt-tutor-6347c-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'gpt-tutor-6347c',
    storageBucket: 'gpt-tutor-6347c.appspot.com',
    messagingSenderId: '310403142777',
    appId: '1:310403142777:web:2fdc9cf1173298232470a8',
    measurementId: 'G-NXCPHVK0J2',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore()

export const getUserData = async (userId: string) => {
    try {
        const q = query(collection(db, 'usersData'), where('userId', '==', userId))
        const querySnapshot = await getDocs(q)
        const data: DocumentData[] = []
        querySnapshot.forEach((doc) => {
            data.push(doc.data())
        })
        return data
    } catch (error: unknown) {
        console.error('Error fetching user data: ', error.message)
        throw error
    }
}

browser.contextMenus?.create(
    {
        id: 'gpt-tutor',
        type: 'normal',
        title: 'GPT Tutor',
        contexts: ['page', 'selection'],
    },
    () => {
        browser.runtime.lastError
    }
)

browser.contextMenus?.onClicked.addListener(async function (info) {
    const [tab] = await chrome.tabs.query({ active: true })
    tab.id &&
        browser.tabs.sendMessage(tab.id, {
            type: 'open-translator',
            info,
        })
})

try {
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (!details) {
                return
            }
            const chatgptArkoseReqParams = 'cgb=vhwi'
            if (details.url.includes('/public_key') && !details.url.includes(chatgptArkoseReqParams)) {
                const formData = new URLSearchParams()
                if (details.requestBody?.formData) {
                    // 检查formData是否存在
                    for (const k in details.requestBody.formData) {
                        formData.append(k, details.requestBody.formData[k])
                    }
                }

                let formString = formData.toString()
                if (!formString && details.requestBody?.raw?.[0]?.bytes) {
                    // 检查raw和bytes是否存在
                    const decoder = new TextDecoder('utf-8')
                    formString = decoder.decode(new Uint8Array(details.requestBody.raw[0].bytes))
                }

                setUserConfig({
                    chatgptArkoseReqUrl: details.url,
                    chatgptArkoseReqForm:
                        formData.toString() ||
                        new TextDecoder('utf-8').decode(new Uint8Array(details.requestBody.raw[0].bytes)),
                }).then(() => {
                    console.log('Arkose req url and form saved')
                })
            }
        },
        {
            urls: ['https://*.openai.com/*'],
            types: ['xmlhttprequest'],
        },
        ['requestBody']
    )
} catch (error) {
    console.error('Error setting up webRequest listener:', error)
}

async function fetchWithStream(
    port: browser.Runtime.Port,
    message: BackgroundFetchRequestMessage,
    signal: AbortSignal
) {
    if (!message.details) {
        console.error('fetchWithStream: No fetch details provided')
        throw new Error('No fetch details')
    }

    const { url, options } = message.details
    let response: Response | null = null

    try {
        response = await fetch(url, { ...options, signal })
    } catch (error) {
        console.error('fetchWithStream: Fetch failed', error)
        if (error instanceof Error) {
            const { message, name } = error
            port.postMessage({
                error: { message, name },
            })
        }
        port.disconnect()
        return
    }

    const responseSend: BackgroundFetchResponseMessage = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        redirected: response.redirected,
        type: response.type,
        url: response.url,
    }

    const reader = response?.body?.getReader()
    if (!reader) {
        console.error('fetchWithStream: Response body reader not available')
        port.postMessage(responseSend)
        return
    }

    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            const str = new TextDecoder().decode(value)
            port.postMessage({
                ...responseSend,
                data: str,
            })
        }
    } catch (error) {
        console.error('fetchWithStream: Error while reading the response stream', error)
    } finally {
        port.disconnect()
        reader.releaseLock()
    }
}

browser.runtime.onConnect.addListener(async function (port) {
    switch (port.name) {
        case BackgroundEventNames.fetch:
            const controller = new AbortController()
            const { signal } = controller

            port.onMessage.addListener(function (message: BackgroundFetchRequestMessage) {
                switch (message.type) {
                    case 'abort':
                        console.log('fetchWithStream: Abort signal received')
                        controller.abort()
                        break
                    case 'open':
                        fetchWithStream(port, message, signal).catch((error) =>
                            console.error('fetchWithStream: Error in fetchWithStream', error)
                        )
                        break
                    default:
                        console.error('fetchWithStream: Unknown message type received', message.type)
                }
            })
            return
        default:
            console.error('fetchWithStream: Connected to an unknown port', port.name)
    }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callMethod(request: any, service: any): Promise<any> {
    const { method, args } = request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (service as any)[method](...args)
    if (result instanceof Promise) {
        const v = await result
        return { result: v }
    }
    return { result }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
browser.runtime.onMessage.addListener(async (request) => {
    switch (request.type) {
        case BackgroundEventNames.vocabularyService:
            return await callMethod(request, vocabularyInternalService)
        case BackgroundEventNames.actionService:
            return await callMethod(request, actionInternalService)
    }
})

browser?.commands?.onCommand.addListener(async (command) => {
    switch (command) {
        case 'open-popup': {
            await browser.windows.create({
                type: 'popup',
                url: '/src/browser-extension/popup/index.html',
            })
        }
    }
})

// background.js 或 service-worker.js
chrome?.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch((error: any) => console.error(error))
