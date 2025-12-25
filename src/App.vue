<script setup>
import Form from './components/Form.vue'
import { onMounted, ref, provide } from 'vue'
import { bitable } from '@lark-base-open/js-sdk'
import { STYLE_THEMES } from './config.js'

// 主题相关
const theme = ref('LIGHT')
// 样式主题（抖音/小红书）
const styleTheme = ref('douyin')

// 设置飞书主题颜色
const setThemeColor = () => {
  const el = document.documentElement
  
  // 处理主要样式
  const themeStyles = {
    LIGHT: {
      '--el-color-primary': 'rgb(20, 86, 240)',
      '--el-bg-color': '#fff',
      '--el-border-color-lighter': '#dee0e3',
    },
    DARK: {
      '--el-color-primary': '#4571e1',
      '--el-bg-color': '#252525',
      '--el-border-color-lighter': '#434343',
    },
  }
  
  const currentThemeStyles = themeStyles[theme.value] || themeStyles.LIGHT
  
  // 设置样式变量
  Object.entries(currentThemeStyles).forEach(([property, value]) => {
    el.style.setProperty(property, value)
  })
}

// 设置样式主题（抖音/小红书）
const setStyleTheme = (platform) => {
  const el = document.documentElement
  styleTheme.value = platform || 'douyin'
  
  const themeConfig = STYLE_THEMES[styleTheme.value] || STYLE_THEMES.douyin
  
  // 设置 data-theme 属性，用于 CSS 选择器
  el.setAttribute('data-theme', styleTheme.value)
  
  // 设置样式变量
  Object.entries(themeConfig).forEach(([property, value]) => {
    el.style.setProperty(property, value)
  })
}

// 提供给子组件使用
provide('setStyleTheme', setStyleTheme)
provide('styleTheme', styleTheme)

// 挂载时处理
onMounted(async () => {
  try {
    theme.value = await bitable.bridge.getTheme()
    setThemeColor()
  } catch (error) {
    console.error('Failed to get theme:', error)
  }
  
  // 主题修改时处理
  bitable.bridge.onThemeChange((event) => {
    theme.value = event.data.theme
    setThemeColor()
  })
  
  // 初始化样式主题（默认小红书，小红书专用版本）
  setStyleTheme('xiaohongshu')
})
</script>

<template>
  <main>
    <Form />
  </main>
</template>

<style scoped>
main {
  padding: 0;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Tahoma, 'PingFang SC', 'Microsoft Yahei', Arial, 'Hiragino Sans GB', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
}

/* 日文环境字体 */
:lang(ja) main {
  font-family: 'ヒラギノ角ゴ Pro W3', 'Hiragino Kaku Gothic Pro', 'Yu Gothic UI', '游ゴシック体', 'Noto Sans Japanese', 'Microsoft Jhenghei UI', 'Microsoft Yahei UI', 'ＭＳ Ｐゴシック', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
}
</style>
