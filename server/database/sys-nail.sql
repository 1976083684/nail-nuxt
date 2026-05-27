CREATE DATABASE IF NOT EXISTS luxe_nail DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE luxe_nail;

-- ============ 系统相关表 ============

-- 用户表（区分前台用户和后台管理账号）
CREATE TABLE IF NOT EXISTS sys_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_type ENUM('user', 'admin') DEFAULT 'user' COMMENT '账号类型: user=前台用户, admin=后台管理账号',
  name VARCHAR(50) NOT NULL DEFAULT '微信用户' COMMENT '用户昵称',
  avatar_url VARCHAR(500) DEFAULT '' COMMENT '头像URL',
  phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表（前台用户和后台管理账号）';

-- 管理员表（后台管理账号，与 sys_users 表通过 user_id 关联）
CREATE TABLE IF NOT EXISTS sys_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL COMMENT '关联 sys_users 表 id（account_type=admin）',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  name VARCHAR(50) NOT NULL COMMENT '管理员姓名',
  role ENUM('super_admin','admin') DEFAULT 'admin' COMMENT '角色: super_admin=超级管理员, admin=普通管理员',
  permissions TEXT DEFAULT NULL COMMENT '权限配置JSON',
  last_login TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表（后台管理账号）';

-- 菜单表（支持二级菜单）
CREATE TABLE IF NOT EXISTS sys_menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT DEFAULT NULL COMMENT '父菜单ID，NULL为顶级菜单',
  name VARCHAR(50) NOT NULL COMMENT '菜单名称',
  perm_key VARCHAR(50) NOT NULL UNIQUE COMMENT '权限标识',
  icon VARCHAR(100) DEFAULT '' COMMENT '图标class',
  route VARCHAR(200) DEFAULT '' COMMENT '路由路径',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_visible TINYINT(1) DEFAULT 1 COMMENT '是否显示',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_parent (parent_id),
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单表（支持二级菜单）';

-- 管理员-菜单关联表
CREATE TABLE IF NOT EXISTS sys_admin_menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL COMMENT '管理员ID',
  menu_id INT NOT NULL COMMENT '菜单ID',
  UNIQUE KEY uk_admin_menu (admin_id, menu_id),
  INDEX idx_admin (admin_id),
  INDEX idx_menu (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员-菜单权限关联表';

-- 站点配置表
CREATE TABLE IF NOT EXISTS sys_site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) NOT NULL UNIQUE COMMENT '配置键',
  setting_value TEXT NOT NULL COMMENT '配置值',
  description VARCHAR(100) DEFAULT '' COMMENT '配置说明'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点配置表（全局设置）';

-- 短信配置表（支持多供应商）
CREATE TABLE IF NOT EXISTS sys_sms_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(20) NOT NULL DEFAULT 'aliyun' COMMENT '供应商: aliyun/tencent/qiniu',
  provider_name VARCHAR(50) NOT NULL DEFAULT '阿里云' COMMENT '供应商名称',
  access_key VARCHAR(100) DEFAULT '' COMMENT 'AccessKey ID',
  access_secret VARCHAR(100) DEFAULT '' COMMENT 'AccessKey Secret',
  sign_name VARCHAR(50) DEFAULT '' COMMENT '短信签名',
  template_code VARCHAR(20) DEFAULT '' COMMENT '短信模板CODE',
  is_enabled TINYINT(1) DEFAULT 0 COMMENT '是否启用',
  is_default TINYINT(1) DEFAULT 0 COMMENT '是否默认供应商',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短信配置表（支持多供应商）';

