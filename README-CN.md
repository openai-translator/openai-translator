<p align="center">
    <br> <a href="README.md">English</a> | 中文
</p>
<p align="center">
    <em>GPT Tutor是OpenAI Translator的一个分支，我对它进行了一些修改，增添了一些新功能，比如通过分组来对prompt进行分类，一键将回答添加到anki中，同时删除了一些不必要的内容，并且修复了ChatGPT Web的使用。GPT-Tutor现在不只是作为一个翻译工具，而是一个辅助语言学习的实用工具。</em>
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
const API_URL_PATH = `/openai/deployments/${deployName}/completions?api-version=${apiVersion}`
```

- resourceName: 你的 Azure OpenAI Service 资源名称。
- deployName: 你的 Azure OpenAI Service 模型部署名称，更改部署名称以切换模型。
- api-version: 2023-05-15，或者更新的版本。

# License

[LICENSE](./LICENSE)
