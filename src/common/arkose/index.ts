import { arkoseTokenGenerator } from './generator.js'

export async function ArkoseToken() {
    const token = await arkoseTokenGenerator.generate()
    if (token) {
        return token
    } else {
        console.log('Fail to get arkosetoken!')
    }
}
