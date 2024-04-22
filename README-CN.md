<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/1651790/224081217-86521beb-1b69-4071-b195-f2ce0bb33db7.png">
  <img alt="NebulaGraph Data Intelligence Suite(ngdi)" src="https://user-images.githubusercontent.com/1651790/224081979-d3aa7867-94a6-4a85-a5d7-603e02360cee.png">
</picture>
<p align="center">
    <br> <a href="README.md">English</a> | 中文
</p>
<p align="center">
    <em>The translator that does more than just translation - powered by OpenAI.</em>
</p>

<p align="center">
  <a href="LICENSE" target="_blank">
    <img alt="MIT License" src="https://img.shields.io/github/license/yetone/openai-translator.svg?style=flat-square" />
  </a>

  <!-- TypeScript Badge -->
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-blue?style=flat-square&logo=typescript&logoColor=white" />

  <!-- Rust Badge -->
  <img alt="Rust" src="https://img.shields.io/badge/-Rust-orange?style=flat-square&logo=rust&logoColor=white" />

  <a href="https://chrome.google.com/webstore/detail/openai-translator/ogjibjphoadhljaoicdnjnmgokohngcc" target="_blank">
    <img alt="Chrome" src="https://img.shields.io/chrome-web-store/stars/ogjibjphoadhljaoicdnjnmgokohngcc?color=blue&label=Chrome&style=flat-square&logo=google-chrome&logoColor=white" />
  </a>

  <a href="https://addons.mozilla.org/en-US/firefox/addon/openai-translator/" target="_blank">
    <img alt="Firefox" src="https://img.shields.io/amo/stars/openai-translator?color=orange&label=Firefox&style=flat-square&logo=firefox&logoColor=white" />
  </a>

  <a href="https://github.com/yetone/openai-translator/releases" target="_blank">
    <img alt="macOS" src="https://img.shields.io/badge/-macOS-black?style=flat-square&logo=apple&logoColor=white" />
  </a>

  <a href="https://github.com/yetone/openai-translator/releases" target="_blank">
    <img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" />
  </a>

  <a href="https://github.com/yetone/openai-translator/releases" target="_blank">
    <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" />
  </a>

</p>

# 为啥要造这个轮子？

