# 仓库协作指南

## 项目定位
本仓库是 `be-supervisor-model` 的前端控制台，技术栈固定为：

- `Vite`
- `Vue 3`
- `TypeScript`
- `Element Plus`
- `Pinia`
- `Vue Router`
- `Axios`
- 包管理器：`pnpm`

前端面向运维后台场景，重点关注主机选择、Supervisor 服务查询、启停、配置变更、备份恢复与端口冲突检测。

## 目录结构
请保持目录按职责分层，不要把页面、接口、状态和通用组件混在一起：

- `src/app`：应用启动、全局注册、全局异常处理、存储键
- `src/router`：路由定义、路由守卫、登录跳转处理
- `src/stores`：Pinia 状态管理，按域拆分 store
- `src/api`：HTTP 客户端、鉴权接口、Supervisor 业务接口、类型定义
- `src/features`：按业务域组织页面与局部组件，例如 `auth`、`supervisor`
- `src/components`：跨业务复用组件
- `src/composables`：组合式逻辑
- `src/layouts`：应用布局
- `src/styles`：全局样式与设计令牌
- `public`：静态资源
- `tests`：Vitest 测试

新增功能时优先放入对应 `feature` 目录，避免把业务代码散落在根级 `src/`。

## 开发命令
统一使用 `pnpm`，不要引入 `npm` 或 `yarn` 锁文件。

- `pnpm install`：安装依赖
- `pnpm dev`：启动本地开发服务器
- `pnpm build`：执行类型检查并构建生产包
- `pnpm preview`：本地预览构建结果
- `pnpm lint`：执行 ESLint
- `pnpm test`：运行 Vitest
- `pnpm type-check`：执行 `vue-tsc`

提交时保留 `pnpm-lock.yaml`，不要提交 `package-lock.json`。

## 编码规范
- 统一使用 TypeScript。
- 缩进为 2 个空格。
- 文件默认使用 ASCII；只有在业务文案明确需要时才引入中文或其他 Unicode 内容。
- Vue 组件文件使用 `PascalCase.vue`，如 `LoginPage.vue`。
- 组合式函数使用 `useXxx.ts`，如 `usePageTitle.ts`。
- Pinia Store 使用 `useXxxStore.ts`，如 `useAuthStore.ts`。
- API 文件使用 `xxxApi.ts`，类型文件使用 `xxx.types.ts`。
- 非代码目录使用 `kebab-case`。

优先使用 Composition API 与 `script setup`。新页面或组件应尽量保持单一职责，不要把网络请求、状态同步和复杂视图全部塞进一个通用组件。

## 鉴权与安全规则
- 登录接口返回的 Bearer Token 持久化到 `localStorage`。
- `localStorage` 中只允许存：
  - `supervisor_access_token`
  - `supervisor_token_expires_at`
- 业务组件禁止直接读写 `localStorage`。
- Token 的读写只能放在：
  - `src/stores/auth`
  - `src/api/http`
- 业务组件禁止手动拼接 `Authorization` 请求头，统一由 HTTP 拦截器注入。
- 严禁把后端静态 `API_TOKEN`、账号密码、SSH 凭据写入前端源码、`VITE_*` 环境变量或测试快照。
- `VITE_*` 只允许放公开配置，例如 API 基础地址、超时时间、页面标题等。
- 禁止使用 `v-html` 渲染不可信内容；若确实需要，必须先完成服务端与前端双重净化。

## 接口约定
- 认证接口统一走 `/admin/api/auth/*`
- Supervisor 业务接口统一走 `/api/supervisor/*`
- 后端成功响应格式默认是：

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

前端新增接口时，优先在 `src/api/*` 内补齐类型，再接入页面和 store。

## 测试要求
- 测试框架使用 `Vitest`，需要 DOM 时使用 `jsdom`。
- 测试文件命名为 `*.test.ts`。
- 新增鉴权逻辑时，至少覆盖：
  - token 持久化
  - 页面刷新恢复登录态
  - token 过期清理
  - 登录跳转与非法 redirect 拦截
- 新增 Supervisor 操作时，至少覆盖对应的数据转换或关键交互逻辑。

只做快照测试是不够的。对于登录流、路由守卫、存储同步这类行为，优先写行为测试。

## UI 与交互要求
- 界面风格保持安静、工具化、信息密度高，符合运维后台使用场景。
- 优先使用 Element Plus 原生组件与图标，不要随意混入第二套组件体系。
- 操作按钮尽量使用图标或图标加文字，并保证有清晰的 hover / disabled / loading 状态。
- 页面首屏直接提供可用功能，不做营销式落地页。
- 信息区块优先使用平铺布局或表格，不要堆叠过多装饰性卡片。

## 提交与评审
- Commit message 使用 Conventional Commits，例如：`feat: add auth store`、`fix: handle 401 redirect`。
- PR 说明至少包含：
  - 改动摘要
  - 测试结果
  - 涉及的接口或环境变量变更
  - 如有可视化改动，附截图

不要提交密钥、密码、真实 token 或生产环境地址。