-- 站点内容表（首页静态字段）
CREATE TABLE IF NOT EXISTS sys_site_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_key VARCHAR(80) NOT NULL UNIQUE COMMENT '内容标识',
  content_value TEXT NOT NULL COMMENT '内容值',
  content_group VARCHAR(30) NOT NULL DEFAULT 'general' COMMENT '分组: hero/services/artists/gallery/cta/footer',
  description VARCHAR(100) DEFAULT '' COMMENT '字段说明',
  sort_order INT DEFAULT 0 COMMENT '排序',
  INDEX idx_group (content_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点内容表（首页静态字段）';

-- ============ 初始数据 ============

-- 默认管理员: admin / admin123
INSERT IGNORE INTO sys_admins (username, password_hash, name, role) VALUES
('admin', '$2b$10$ZZZAWw67FdBdfgtrb7q1V.f7P27/zkBfD6nwTHBdy6082LzSwREp2', '系统管理员', 'super_admin');

-- 默认菜单
INSERT IGNORE INTO sys_menus (id, parent_id, name, perm_key, icon, route, sort_order) VALUES
(1, NULL, '数据看板',  'dashboard',     'fas fa-chart-pie',      '/admin',                 1),
(2, NULL, '预约管理',  'appointments',  'fas fa-calendar-check', '/admin/appointments',    2),
(3, NULL, '服务管理',  'services',      'fas fa-spa',            '/admin/services',        3),
(4, NULL, '美甲师管理','artists',       'fas fa-user-tie',       '/admin/artists',         4),
(5, NULL, '画廊管理',  'gallery',       'fas fa-images',         '/admin/gallery',         5),
(6, NULL, '用户管理',  'users',         'fas fa-users',          '/admin/users',           6),
(7, NULL, '系统设置',  'settings',      'fas fa-cog',            '/admin/settings',        7),
(8, 7,   '基础配置',  'settings.basic', 'fas fa-sliders-h',     '/admin/settings/basic',  1),
(9, 7,   '短信配置',  'settings.sms',   'fas fa-sms',           '/admin/settings/sms',    2),
(10, 7,  '菜单管理',  'settings.menus', 'fas fa-bars',           '/admin/settings/menus',  3),
(11, 7,  '管理员账号','settings.admins','fas fa-user-shield',    '/admin/settings/admins', 4),
(12, 7,  '内容管理',  'settings.content','fas fa-file-alt',     '/admin/settings/content', 5),
(13, NULL, '排班管理', 'schedules',     'fas fa-calendar-alt', '/admin/schedules',      8),
(14, 13,   '排班总览', 'schedules.overview','fas fa-calendar-day', '/admin/schedules',      1),
(15, 13,   '新增排班', 'schedules.create', 'fas fa-plus-circle',  '/admin/schedules/create', 2),
(16, 13,   '排班记录', 'schedules.records','fas fa-list-alt',     '/admin/schedules/records', 3);

-- 默认配置
INSERT IGNORE INTO sys_site_settings (setting_key, setting_value, description) VALUES
('shop_name', 'LUXE NAIL', '店铺名称'),
('shop_phone', '021-6288-8888', '联系电话'),
('shop_address', '上海市静安区南京西路1688号', '店铺地址'),
('business_hours_start', '10:00', '营业开始时间'),
('business_hours_end', '19:00', '营业结束时间'),
('slot_duration', '30', '时间段间隔（分钟）'),
('booking_fee', '5', '预约费用（元）'),
('cancel_hours', '6', '预约时间N小时内不可取消');

-- 默认短信配置（阿里云）
INSERT IGNORE INTO sys_sms_config (provider, provider_name, sign_name, template_code, is_default) VALUES
('aliyun', '阿里云', '速通互联验证码', '100001', 1);
-- 腾讯云（暂未接入）
INSERT IGNORE INTO sys_sms_config (provider, provider_name, sign_name, template_code, is_default) VALUES
('tencent', '腾讯云', '', '', 0);

-- 首页静态内容
INSERT IGNORE INTO sys_site_content (content_key, content_value, content_group, description, sort_order) VALUES
-- Hero 区域
('hero_subtitle', 'Premium Nail Art Studio', 'hero', '英文副标题', 1),
('hero_title_line1', '指尖上的', 'hero', '主标题第一行', 2),
('hero_title_line2', '艺术奢享', 'hero', '主标题第二行（高亮）', 3),
('hero_desc', '每一次雕琢都是对美的致敬在LUXE NAIL，让指尖绽放独一无二的光芒', 'hero', '描述文字', 4),
('hero_stat1_value', '6+', 'hero', '统计数据1-数值', 5),
('hero_stat1_label', '年专业经验', 'hero', '统计数据1-标签', 6),
('hero_stat2_value', '5000+', 'hero', '统计数据2-数值', 7),
('hero_stat2_label', '满意客户', 'hero', '统计数据2-标签', 8),
('hero_stat3_value', '4.9', 'hero', '统计数据3-数值', 9),
('hero_stat3_label', '平均评分', 'hero', '统计数据3-标签', 10),
-- 服务区域
('services_subtitle', 'Our Services', 'services', '英文副标题', 1),
('services_title', '精选服务项目', 'services', '主标题', 2),
('services_desc', '从经典护理到前沿艺术，找到属于你的指尖风格', 'services', '描述文字', 3),
-- 美甲师区域
('artists_subtitle', 'Our Artists', 'artists', '英文副标题', 1),
('artists_title', '美甲师团队', 'artists', '主标题', 2),
('artists_desc', '每位美甲师都经过严格筛选与专业培训', 'artists', '描述文字', 3),
-- 画廊区域
('gallery_subtitle', 'Nail Gallery', 'gallery', '英文副标题', 1),
('gallery_title', '作品画廊', 'gallery', '主标题', 2),
('gallery_desc', '每一件作品都是指尖上的艺术品', 'gallery', '描述文字', 3),
-- CTA 区域
('cta_title', '准备好变美了吗', 'cta', '主标题', 1),
('cta_desc', '只需几分钟，即可预约专属你的美甲时光', 'cta', '描述文字', 2),
-- 页脚区域
('footer_address', '上海市静安区南京西路1688号', 'footer', '店铺地址', 1),
('footer_phone', '021-6288-8888', 'footer', '联系电话', 2);