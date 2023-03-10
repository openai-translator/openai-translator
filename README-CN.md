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
    <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
</a>

<!-- TypeScript Badge -->
<img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-blue?style=flat-square&logo=typescript&logoColor=white" />

<!-- Rust Badge -->
<img alt="Rust" src="https://img.shields.io/badge/-Rust-orange?style=flat-square&logo=rust&logoColor=white" />

<a href="https://github.com/yetone/openai-translator/releases" target="_blank">
<img alt="Chrome" src="https://img.shields.io/badge/-Chrome-green?style=flat-square&logo=google-chrome&logoColor=white" />
</a>

<a href="https://github.com/yetone/openai-translator/releases" target="_blank">
<img alt="Firefox" src="https://img.shields.io/badge/-Firefox-orange?style=flat-square&logo=firefox&logoColor=white" />
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

我开发了一个 Bob 的插件 [bob-plugin-openai-translator](https://github.com/yetone/bob-plugin-openai-translator) 使用 ChatGPT API 在 macOS 上进行全局划词翻译，
但是由于很多用户并不是 macOS 用户，所以特此开发了一个浏览器插件方便非 macOS 用户使用 ChatGPT 进行划词翻译。

# 既是浏览器插件也是跨平台桌面端应用！

* 注：桌面端应用暂不支持划词，但是即将支持，敬请期待！

<img width="560" src="https://user-images.githubusercontent.com/1206493/223899374-ff386436-63b8-4618-afdd-fed2e6b48d56.png" />


# 使用截图

<img width="800" src="https://user-images.githubusercontent.com/1206493/223200182-6a1d2a02-3fe0-4723-bdae-99d8b7212a33.gif" />

# 特性

1. 支持三种翻译模式：翻译、润色、总结
2. 支持 55 种语言的相互翻译、润色和总结功能
3. 支持实时翻译、润色和总结，以最快的速度响应用户，让翻译、润色和总结的过程达到前所未有的流畅和顺滑
4. 支持自定义翻译文本
5. 支持一键复制
6. 支持 TTS
7. 有桌面端应用，全平台（Windows + macOS + Linux）支持！

# 桌面应用版安装方法

1. 去 [Release](https://github.com/yetone/openai-translator/releases) 页面下载你对应的操作系统的 zip 包

2. 下载完毕后解压 zip 包

3. 打开解压后的文件

* Windows 用户

    Windows 用户双击解压出来的文件夹里的 `OpenAI Translator` 即可使用！
    
* macOS 用户

    macOS 用户解压出来的是一个名字叫 `OpenAI Translator` 的应用，建议把解压出来的应用拖动到 `Applications` 目录中，macOS 用户第一次打开可能会遇到如下报错：

    <img width="300" src="https://user-images.githubusercontent.com/1206493/223916804-45ce3f34-6a4a-4baf-a0c1-4ab5c54c521f.png" />

    点击 `Cancel` 按钮，然后去 `Settings` -> `Privacy & Security` 页面，点击 `Open Anyway` 按钮，然后在弹出窗口里点击 `Open` 按钮即可，以后打开 `OpenAI Translator` 就再也不会有任何弹窗告警了 🎉

    <img width="500" src="https://user-images.githubusercontent.com/1206493/223916970-9c99f15e-cf61-4770-b92d-4a78f980bb26.png" />

    <img width="200" src="https://user-images.githubusercontent.com/1206493/223917449-ed1ac19f-c43d-4b13-9888-79ba46ceb862.png" />

# 浏览器插件安装方法

由于此插件还在 Chrome Store 审核中，所以现在需要手动下载和安装，敬请谅解。

1. 去 [Chrome 应用商店](https://chrome.google.com/webstore/detail/openai-translator/ogjibjphoadhljaoicdnjnmgokohngcc) 安装即可

2. 去 [OpenAI](https://platform.openai.com/account/api-keys) 获取你的 API KEY

<img width="600" src="https://user-images.githubusercontent.com/1206493/223043946-0e7486ca-94d7-4324-a4f2-f62b9a3d527d.png" />

3. 点击浏览器插件列表里的 OpenAI Translator 图标，把 API KEY 填入此插件弹出的配置界面中

<img width="600" src="https://user-images.githubusercontent.com/1206493/222958165-159719b4-28a5-44a4-b700-567786df7f03.png" />

4. 刷新浏览器页面，即可享受丝滑般的划词翻译体验 🎉

# 请作者喝一杯咖啡

<div align="center">
<img height="360" src="https://user-images.githubusercontent.com/1206493/220753437-90e4039c-d95f-4b6a-9a08-b3d6de13211f.png" />
<img height="360" src="https://user-images.githubusercontent.com/1206493/220756036-d9ac4512-0375-4a32-8c2e-8697021058a2.png" />
</div>
