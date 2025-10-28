# 📝 在线文档协作平台

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5.17-brightgreen.svg" alt="Vue">
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.4.8-purple.svg" alt="Vite">
  <img src="https://img.shields.io/badge/TipTap-3.0.7-orange.svg" alt="TipTap">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</p>

## 🚀 项目简介

这是一个基于 Vue 3 + TypeScript + Vite 构建的现代化在线文档协作平台。提供了类似 Notion/飞书文档的编辑体验，支持富文本编辑、文档管理、多标签页操作等功能。

### ✨ 核心特性

- 🎨 **富文本编辑器** - 基于 TipTap 实现的强大富文本编辑器
  - 支持标题、段落、列表、代码块等多种格式
  - 高亮、下划线、上标、下标等文本样式
  - 实时自动保存，防止数据丢失
  
- 📁 **文档管理系统** - 树形结构的文档组织方式
  - 文件夹与文档的层级管理
  - 拖拽排序和移动
  - 搜索与快速定位
  
- 🔐 **用户系统** - 完整的用户认证与授权
  - 用户注册、登录、信息管理
  - 密码修改、头像上传
  - Token 持久化存储
  
- 🎯 **多标签页** - 类似浏览器的标签页管理
  - 多文档同时打开
  - 标签页关闭确认
  - 未保存提示
  
- 💾 **状态管理** - 基于 Pinia 的响应式状态管理
  - 用户状态持久化
  - 标签页状态管理
  - 自动状态恢复

## 🛠️ 技术栈

### 核心框架
- **Vue 3.5.17** - 渐进式 JavaScript 框架
- **TypeScript 5.8.3** - JavaScript 的超集，提供类型安全
- **Vite 5.4.8** - 下一代前端构建工具

### UI 框架与样式
- **Arco Design Vue 2.57.0** - 字节跳动企业级 UI 组件库
- **Tailwind CSS 4.1.11** - 实用优先的 CSS 框架

### 富文本编辑器
- **TipTap 3.0.7** - 无头富文本编辑器框架
  - @tiptap/starter-kit - 基础扩展包
  - @tiptap/extension-highlight - 高亮扩展
  - @tiptap/extension-underline - 下划线扩展
  - @tiptap/extension-subscript - 下标扩展
  - @tiptap/extension-superscript - 上标扩展

### 状态管理与路由
- **Vue Router 4** - Vue.js 官方路由
- **Pinia 3.0.3** - Vue 的状态管理库
- **pinia-plugin-persistedstate 4.4.1** - Pinia 持久化插件

### 工具库
- **Axios 1.11.0** - HTTP 客户端
- **@vueuse/core 13.5.0** - Vue 组合式 API 工具集
- **Sass 1.91.0** - CSS 预处理器

### 协作功能（预留）
- **Yjs 13.6.27** - CRDT 协作框架
- **y-websocket 3.0.0** - WebSocket 协作提供者

## 📦 项目结构

```
docs-platform/
├── public/                  # 静态资源
├── src/
│   ├── api/                # API 接口定义
│   │   ├── docs.ts        # 文档相关接口
│   │   ├── user.ts        # 用户相关接口
│   │   └── type.ts        # 类型定义
│   ├── assets/            # 资源文件
│   │   └── editorIcon/    # 编辑器图标
│   ├── components/        # 组件
│   │   ├── EditorArea.vue # 编辑器主体
│   │   ├── EmptyState.vue # 空状态组件
│   │   ├── MainLayout.vue # 主布局
│   │   ├── Sidebar.vue    # 侧边栏
│   │   ├── editor/        # 编辑器相关组件
│   │   │   ├── TabBar.vue # 标签页栏
│   │   │   └── ToolList.vue # 工具栏
│   │   └── sider/         # 侧边栏组件
│   │       ├── add.vue    # 添加按钮
│   │       ├── docsArea.vue # 文档区域
│   │       ├── Footer.vue # 底部
│   │       ├── historyDiolog.vue # 历史对话框
│   │       ├── user.vue   # 用户信息
│   │       └── diolog/    # 对话框组件
│   ├── router/            # 路由配置
│   │   ├── index.ts       # 路由定义
│   │   └── types.ts       # 路由类型
│   ├── store/             # 状态管理
│   │   ├── tabs.ts        # 标签页状态
│   │   └── user.ts        # 用户状态
│   ├── styles/            # 样式文件
│   │   ├── arco.scss      # Arco 样式定制
│   │   └── zhizhu.js      # 蜘蛛背景动画
│   ├── utils/             # 工具函数
│   │   └── request.ts     # HTTP 请求封装
│   ├── views/             # 页面视图
│   │   ├── 404.vue        # 404 页面
│   │   ├── login.vue      # 登录页面
│   │   ├── Settings.vue   # 设置页面
│   │   └── login/         # 登录相关组件
│   ├── App.vue            # 根组件
│   ├── main.ts            # 入口文件
│   └── style.css          # 全局样式
├── index.html             # HTML 模板
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目说明

```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- pnpm >= 8.0.0（推荐）或 npm >= 8.0.0

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 或
npm run dev
```

访问 `http://localhost:5173` 查看项目

