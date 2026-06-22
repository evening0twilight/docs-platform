import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // 按需自动导入模板中用到的 Arco 组件(只引入组件 JS,样式仍走 main.ts 的全量 arco.css,
    // 从而保证暗色主题与全部样式不变)。配合移除 main.ts 的 app.use(ArcoVue),
    // 让全量注册的 ~80 个组件被 tree-shake 成实际用到的那些,大幅缩减 JS 体积。
    Components({
      dts: false,
      resolvers: [ArcoResolver({ importStyle: false })],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    // 只对「项目直接依赖」的 yjs 全家桶去重,确保运行时唯一一份 yjs 实例
    // (避免 Collaboration/Caret 拿到不同的 ySyncPluginKey 而崩溃)。
    // 注:prosemirror-*/@tiptap/y-tiptap 是传递依赖,pnpm 严格布局下无法从项目根解析,
    // 列入 dedupe 会让生产构建(Rollup)解析失败;它们经 @tiptap/pm 已是单实例,无需去重。
    dedupe: ['yjs', 'y-prosemirror', 'y-protocols'],
  },
  optimizeDeps: {
    // 把 yjs 协同相关入口放进同一次预打包,配合上面的 dedupe,
    // 让 Collaboration 与 CollaborationCaret 经由 @tiptap/y-tiptap 共享同一份 yjs 实例。
    // 注:@tiptap/y-tiptap 是传递依赖、无法作为裸标识被 include 解析(会告警),
    // 它会随 collaboration/caret 一起被预打包并经 resolve.dedupe 共享同一份 yjs,
    // 故此处无需(也不能)单独列出。
    include: [
      'yjs',
      'y-prosemirror',
      '@hocuspocus/provider',
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-caret',
    ],
  },
  // 生产构建时把 console.log/console.debug 标记为「无副作用」,
  // 交给压缩阶段 tree-shake 掉,清理生产环境的调试噪音(保留 console.warn/error)。
  esbuild: {
    pure:
      process.env.NODE_ENV === 'production'
        ? ['console.log', 'console.debug']
        : [],
  },
  build: {
    // 把超大块阈值调到与拆分后实际相符,避免无意义告警
    chunkSizeWarningLimit: 700,
    // 生成带哈希的文件名，防止缓存问题
    rollupOptions: {
      output: {
        // 为 JS 文件添加哈希
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // 按库拆分 vendor 到独立可缓存 chunk:应用代码变更时这些第三方块仍命中浏览器缓存,
        // 并可并行下载。Tiptap/Yjs 体积大且仅编辑器(懒加载路由)用到,单独成块随路由按需加载。
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@arco-design')) return 'vendor-arco'
          if (
            id.includes('@tiptap') ||
            id.includes('prosemirror') ||
            id.includes('/yjs/') ||
            id.includes('y-prosemirror') ||
            id.includes('y-protocols') ||
            id.includes('@hocuspocus') ||
            id.includes('lib0')
          ) {
            return 'vendor-editor'
          }
          if (
            id.includes('/vue/') ||
            id.includes('vue-router') ||
            id.includes('/pinia') ||
            id.includes('@vue/')
          ) {
            return 'vendor-vue'
          }
        },
      },
    },
  },
})