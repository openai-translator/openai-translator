import { arkoseTokenGenerator } from './generator.js'

export async function getArkoseToken() {
    await arkoseTokenGenerator.generate()
    console.log('Fail to get arkosetoken!')
}

