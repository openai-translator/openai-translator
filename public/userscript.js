// ==UserScript==
// @name            openai-translator
// @namespace       https://github.com/yetone/openai-translator
// @version         0.1.0
// @description     基于 ChatGPT API 的划词翻译浏览器插件和跨平台桌面端应用
// @description:en  Browser extension and cross-platform desktop application for translation based on ChatGPT API
// @author          yetone,maltoze
// @icon64          https://cdn.jsdelivr.net/gh/yetone/openai-translator@v0.1.0/public/icon.png
// @icon            https://cdn.jsdelivr.net/gh/yetone/openai-translator@v0.1.0/public/icon.png
// @match           *://*/*
// @require         https://cdn.jsdelivr.net/gh/yetone/openai-translator@v0.1.0/dist/userscript/index.js
// @resource        MAIN_CSS https://cdn.jsdelivr.net/gh/yetone/openai-translator@v0.1.0/dist/userscript/index.css
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM_xmlhttpRequest
// @grant           GM_addStyle
// @grant           GM_getResourceText
// @license         MIT
// ==/UserScript==

/* eslint-disable no-undef */
;(function () {
    'use strict'
    const css = GM_getResourceText('MAIN_CSS')
    GM_addStyle(css)
})()
