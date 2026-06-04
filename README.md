# fe-supervisor-model

`fe-supervisor-model` 是 `be-supervisor-model` 的前端控制台，面向运维后台场景，提供 Supervisor 服务查询、启停、配置变更和备份恢复等能力。当前技术栈固定为 `Vite`、`Vue 3`、`TypeScript`、`Element Plus`、`Pinia`、`Vue Router`、`Axios`，包管理器使用 `pnpm`。

## 当前功能

- 登录鉴权与登录态恢复
- 主机列表加载与启用主机筛选
- 服务列表查询、关键字筛选和状态筛选
- 服务详情查看
- 服务启动、停止、重启
- 服务新增、编辑、删除
- 服务备份与恢复
- 主机级 `reread` 与 `update`

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

根目录默认提供两套启动环境文件：

```bash
cp .env.example .env.local
```

- `.env.dev`：供 `pnpm run dev` 使用
- `.env.prod`：供 `pnpm run prod` 使用
- `.env.local`：按需补充本地私有覆盖项，不提交仓库

当前公开配置项如下：

| 变量名 | 说明 | 默认示例 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 后端 API 基础地址 | `http://127.0.0.1:18880` |
| `VITE_API_TIMEOUT_MS` | HTTP 请求超时时间，单位毫秒 | `10000` |
| `VITE_ADMIN_API_PREFIX` | API 公共前缀 | `/admin/api` |

### 3. 启动开发服务器

```bash
pnpm run dev
pnpm run prod
```

- `pnpm run dev`：以 `dev` mode 启动 Vite 开发服务器，读取 `.env.dev`，提供主机地址和 API 前缀
- `pnpm run prod`：以 `prod` mode 启动 Vite 开发服务器，读取 `.env.prod`，提供主机地址和 API 前缀

### 4. 常用命令

```bash
pnpm build
pnpm preview
pnpm lint
pnpm test
pnpm type-check
```

- `pnpm build`：执行类型检查并构建生产包
- `pnpm preview`：预览已构建产物，不参与环境切换启动

## 目录结构

仓库按职责分层，新增功能优先放入对应业务域目录，避免将页面、接口、状态和通用组件混放在 `src/` 根级。

```text
src/
  app/          应用启动、全局注册、存储键
  api/          HTTP 客户端、鉴权接口、Supervisor 接口与类型
  components/   跨业务复用组件
  composables/  组合式逻辑
  features/     按业务域组织页面与局部组件
  layouts/      应用布局
  router/       路由定义与登录跳转处理
  stores/       Pinia 状态管理
  styles/       全局样式与设计令牌
tests/          Vitest 行为测试
```

当前业务页面主要集中在：

- `src/features/auth/pages/LoginPage.vue`
- `src/features/supervisor/pages/SupervisorDashboardPage.vue`
- `src/features/supervisor/components/*`

## 鉴权与安全约束

- Bearer Token 仅允许持久化到 `localStorage` 的 `supervisor_access_token` 与 `supervisor_token_expires_at`
- Token 的读写只能放在 `src/stores/auth` 与 `src/api/http`
- 业务组件禁止直接读写 `localStorage`
- 业务组件禁止手动拼接 `Authorization` 请求头，请统一走 `src/api/http/httpClient.ts` 的请求拦截器
- 严禁把后端静态 `API_TOKEN`、账号密码、SSH 凭据写入前端源码、`VITE_*` 环境变量或测试快照
- `VITE_*` 仅用于公开配置，例如 API 地址、超时时间等

当前登录态处理约定：

- 应用初始化时会从本地存储恢复 token，并调用 `/admin/api/auth/profile` 拉取当前用户
- token 过期或接口返回 `401` 后，会触发未授权处理并清理本地会话
- 登录页 redirect 仅接受站内安全路径，非法重定向会回落到 `/supervisor`

## 接口约定

- 认证接口统一走 `/admin/api/auth/*`
- Supervisor 业务接口统一走 `/admin/api/supervisor/*`
- 后端成功响应默认格式如下：

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

当前前端已经接入的 Supervisor 能力包括：

- 主机列表 `/admin/api/supervisor/hosts`
- 服务列表 `/admin/api/supervisor/services`
- 服务详情 `/admin/api/supervisor/services/:programName`
- 服务启停、重启、备份、恢复
- 端口检查 `/admin/api/supervisor/ports/check`
- 主机级 `reread` 与 `update`

## 测试

测试框架使用 `Vitest`，当前已覆盖的关键行为包括：

- token 持久化
- 页面刷新后的登录态恢复
- token 过期清理
- 登录 redirect 构建与非法 redirect 拦截

运行测试：

```bash
pnpm test
```

## 开发约定

- 统一使用 TypeScript
- 缩进为 2 个空格
- Vue 组件优先使用 Composition API 与 `script setup`
- 页面首屏直接提供可用功能，保持信息密度高、工具化的运维后台风格
- 优先使用 Element Plus 原生组件与图标，不混入第二套组件体系
