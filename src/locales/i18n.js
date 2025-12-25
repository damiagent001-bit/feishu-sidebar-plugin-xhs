import { createI18n } from 'vue-i18n'
import en from './en.json';
import zh from './zh.json';
import ja from './ja.json';
import { bitable } from '@lark-base-open/js-sdk'

// 语言映射：将飞书语言代码映射到i18n语言代码
const languageMap = {
  'zh-CN': 'zh',
  'zh': 'zh',
  'en-US': 'en',
  'en': 'en',
  'ja-JP': 'ja',
  'ja': 'ja',
}

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  allowComposition: true, // 占位符支持
  messages: {
    en: en,
    zh: zh,
    ja: ja
  }
})

// 获取并设置语言
bitable.bridge.getLanguage().then((lang) => {
  const mappedLang = languageMap[lang] || 'en'
  i18n.global.locale = mappedLang
}).catch((error) => {
  console.error('Failed to get language:', error)
  i18n.global.locale = 'en'
})

