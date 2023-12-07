import { arkoseTokenGenerator } from './generator.js'

export async function getArkoseToken() {
    const token = await arkoseTokenGenerator.generate()
    if (token) {
        return token
    }
    console.log('Fail to get arkosetoken!')
}

