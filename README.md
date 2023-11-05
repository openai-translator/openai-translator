<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/1651790/224081217-86521beb-1b69-4071-b195-f2ce0bb33db7.png">
  <img alt="NebulaGraph Data Intelligence Suite(ngdi)" src="https://user-images.githubusercontent.com/1651790/224081979-d3aa7867-94a6-4a85-a5d7-603e02360cee.png">
</picture>
<p align="center">
    <br> English | <a href="README-CN.md">中文</a>
</p>
<p align="center">
    <em>GPT Tutor is a branch of OpenAI Translator, and I've made some modifications to it. I've added new features, such as categorizing prompts through grouping, one-click addition of responses to Anki, and removed unnecessary content. Additionally, I've fixed the functionality for using ChatGPT Web. GPT-Tutor is now more than just a translation tool; it has become a practical tool for assisting language learning.</em>
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

# How to use

<p align="center">
  <img width="800" src="https://user-images.githubusercontent.com/1206493/223200182-6a1d2a02-3fe0-4723-bdae-99d8b7212a33.gif" />
</p>

# Features

1. It offers three modes: translation, polishing and summarization.
2. Our tool allows for mutual translation, polishing and summarization across 55 different languages.
3. Streaming mode is supported!
4. It allows users to customize their translation text.
5. One-click copying
6. Text-to-Speech (TTS)
7. Available on all platforms (Windows, macOS, and Linux) for both browsers and Desktop
8. Support screenshot translation
9. Support for vocabulary books, as well as support for generating memory aids based on the words in the vocabulary books
10. Supports both [OpenAI](https://openai.com/) and [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/cognitive-services/openai-service) at the same time

# Preparation

-   (required) Apply for an OpenAI API key [here](https://platform.openai.com/account/api-keys) or [Azure OpenAI Service API Key](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/chatgpt-quickstart?tabs=command-line&pivots=rest-api#retrieve-key-and-endpoint)
-   (optional) If you cannot access OpenAI, you can use the OpenAI API Proxy.

# Installation

## Browser Extension

1. Visit your Browser Extension Store to install this plugin:

   <p align="center">
     <a target="_blank" href="https://chrome.google.com/webstore/detail/openai-translator/ogjibjphoadhljaoicdnjnmgokohngcc">
       <img src="https://img.shields.io/chrome-web-store/v/ogjibjphoadhljaoicdnjnmgokohngcc?label=Chrome%20Web%20Store&style=for-the-badge&color=blue&logo=google-chrome&logoColor=white" />
     </a>
     <a target="_blank" href="https://addons.mozilla.org/en-US/firefox/addon/openai-translator/">
       <img src="https://img.shields.io/amo/v/openai-translator?label=Firefox%20Add-on&style=for-the-badge&color=orange&logo=firefox&logoColor=white" />
     </a>
   </p>

2. Click on the GPT Tutor icon in the browser plugin list, and enter the obtained API KEY into the configuration interface that pops up from this plugin.
 
   <p align="center">
     <img width="600" src="https://user-images.githubusercontent.com/1206493/222958165-159719b4-28a5-44a4-b700-567786df7f03.png" />
   </p>

3. Refresh the page in the browser to enjoy the smooth translation experience 🎉!

## Configure Azure OpenAI Service

```ts
const API_URL = `https://${resourceName}.openai.azure.com`
const API_URL_PATH = `/openai/deployments/${deployName}/completions?api-version=${apiVersion}`
```

- resourceName: Your Azure OpenAI Service resource name.
- deployName: Your Azure OpenAI Service model deploy name, you can change your model here.
- api-version: 2023-05-15, or newer.

# License

[LICENSE](./LICENSE)

# Star History

<p align="center">
  <a target="_blank" href="https://star-history.com/#yetone/openai-translator&Date">
    <img src="https://api.star-history.com/svg?repos=yetone/openai-translator&type=Date" />
  </a>
</p>
