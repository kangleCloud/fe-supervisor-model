# CLAUDE.md

该文件为 Claude Code（claude.ai/code）在此代码仓库中工作时提供指导。

## 命令

```bash
pnpm install                    # 安装依赖
pnpm run dev                    # 开发服务器（读取 .env.dev，端口 5173）
pnpm run prod                   # 使用生产环境配置启动开发服务器（读取 .env.prod）
pnpm build                      # 类型检查 + 生产构建
pnpm preview                    # 预览构建后的输出
pnpm lint                       # 对 .ts 和 .vue 文件执行 ESLint
pnpm test                       # 运行 Vitest 测试套件
pnpm type-check                 # 执行 vue-tsc --noEmit
```

```bash
pnpm test -- --run <glob>          # 运行单个测试文件，例如 pnpm test -- --run tests/supervisorApi
```

所有命令都使用 `pnpm`。

`@` 别名映射到 `src/`，该配置同时存在于 `vite.config.ts` 和 `tsconfig.json` 中。

## 架构

### 启动流程

`src/main.ts` 创建 Vue 应用，然后通过 `bootstrapApp()`（`src/app/bootstrap.ts`）完成整体装配：

1. 创建 Pinia 和 router（router 工厂接收 pinia，因此路由守卫可以使用 store）
2. 注册全局 401 处理器 —— 当任意 API 调用返回 401 时，清空会话并重定向到 `/login`
3. 监听两个认证 key 的跨标签页 `storage` 事件 —— 如果另一个标签页修改了 token，当前标签页会同步认证状态，并在需要时重定向
4. 挂载 Element Plus、全局错误处理器，然后等待 `router.isReady()` 后再执行 `app.mount('#app')`

### 认证流程

- `useAuthStore.initialize()` 会在首次导航时由 `router.beforeEach` 调用。它会从 localStorage 恢复 token，调用 `/admin/api/auth/profile` 进行校验，并设置 `initialized = true`。路由守卫会阻塞，直到初始化完成。
- store 使用去重模式：并发调用 `initialize()` 时会共享同一个 `initializePromise`，因此用户信息接口只会调用一次。
- `syncFromStorage()` 用于处理跨标签页认证变化 —— 它会重新读取 localStorage，并且只在 token 发生变化或用户信息缺失时重新拉取用户信息。
- 登录和退出登录会设置 `skipUnauthorizedHandler: true`，以避免 401 无限循环。

### API 层

`src/api/http/httpClient.ts` 是唯一的 HTTP 入口：

- **请求拦截器**：除非设置 `skipAuth: true`，否则自动附加 `Authorization: Bearer <token>`
- **响应拦截器**：解包 `{ code, msg, data }` —— 如果 `code !== 200`，则抛出 `ApiError`。遇到 401 时，除非设置 `skipUnauthorizedHandler: true`，否则触发已注册的未授权处理器
- 导出的 `request<T>(config)` 函数会直接返回 `data`（类型安全，并且已经解包）
- 所有 API 模块（`authApi.ts`、`supervisorApi.ts`）都应使用带类型配置的 `request()` 调用 —— 新代码中不要直接使用 `httpClient`

### 路由

两个顶级路由：

- `/login` —— `guestOnly`，如果已经登录，则重定向到 `/supervisor`
- `/` —— 使用 `AppShell` 布局包裹子路由，要求认证；如果未登录，则重定向到 `/login?redirect=...`
- 兜底路由重定向到 `/supervisor`

`authRedirect.ts` 会校验 redirect 参数：

只允许同源的绝对路径，也就是以 `/` 开头但不能以 `//` 开头的路径；其他情况都会回退到 `/supervisor`。

### 目录规范

```text
src/
  app/           应用启动、存储 key、全局配置
  api/           HTTP 客户端、类型化 API 函数、请求/响应类型
  router/        路由定义、认证守卫、重定向逻辑
  stores/        Pinia stores（目前只有 auth store）
  features/      业务领域页面和组件（auth、supervisor）
  components/    共享/通用组件
  composables/   可复用组合式函数（例如 usePageTitle）
  layouts/       布局壳组件
  styles/        全局 CSS 和设计 token
```

新的业务功能应放在：

```text
src/features/<domain>/
```

并在其中创建：

```text
pages/
components/
```

该业务域对应的 API 类型和函数应放在：

```text
src/api/<domain>/
```

### 命名规范

| 类型         | 命名模式         |
| ------------ | ---------------- |
| Vue 组件     | `PascalCase.vue` |
| Composables  | `useXxx.ts`      |
| Pinia stores | `useXxxStore.ts` |
| API 模块     | `xxxApi.ts`      |
| 类型定义     | `xxx.types.ts`   |
| 工具模块     | `xxx.ts`         |

