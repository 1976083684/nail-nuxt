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

### 环境变量配置

复制 `.env.example` 为 `.env`，填入本地配置：

```bash
cp .env.example .env
```

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=luxe_nail

# JWT 密钥
JWT_SECRET=your_jwt_secret_here
```

### 数据库初始化

**方式一：一键初始化（推荐，自动创建数据库和所有表）**

```bash
mysql -u root -p < server/database/init.sql
```

**方式二：分步执行**

```bash
# 1. 系统表（会自动创建数据库，包含管理员账户、菜单、站点设置等）
mysql -u root -p < server/database/sys-nail.sql

# 2. 业务表（服务、美甲师、预约、画廊等，需先执行第 1 步）
mysql -u root -p < server/database/nail.sql
```

默认管理员账户：`admin` / `admin123`

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

## Linux 服务器部署

### 1. 环境准备

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL 5.7+
sudo apt-get install mysql-server

# 安装 PM2（进程管理）
npm install -g pm2

# 安装 Nginx（反向代理）
sudo apt-get install nginx
```

### 2. 部署应用

```bash
# 克隆代码
git clone <仓库地址> /var/www/luxe-nail
cd /var/www/luxe-nail

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
vi .env  # 填入生产环境配置

# 初始化数据库（首次部署，init.sql 会自动创建 luxe_nail 数据库）
mysql -u root -p < server/database/init.sql

# 生产构建
npm run build
```

### 3. 启动端口配置

应用默认监听 **3000** 端口，可通过以下方式修改：

```bash
# 方式一：在 .env 文件中配置（推荐，持久化）
PORT=8080
# 配置好后正常启动即可，PM2 会自动读取 .env 中的环境变量
pm2 start .output/server/index.mjs --name luxe-nail

# 方式二：PM2 启动时通过环境变量指定（适合多实例部署）
PORT=8080 pm2 start .output/server/index.mjs --name luxe-nail

# 方式三：通过命令行参数指定端口
pm2 start .output/server/index.mjs --name luxe-nail -- --port 8080
```

> **原理**：Nuxt/Nitro 会读取 `PORT` 环境变量来决定监听端口；方式三则是通过 `--port` 参数直接传给应用。

### 4. 使用 PM2 进程管理

```bash
# 启动应用（默认 3000 端口）
pm2 start .output/server/index.mjs --name luxe-nail

# 设置开机自启
pm2 startup
pm2 save
```

### 5. Nginx 反向代理

创建配置文件 `/etc/nginx/sites-available/luxe-nail`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    location / {
        proxy_pass http://127.0.0.1:3000;  # 与应用端口一致
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件大小限制
    client_max_body_size 10m;
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/luxe-nail /etc/nginx/sites-enabled/
sudo nginx -t          # 测试配置
sudo systemctl restart nginx
```

### 6. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 证书自动续期测试
sudo certbot renew --dry-run
```

---

## 后续更新部署

当代码有更新时，按以下步骤在服务器上操作：

```bash
cd /var/www/luxe-nail

# 1. 拉取最新代码
git pull origin master

# 2. 安装新增依赖（如有）
npm install

# 3. 重新构建
npm run build

# 4. 重启应用
pm2 restart luxe-nail
```

> **提示**：如果数据库表结构有变更，需手动执行对应的 SQL 迁移脚本后再重启。

一键更新脚本（可保存为 `deploy.sh`）：

```bash
#!/bin/bash
set -e

echo ">>> 拉取最新代码..."
git pull origin master

echo ">>> 安装依赖..."
npm install

echo ">>> 构建项目..."
npm run build

echo ">>> 重启应用..."
pm2 restart luxe-nail

echo ">>> 部署完成！"
```

---

## 日常运维常用命令

### PM2 进程管理

```bash
pm2 status                  # 查看所有进程状态
pm2 logs luxe-nail          # 查看实时日志
pm2 logs luxe-nail --lines 100  # 查看最近 100 行日志
pm2 restart luxe-nail       # 重启应用
pm2 stop luxe-nail          # 停止应用
pm2 delete luxe-nail        # 删除进程
pm2 monit                   # 实时监控（CPU/内存/日志）
pm2 save                    # 保存当前进程列表
pm2 startup                 # 生成开机自启命令
```

### Nginx 相关

```bash
sudo nginx -t                       # 测试配置文件语法
sudo systemctl restart nginx        # 重启 Nginx
sudo systemctl reload nginx         # 重载配置（不中断连接）
sudo systemctl status nginx         # 查看 Nginx 状态
sudo tail -f /var/log/nginx/error.log   # 查看错误日志
sudo tail -f /var/log/nginx/access.log  # 查看访问日志
```

### MySQL 数据库

```bash
# 登录数据库
mysql -u root -p

# 备份数据库
mysqldump -u root -p luxe_nail > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
mysql -u root -p luxe_nail < backup_file.sql

# 查看数据库大小
mysql -u root -p -e "
  SELECT table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
  FROM information_schema.tables
  WHERE table_schema = 'luxe_nail'
  GROUP BY table_schema;"
```

### 系统监控

```bash
# 查看端口占用
sudo lsof -i :3000
# 或
sudo netstat -tlnp | grep 3000

# 查看磁盘空间
df -h

# 查看目录大小
du -sh /var/www/luxe-nail

# 查看系统资源
top
htop  # 需安装: sudo apt install htop
```

### 日志排查

```bash
# PM2 日志文件位置
~/.pm2/logs/luxe-nail-out.log    # 标准输出
~/.pm2/logs/luxe-nail-error.log  # 错误输出

# 实时跟踪日志
tail -f ~/.pm2/logs/luxe-nail-error.log

# Nginx 日志
/var/log/nginx/access.log
/var/log/nginx/error.log
```

---

## 生产部署注意事项

- 使用强随机字符串作为 `JWT_SECRET`
- 数据库密码使用强密码，不要使用 root 账户
- 短信验证码存储改为 Redis（当前使用内存存储）
- 配置文件上传大小限制
- 定期备份数据库（建议设置定时任务 `crontab -e`）
- 上传文件目录 `public/uploads/` 需确保写入权限

---

## 开源协议

MIT License
