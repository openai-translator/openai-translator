let ArkoseToken
export async function fetchArkoseToken(): Promise<string | undefined> {
    try {
        // 生成一个由数字和字母组成的8位字符串
        const part1 = Array.from({ length: 8 }, () => {
            const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
            return chars[Math.floor(Math.random() * chars.length)]
        }).join('')

        // 生成一个10位的纯数字字符串
        const part2 = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10).toString()).join('')
        ArkoseToken = 
            '64617865eef453742.9330441004|r=ap-southeast-1|meta=3|metabgclr=transparent|metaiconclr=%23757575|guitextcolor=%23000000|pk=35536E1E-65B4-4D96-9D97-6ADB7EFF8147|at=40|sup=1|rid=100|ag=101|cdn_url=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-ap-southeast-1.arkoselabs.com|surl=https%3A%2F%2Ftcr9i.chat.openai.com|smurl=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager'
        return ArkoseToken
    } catch (err) {
        console.error(err)
        return undefined
  }
}