我开发了一个 Bob 的插件 [bob-plugin-openai-translator](https://github.com/yetone/bob-plugin-openai-translator) 使用 ChatGPT API 在 macOS 上进行全局划词翻译。

但是由于很多用户并不是 macOS 用户，所以特此开发了一个浏览器插件方便非 macOS 用户使用 ChatGPT 进行划词翻译。

# 既是浏览器插件也是跨平台桌面端应用！

<p align="center">
  <img width="560" src="https://user-images.githubusercontent.com/1206493/223899374-ff386436-63b8-4618-afdd-fed2e6b48d56.png" />
</p>

# 使用截图

<p align="center">
  <img width="800" src="https://user-images.githubusercontent.com/1206493/223200182-6a1d2a02-3fe0-4723-bdae-99d8b7212a33.gif" />
</p>

# 特性

1. 支持三种翻译模式：翻译、润色、总结
2. 支持 55 种语言的相互翻译、润色和总结功能
3. 支持实时翻译、润色和总结，以最快的速度响应用户，让翻译、润色和总结的过程达到前所未有的流畅和顺滑
4. 支持自定义翻译文本
5. 支持一键复制
6. 支持 TTS
7. 有桌面端应用，全平台（Windows + macOS + Linux）支持！
8. 支持截图翻译
9. 支持生词本，同时支持基于生词本里的单词生成帮助记忆的内容
10. 同时支持 [OpenAI](https://openai.com/) 和 [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/cognitive-services/openai-service)

# 使用准备

-   （必须）申请 [OpenAI API Key](https://platform.openai.com/account/api-keys) 或 [Azure OpenAI Service API Key](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/chatgpt-quickstart?tabs=command-line&pivots=rest-api#retrieve-key-and-endpoint)
-   （可选）如果无法访问 OpenAI，可以使用 OpenAI API Proxy

# 安装

## Windows

### 手动安装

1. 在 [Latest Release](https://github.com/yetone/openai-translator/releases/latest) 页面下载以 `.exe` 结尾的安装包
2. 下载完成后双击安装包进行安装
3. 如果提示不安全，可以点击 `更多信息` -> `仍要运行` 进行安装
4. 开始使用吧！

## MacOS

### 手动安装

1.  去 [Latest Release](https://github.com/yetone/openai-translator/releases/latest) 页面下载对应芯片以 `.dmg` 的安装包（Apple Silicon机器请使用aarch64版本，并注意执行下文`xattr`指令）
2.  下载完成后双击安装包进行安装，然后将 `OpenAI Translator` 拖动到 `Applications` 文件夹。
3.  开始使用吧！

### 故障排除

-   "OpenAI Translator" can’t be opened because the developer cannot be verified.
    
    <p align="center">
      <img width="300" src="https://user-images.githubusercontent.com/1206493/223916804-45ce3f34-6a4a-4baf-a0c1-4ab5c54c521f.png" />
    </p>

    -   点击 `Cancel` 按钮，然后去 `设置` -> `隐私与安全性` 页面，点击 `仍要打开` 按钮，然后在弹出窗口里点击 `打开` 按钮即可，以后打开 `OpenAI Translator` 就再也不会有任何弹窗告警了 🎉
        
        <p align="center">
          <img width="500" src="https://user-images.githubusercontent.com/1206493/223916970-9c99f15e-cf61-4770-b92d-4a78f980bb26.png" /> <img width="200" src="https://user-images.githubusercontent.com/1206493/223917449-ed1ac19f-c43d-4b13-9888-79ba46ceb862.png" />
        </p>

    -   如果在 `隐私与安全性` 中找不到以上选项，或启动时提示文件损坏（Apple Silicon版本）。打开 `Terminal.app`，并输入以下命令（中途可能需要输入密码），然后重启 `OpenAI Translator` 即可：

        ```sh
        sudo xattr -d com.apple.quarantine /Applications/OpenAI\ Translator.app
        ```

-   如果您每次打开它都遇到权限提示，或者无法执行快捷键划词翻译，请前往 `设置` -> `隐私与安全性` -> `辅助功能` 中删除 OpenAI Translator，然后重新添加 OpenAI Translator:

    <p align="center">
      <img width="500" src="https://user-images.githubusercontent.com/1206493/224536148-eec559bf-4d99-48c1-bbd3-2cc105aff084.png" />
      <img width="600" src="https://user-images.githubusercontent.com/1206493/224536277-4200f58e-8dc0-4c01-a27a-a30d7d8dc69e.gif" />
    </p>

## 安装桌面端划词扩展

详情请见 [桌面端划词扩展](./CLIP-EXTENSIONS-CN.md)

  <p align="center">
    <img width="600" src="https://user-images.githubusercontent.com/1206493/240355949-8f41d98d-f097-4ce4-a533-af60e1757ca1.gif" />
  </p>

## 浏览器插件

1. 访问你使用的浏览器的插件市场安装此插件：

   <p align="center">
     <a target="_blank" href="https://chrome.google.com/webstore/detail/openai-translator/ogjibjphoadhljaoicdnjnmgokohngcc">
       <img src="https://img.shields.io/chrome-web-store/v/ogjibjphoadhljaoicdnjnmgokohngcc?label=Chrome%20Web%20Store&style=for-the-badge&color=blue&logo=google-chrome&logoColor=white" />
     </a>
     <a target="_blank" href="https://addons.mozilla.org/en-US/firefox/addon/openai-translator/">
       <img src="https://img.shields.io/amo/v/openai-translator?label=Firefox%20Add-on&style=for-the-badge&color=orange&logo=firefox&logoColor=white" />
     </a>
   </p>

2. 点击浏览器插件列表里的 OpenAI Translator 图标，把获取的 API KEY 填入此插件弹出的配置界面中

   <p align="center">
     <img width="600" src="https://user-images.githubusercontent.com/1206493/222958165-159719b4-28a5-44a4-b700-567786df7f03.png" />
   </p>

3. 刷新浏览器页面，即可享受丝滑般的划词翻译体验 🎉

## 配置 Azure OpenAI Service

```ts
const API_URL = `https://${resourceName}.openai.azure.com`
const API_URL_PATH = `/openai/deployments/${deployName}/chat/completions?api-version=${apiVersion}`
```

- resourceName: 你的 Azure OpenAI Service 资源名称。
- deployName: 你的 Azure OpenAI Service 模型部署名称，更改部署名称以切换模型。
- api-version: 2023-05-15，或者更新的版本。（受支持的API version列表可以在[Azure官方文档](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#completions)查找）

# License

[LICENSE](./LICENSE)

# Star 历史

<p align="center">
  <a target="_blank" href="https://star-history.com/#yetone/openai-translator&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=yetone/openai-translator&type=Date&theme=dark">
      <img alt="NebulaGraph Data Intelligence Suite(ngdi)" src="https://api.star-history.com/svg?repos=yetone/openai-translator&type=Date">
    </picture>
  </a>
</p>
