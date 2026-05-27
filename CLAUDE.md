# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LUXE NAIL — 美甲店全栈网站，包含前台展示页和后台管理系统。Nuxt 4 + Vue 3 + Tailwind CSS + MySQL。

## 常用命令

```bash
npm run dev        # 启动开发服务器 (localhost:3000)
npm run build      # 生产构建
npm run preview    # 预览生产构建
npm run generate   # 静态站点生成
npm run postinstall  # nuxt prepare，生成 .nuxt 类型声明
```

没有配置测试框架和 linter。

## 数据库

MySQL 数据库 `luxe_nail`，连接配置在 `nuxt.config.ts` 的 `runtimeConfig` 中（默认 root/123456/localhost:3306）。

初始化需要按顺序执行两个 SQL 文件：
1. `server/database/sys-nail.sql` — 系统表（sys_users, sys_admins, sys_menus, sys_admin_menus, sys_site_settings）+ 默认管理员 admin/admin123
2. `server/database/nail.sql` — 业务表（nail_services, nail_artists, nail_gallery_items, nail_appointments 等）+ 初始数据

表名规范：系统相关表使用 `sys_` 前缀，美甲业务相关表使用 `nail_` 前缀。

数据库工具函数在 `server/utils/db.ts`，提供 `query()` 和 `queryOne()` 两个封装。

## 架构

### 前台（`app/`）

- **单页应用**：`app/pages/index.vue` 是唯一的前台页面，所有内容通过组件组合实现
- **组件**：`app/components/` 下按功能拆分（HeroSection, ServicesSection, ArtistsSection, GallerySection, BookingModal 等）
- **Composables**：
  - `useAuth` — 用户认证（localStorage 存储，支持模拟登录和短信登录）
  - `useModal` — 全局弹窗状态管理（登录、预约、服务详情、美甲师详情等）
  - `useTheme` — 主题切换（mint/candy/ink/dusk 四套主题，通过 CSS 变量 + `data-theme` 属性切换）
  - `useToast` — 消息提示
  - `useBooking` — 预约流程
- **样式**：`app/assets/css/main.css` 定义所有主题变量和全局样式，Tailwind CSS 用于布局辅助
- **字体**：Playfair Display（英文装饰）+ Noto Sans SC（中文正文），通过 `@nuxtjs/google-fonts` 加载
- **图标**：Font Awesome 6，通过 CDN 在 `nuxt.config.ts` 的 `app.head` 中引入

### 后台管理（`app/pages/admin/`）

- 使用 `admin.vue` 布局（侧边栏 + 顶栏）
- 路由守卫：`app/middleware/admin-auth.ts` 检查登录状态和权限
- 权限系统：`usePermissions` composable 定义权限树（PERMISSION_TREE），super_admin 拥有全部权限，普通管理员按 JSON 字段控制
- 页面：dashboard、appointments、services、artists、gallery、users、admins、settings（basic/sms）

### 服务端 API（`server/api/`）

- **路由约定**：Nuxt 文件路由，`index.get.ts` / `index.post.ts` / `[id].put.ts` / `[id].delete.ts`
- **管理员 API**：`server/api/admin/` 下所有路由受 `server/middleware/admin-auth.ts` 中间件保护（JWT cookie `admin_token`）
- **公开 API**：`server/api/appointments/`、`server/api/artists/`、`server/api/gallery/`、`server/api/services/` 等
- **认证**：`server/utils/jwt.ts` 提供 JWT 签发和验证；管理员密码用 bcryptjs 加密
- **短信验证码**：`server/utils/sms-store.ts` 内存存储验证码（生产环境应替换为 Redis）
- **文件上传**：`server/api/upload.post.ts`，上传到 `public/uploads/` 目录

## 注意事项

- 项目使用 Nuxt 4（`compatibilityDate: '2025-07-15'`），注意与 Nuxt 3 的 API 差异
- 前台用户认证是 localStorage 模拟的（`useAuth` 中的 `simulateLogin`），非真实后端验证
- JWT 密钥硬编码在 `server/utils/jwt.ts` 中，生产环境需改为环境变量
- 数据库密码硬编码在 `nuxt.config.ts` 的 `runtimeConfig` 中，生产环境需使用环境变量覆盖
