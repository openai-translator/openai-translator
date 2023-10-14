import { arkoseTokenGenerator } from '../arkose/js/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api'

export async function getArkoseToken() {
    // 检查当前网址是否以 https://chat.openai.com/ 开头
    if (window.location.href.startsWith('https://chat.openai.com/')) {
        return null; // 不调用 generate 方法，直接返回 null
    }

    const token = await arkoseTokenGenerator.generate()
    if (token) {
        return token
    }
    console.log('Fail to get arkosetoken!')
}