### 生产构建

```bash
# 构建生产版本
pnpm build

# 或
npm run build
```

### 预览生产构建

```bash
# 预览构建结果
pnpm preview

# 或
npm run preview
```

## 🔧 配置说明

### 环境变量

创建 `.env` 文件配置环境变量：

```env
# API 基础路径
VITE_API_BASE_URL=http://your-api-domain.com/api

# 其他配置...
```

### Vite 配置

主要配置在 `vite.config.ts` 中：

```typescript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://your-backend-url',
        changeOrigin: true
      }
    }
  }
})
```

## 📖 核心功能详解

### 1. 富文本编辑器

基于 TipTap 实现的富文本编辑器，支持：

- **文本格式化**：粗体、斜体、删除线、下划线
- **标题**：H1-H6 六级标题
- **列表**：有序列表、无序列表
- **代码**：行内代码、代码块
- **特殊格式**：高亮、上标、下标
- **自动保存**：2 秒延迟自动保存
- **快捷键**：支持常用快捷键操作

### 2. 文档管理

树形结构的文档组织：

- **创建文档/文件夹**：支持多层级嵌套
- **重命名**：文档和文件夹重命名
- **删除**：支持删除确认
- **移动**：拖拽移动文档位置
- **搜索**：快速查找文档

### 3. 用户系统

完整的用户认证流程：

- **注册登录**：用户注册和登录功能
- **信息管理**：修改用户名、邮箱、头像
- **密码管理**：修改密码功能
- **权限控制**：路由权限守卫

### 4. 标签页管理

多文档同时编辑：

- **多标签页**：同时打开多个文档
- **标签切换**：快速在文档间切换
- **关闭确认**：未保存时提示
- **状态保持**：刷新后恢复标签页

## 🔌 API 接口

### 文档相关

```typescript
// 获取文档树
GET /api/documents/tree

// 获取文档详情
GET /api/documents/:id

// 创建文档
POST /api/documents

// 创建文件夹
POST /api/documents/folders

// 更新文档
PUT /api/documents/:id

// 删除文档
DELETE /api/documents/:id

// 保存文档内容
PUT /api/documents/:id/content
```

### 用户相关

```typescript
// 用户登录
POST /api/user/login

// 用户注册
POST /api/user/register

// 获取用户信息
GET /api/user/info

// 更新用户信息
PUT /api/user/info

// 修改密码
PUT /api/user/password
```

## 🎨 样式定制

### Arco Design 主题

在 `src/styles/arco.scss` 中定制 Arco Design 主题：

```scss
// 自定义主题变量
$primary-color: #165dff;
$success-color: #00b42a;
$warning-color: #ff7d00;
$danger-color: #f53f3f;
```

### Tailwind CSS

使用 Tailwind CSS 实用类快速构建界面：

```vue
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <!-- 内容 -->
</div>
```

## 🔍 调试技巧

### Vue Devtools

安装 Vue Devtools 浏览器扩展，方便调试 Vue 应用：

- 查看组件树
- 检查组件状态
- 追踪事件
- 监控性能

### 开发工具

```bash
# 查看依赖树
pnpm list

# 检查过期依赖
pnpm outdated

# 更新依赖
pnpm update
```

## 📝 代码规范

### TypeScript

- 使用严格模式
- 为函数参数和返回值添加类型
- 避免使用 `any` 类型

### Vue

- 使用 `<script setup>` 语法
- 组件名使用 PascalCase
- Props 使用 TypeScript 接口定义

### 样式

- 优先使用 Tailwind CSS 实用类
- 组件样式使用 scoped
- 避免深层选择器嵌套

## 🚧 未来规划

- [ ] 实时协作编辑功能（基于 Yjs）
- [ ] 文档版本历史
- [ ] 文档分享与权限管理
- [ ] Markdown 导入导出
- [ ] 文档模板系统
- [ ] 评论与讨论功能
- [ ] 移动端适配
- [ ] 暗黑模式支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👥 作者

- **开发者** - [evening0twilight](https://github.com/evening0twilight)

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [TipTap](https://tiptap.dev/) - 无头编辑器框架
- [Arco Design](https://arco.design/) - 企业级 UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

---

<p align="center">Made with ❤️ by the docs-platform team</p>
