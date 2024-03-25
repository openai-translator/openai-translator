import { createRoot } from 'react-dom/client'
import { Translator } from '../../common/components/Translator'
import { Client as Styletron } from 'styletron-engine-atomic'
import '../../common/i18n.js'
import './index.css'
import { PREFIX } from '../../common/constants'
import { useTheme } from '../../common/hooks/useTheme'
import {
    ClerkProvider,
    SignedIn,
    SignedOut,
    SignIn,
    SignUp,
    SignInButton,
    useClerk,
    UserButton,
    useUser,
} from '@clerk/chrome-extension'
import React from 'react'
import { useNavigate, Routes, Route, MemoryRouter } from 'react-router-dom'

function HelloUser() {
    const { isSignedIn, user } = useUser()
    const clerk = useClerk()

    if (!isSignedIn) {
        return null
    }

    return (
        <>
            <p>Hi, {user.primaryEmailAddress?.emailAddress}!</p>
            <p>
                <button onClick={() => clerk.signOut()}>Sign out</button>
            </p>
        </>
    )
}

const publishableKey = 'pk_test_ZXhvdGljLWJ1bGxmcm9nLTM2LmNsZXJrLmFjY291bnRzLmRldiQ'

function ClerkProviderWithRoutes() {
    const { theme } = useTheme()
    const navigate = useNavigate()

    return (
        <ClerkProvider publishableKey={publishableKey} navigate={(to) => navigate(to)}>
            <div
                className='App'
                style={{
                    position: 'relative',
                    minHeight: '100vh',
                    background: theme.colors.backgroundPrimary,
                }}
                data-testid='popup-container'
            >
                <main className='App-main'>
                    <Routes>
                        <Route path='/sign-up/*' element={<SignUp signInUrl='/' />} />
                        <Route
                            path='/'
                            element={
                                <>
                                    <SignedIn>
                                        <HelloUser />
                                        <Translator
                                            showSettings
                                            defaultShowSettings
                                            text=''
                                            engine={engine}
                                            autoFocus
                                        />
                                    </SignedIn>
                                    <SignedOut>
                                        <SignIn afterSignInUrl='/' signUpUrl='/sign-up' />
                                    </SignedOut>
                                </>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </ClerkProvider>
    )
}

const engine = new Styletron({
    prefix: `${PREFIX}-styletron-`,
})

const PUBLISHABLE_KEY = 'pk_test_ZXhvdGljLWJ1bGxmcm9nLTM2LmNsZXJrLmFjY291bnRzLmRldiQ'

if (!PUBLISHABLE_KEY) {
    throw new Error('Missing Publishable Key')
}

const root = createRoot(document.getElementById('root') as HTMLElement)

function App() {
    const { theme } = useTheme()

    return (
        <MemoryRouter>
            <ClerkProviderWithRoutes />
        </MemoryRouter>
    )
}

root.render(<App />)