### 状态管理

当前只有一个 Pinia store：`useAuthStore`。

它负责 token 的完整生命周期，包括：

- 持久化
- 恢复
- 清除
- 跨标签页同步
- 用户资料维护

业务组件不应该直接操作 `localStorage`，而应通过 store 或 `tokenStorage.ts` 进行访问。

### Supervisor 功能架构

`SupervisorDashboardPage.vue` 是唯一的主页面（路由 `/supervisor`），所有状态使用 Composition API 在组件内管理，不使用 Pinia store。

页面为固定四区布局：**概览 KPI 卡 → 筛选栏 → 操作工具栏 → 服务列表 + 分页**。

**组件树：**

```
SupervisorDashboardPage
  ├── StatusTag / ManageModeTag           （表格内标签）
  ├── ServiceDetailDrawer                   （右侧抽屉，v-model 控制）
  ├── ServiceFormDialog                     （创建/编辑弹窗）
  ├── ImportDialog                          （两阶段导入弹窗）
  └── OperationResultPanel                  （动作结果面板）
```

**动作矩阵（在页面脚本中硬编码）：**

| 记录状态 | 直出按钮 | 更多菜单 |
|---------|---------|---------|
| 未归档 + RUNNING | 停止、重启 | 详情、同步、编辑、归档、删除 |
| 未归档 + STOPPED/EXITED/FATAL/BACKOFF/UNKNOWN | 启动 | 详情、同步、编辑、归档、删除 |
| 已归档 | 详情、还原 | 无 |

- `delete/archive/restore` 操作前会弹出 `ElMessageBox.confirm` 二次确认
- 所有动作完成后刷新列表；若详情抽屉打开且目标为同一条记录，同时刷新详情（delete 则关闭详情）

**表单模式：**

- `create`：host 只读展示，提交 `ServiceCreatePayload`（含 `host` 字段）
- `edit`：host 不进入请求体，走 query 参数，提交 `ServiceUpdatePayload`

`features/supervisor/utils/serviceDraft.ts` 提供工厂函数 `createEmptyServiceDraft(host)` 和 `createEditDraft(source)`，避免在页面中拼接默认值。

### 测试模式

测试使用 **Vitest** + **jsdom** + **@vue/test-utils**。

**API 测试**（`tests/*.test.ts`）：

- 使用 `vi.hoisted()` 声明 mock 函数，再通过 `vi.mock('@/api/http/httpClient', ...)` 注入
- 调用真实 API 函数，断言 `mockRequest` 被调用时的 `url`、`method`、`params`、`data`

**组件测试**（`tests/*.test.ts`）：

- 使用 `defineComponent` 为 Element Plus 组件编写自定义 stub（`ElTableStub` 等），放在测试文件内
- `mount()` 后必须 `await flushPromises()` 等待异步副作用完成
- 页面级测试 mock 整个 `@/api/supervisor/supervisorApi` 和 `element-plus` 的 `ElMessage`/`ElMessageBox`
- 表单/抽屉组件测试直接传入 props，stub 掉 Element Plus 包装组件

### CSS 设计系统

全局样式在 `src/styles/index.css`，通过 CSS 自定义属性（`:root`）定义设计 token：

| Token | 值 | 用途 |
|-------|-----|------|
| `--shell-bg` | `#162028` | 侧栏深色背景 |
| `--accent` / `--success` | `#1f7a57` | 品牌绿 / 运行态 |
| `--info-blue` | `#2563eb` | 信息蓝 |
| `--warning` / `--risk-amber` | `#c27a1a` | 琥珀 / 风险态 |
| `--danger` | `#b42318` | 错误红 / 危险态 |
| `--surface` | `#ffffff` | 卡片白 |
| `--surface-muted` | `#f7f8fa` | 次级灰底 |
| `--surface-strong` | `#e5e7eb` | 边框灰 |

字体：正文 `Fira Sans`，技术字段/命令结果/配置内容 `Fira Code`。

页面布局使用 `.page` / `.page__section` / `.page__section-header` 工具类。

组件内样式使用 `scoped`，颜色值应引用 CSS 变量（如 `var(--text-tertiary)`），避免硬编码 hex 值。

### 环境变量

`VITE_*` 变量只在构建时生效。通过 `.env.dev` / `.env.prod` 切换：

- `VITE_API_BASE_URL` —— 后端基础 URL，dev 默认 `http://127.0.0.1:18881`，prod 默认 `http://127.0.0.1:18880`
- `VITE_API_TIMEOUT_MS` —— 请求超时时间，默认 `300000`（5 分钟）
- `VITE_ADMIN_API_PREFIX` —— API 公共前缀，默认 `/admin/api`

通过 `vite --mode dev` 或 `vite --mode prod` 选择环境文件。
