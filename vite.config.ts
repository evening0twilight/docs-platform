import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'
import type { UserConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // 项目根目录
  root: fileURLToPath(new URL('.', import.meta.url)),
  
  // 基础公共路径
  base: '/',
  
  // 开发服务器配置
  server: {
    host: true, // 监听所有地址
    port: 3000, // 开发服务器端口
    open: true, // 自动打开浏览器
    cors: true, // 启用 CORS
    proxy: { // API 代理配置
      '/api': {
        target: 'http://localhost:8080', // 后端API地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/collaboration': { // WebSocket代理
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)), // 输出目录
    assetsDir: 'assets', // 静态资源目录
    assetsInlineLimit: 4096, // 小于此值的资源将内联为base64
    cssCodeSplit: true, // CSS代码分割
    sourcemap: false, // 生产环境不生成sourcemap
    minify: 'terser', // 使用terser进行代码压缩
    terserOptions: {
      compress: {
        drop_console: true, // 移除console
        drop_debugger: true // 移除debugger
      }
    } as any, // 使用类型断言解决类型问题
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url))
      },
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@arco-design')) {
              return 'arco'
            }
            if (id.includes('vue')) {
              return 'vue'
            }
            if (id.includes('@tiptap') || id.includes('yjs')) {
              return 'editor'
            }
            return 'vendor'
          }
        }
      }
    }
  },
  
  // 插件配置
  plugins: [
    vue({
      // Vue插件选项
      template: {
        compilerOptions: {
          // 启用响应性语法糖
          isCustomElement: (tag) => tag.includes('-')
        }
      }
    }),
    vueJsx(), // 支持JSX
  ],
  
  // 解析配置
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // 路径别名
      '~': fileURLToPath(new URL('./node_modules', import.meta.url))
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'] // 省略的扩展名
  },
  
  // CSS相关配置
  css: {
    preprocessorOptions: {
      scss: {
      }
    },
    modules: {
      localsConvention: 'camelCase' // CSS模块命名规则
    }
  },
  
  // 优化配置
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@arco-design/web-vue',
      '@arco-design/web-vue/es/icon',
      '@tiptap/starter-kit',
      'yjs',
      'y-websocket'
    ],
    exclude: []
  }
}) as UserConfig