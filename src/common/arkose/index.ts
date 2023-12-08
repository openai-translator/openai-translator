import { arkoseTokenGenerator } from './generator.js'

export async function getArkoseToken() {
    const token = await arkoseTokenGenerator.generate()
    console.log('Fail to get arkosetoken!')
}

