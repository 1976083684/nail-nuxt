# LUXE NAIL

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?style=flat&logo=nuxt&logoColor=white)](https://nuxt.com/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

美甲店全栈网站，包含前台展示页和后台管理系统。

![system-nail](images/README_images/system-nail.png)

## 技术栈

- **前端框架**：Nuxt 4 + Vue 3
- **样式方案**：Tailwind CSS + CSS 变量主题系统
- **数据库**：MySQL
- **认证**：JWT + bcryptjs
- **字体**：Playfair Display + Noto Sans SC
- **图标**：Font Awesome 6

## 功能特性

### 前台展示

- 首页单页应用，展示店铺信息、服务项目、美甲师团队、作品画廊
- 多主题切换（mint / candy / ink / dusk 四套配色方案）
- 在线预约系统，支持选择服务、美甲师、日期和时间段
- 短信验证码登录
- 响应式设计，适配移动端

### 后台管理

- 仪表盘数据统计
- 预约管理（查看、确认、取消、删除）
- 服务项目管理
- 美甲师管理
- 作品画廊管理
- 用户管理
- 管理员权限系统（super_admin / 自定义权限）
- 排班管理
- 系统设置（基础信息、短信配置、菜单管理）

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 5.7

### 安装依赖

```bash
npm install
```

### 数据库初始化

按顺序执行两个 SQL 文件：

```bash
# 1. 系统表（管理员账户、菜单、站点设置等）
mysql -u root -p luxe_nail < server/database/sys-nail.sql

# 2. 业务表（服务、美甲师、预约、画廊等）
mysql -u root -p luxe_nail < server/database/nail.sql
```

默认管理员账户：`admin` / `admin123`

### 配置数据库连接

编辑 `nuxt.config.ts` 中的 `runtimeConfig`：

```ts
runtimeConfig: {
  dbHost: 'localhost',
  dbPort: 3306,
  dbUser: 'root',
  dbPassword: '123456',
  dbName: 'luxe_nail',
}
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看前台页面，http://localhost:3000/admin 进入后台管理。

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm run generate     # 静态站点生成
npm run postinstall  # 生成 Nuxt 类型声明
```

## 项目结构

```
├── app/
│   ├── assets/css/       # 全局样式和主题变量
│   ├── components/       # Vue 组件
│   │   ├── HeroSection      # 首屏横幅
│   │   ├── ServicesSection  # 服务展示
│   │   ├── ArtistsSection   # 美甲师团队
│   │   ├── GallerySection   # 作品画廊
│   │   ├── BookingModal     # 预约弹窗
│   │   └── ...
│   ├── composables/      # 组合式函数
│   │   ├── useAuth          # 用户认证
│   │   ├── useModal         # 弹窗状态管理
│   │   ├── useTheme         # 主题切换
│   │   └── useBooking       # 预约流程
│   ├── layouts/          # 布局组件
│   ├── middleware/       # 路由中间件
│   └── pages/            # 页面路由
│       ├── index.vue        # 前台首页
│       └── admin/           # 后台管理页面
├── server/
│   ├── api/              # API 接口
│   │   ├── admin/           # 管理员接口（需认证）
│   │   ├── appointments/    # 预约接口
│   │   ├── artists/         # 美甲师接口
│   │   ├── gallery/         # 画廊接口
│   │   └── services/        # 服务接口
│   ├── database/         # 数据库初始化脚本
│   ├── middleware/        # 服务端中间件
│   └── utils/            # 工具函数
│       ├── db.ts            # 数据库查询封装
│       ├── jwt.ts           # JWT 工具
│       └── sms-store.ts     # 短信验证码存储
└── public/               # 静态资源
    └── uploads/          # 上传文件目录
```

## 数据库表结构

系统表（`sys_` 前缀）：

- `sys_users` - 前台用户
- `sys_admins` - 后台管理员
- `sys_menus` - 系统菜单
- `sys_admin_menus` - 管理员菜单权限
- `sys_site_settings` - 站点设置

业务表（`nail_` 前缀）：

- `nail_services` - 服务项目
- `nail_artists` - 美甲师
- `nail_gallery_items` - 作品画廊
- `nail_appointments` - 预约记录
- `nail_artist_schedules` - 美甲师排班

## 生产部署注意事项

- 将 JWT 密钥改为环境变量（当前硬编码在 `server/utils/jwt.ts`）
- 将数据库密码改为环境变量（当前在 `nuxt.config.ts` 的 `runtimeConfig` 中）
- 短信验证码存储改为 Redis（当前使用内存存储）
- 配置 HTTPS
- 配置文件上传大小限制

## 开源协议

MIT License
