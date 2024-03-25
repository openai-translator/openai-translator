/* eslint-disable no-case-declarations */
import browser from 'webextension-polyfill'
import { BackgroundEventNames } from '../../common/background/eventnames'
import { BackgroundFetchRequestMessage, BackgroundFetchResponseMessage } from '../../common/background/fetch'
import { vocabularyInternalService } from '../../common/internal-services/vocabulary'
import { actionInternalService } from '../../common/internal-services/action'
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, DocumentData } from 'firebase/firestore';
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
        id: 'open-translator',
        type: 'normal',
        title: 'OpenAI Translator',
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

async function fetchWithStream(
    port: browser.Runtime.Port,
    message: BackgroundFetchRequestMessage,
    signal: AbortSignal
) {
    if (!message.details) {
        throw new Error('No fetch details')
    }

    const { url, options } = message.details
    let response: Response | null = null

    try {
        response = await fetch(url, { ...options, signal })
    } catch (error) {
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
        console.log(error)
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
                        controller.abort()
                        break
                    case 'open':
                        fetchWithStream(port, message, signal)
                        break
                }
            })
            return
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
