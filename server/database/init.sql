-- ============================================
-- LUXE NAIL 数据库初始化脚本
-- 合并所有 SQL 文件，按正确顺序执行
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS luxe_nail DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE luxe_nail;

-- ============================================
-- 第一部分：系统相关表
-- ============================================

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

-- ============================================
-- 第二部分：美甲业务相关表
-- ============================================

-- 服务项目表
CREATE TABLE IF NOT EXISTS nail_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '服务名称',
  price DECIMAL(10,2) NOT NULL COMMENT '价格',
  duration INT NOT NULL COMMENT '时长(分钟)',
  description VARCHAR(200) NOT NULL COMMENT '简短描述',
  detail TEXT NOT NULL COMMENT '详细描述',
  icon VARCHAR(50) NOT NULL COMMENT '图标class',
  sort_order INT DEFAULT 0 COMMENT '排序'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务项目表';

-- 服务图片表
CREATE TABLE IF NOT EXISTS nail_service_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL COMMENT '服务ID',
  url VARCHAR(500) NOT NULL COMMENT '图片URL',
  sort_order INT DEFAULT 0 COMMENT '排序',
  FOREIGN KEY (service_id) REFERENCES nail_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务图片表';

-- 服务样式参考表
CREATE TABLE IF NOT EXISTS nail_service_styles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL COMMENT '服务ID',
  image_url VARCHAR(500) NOT NULL COMMENT '样式图片URL',
  name VARCHAR(50) NOT NULL COMMENT '样式名称',
  description VARCHAR(100) NOT NULL COMMENT '样式描述',
  sort_order INT DEFAULT 0 COMMENT '排序',
  FOREIGN KEY (service_id) REFERENCES nail_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务样式参考表';

-- 美甲师表
CREATE TABLE IF NOT EXISTS nail_artists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  title VARCHAR(50) NOT NULL COMMENT '职称',
  phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0 COMMENT '评分',
  experience_years INT NOT NULL DEFAULT 0 COMMENT '从业年限',
  specialty VARCHAR(100) NOT NULL COMMENT '擅长领域',
  image_url VARCHAR(500) NOT NULL COMMENT '头像URL',
  bio TEXT NOT NULL COMMENT '个人简介',
  sort_order INT DEFAULT 0 COMMENT '排序'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='美甲师表';

-- 美甲师资质表
CREATE TABLE IF NOT EXISTS nail_artist_certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artist_id INT NOT NULL COMMENT '美甲师ID',
  certification_name VARCHAR(100) NOT NULL COMMENT '资质名称',
  FOREIGN KEY (artist_id) REFERENCES nail_artists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='美甲师资质表';

-- 美甲师作品表
CREATE TABLE IF NOT EXISTS nail_artist_works (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artist_id INT NOT NULL COMMENT '美甲师ID',
  image_url VARCHAR(500) NOT NULL COMMENT '作品图片URL',
  description VARCHAR(200) DEFAULT '' COMMENT '作品描述',
  sort_order INT DEFAULT 0 COMMENT '排序',
  FOREIGN KEY (artist_id) REFERENCES nail_artists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='美甲师作品表';

-- 画廊分类表
CREATE TABLE IF NOT EXISTS nail_gallery_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画廊分类表';

-- 画廊作品表
CREATE TABLE IF NOT EXISTS nail_gallery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
  title VARCHAR(50) NOT NULL COMMENT '作品标题',
  category_id INT DEFAULT NULL COMMENT '分类ID',
  sort_order INT DEFAULT 0 COMMENT '排序',
  FOREIGN KEY (category_id) REFERENCES nail_gallery_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画廊作品表';

-- 画廊点赞表
CREATE TABLE IF NOT EXISTS nail_gallery_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gallery_item_id INT NOT NULL COMMENT '画廊作品ID',
  user_id INT NOT NULL COMMENT '用户ID',
  UNIQUE KEY uk_item_user (gallery_item_id, user_id),
  FOREIGN KEY (gallery_item_id) REFERENCES nail_gallery_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES sys_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画廊点赞表';

-- 预约记录表
CREATE TABLE IF NOT EXISTS nail_appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  service_id INT NOT NULL COMMENT '服务ID',
  artist_id INT DEFAULT NULL COMMENT '美甲师ID',
  date DATE NOT NULL COMMENT '预约日期',
  time VARCHAR(10) NOT NULL COMMENT '预约时间',
  end_time VARCHAR(10) DEFAULT NULL COMMENT '预约结束时间',
  customer_name VARCHAR(50) NOT NULL COMMENT '客户姓名',
  customer_phone VARCHAR(20) NOT NULL COMMENT '客户电话',
  note VARCHAR(500) DEFAULT '' COMMENT '备注',
  status ENUM('upcoming','completed','cancelled') DEFAULT 'upcoming' COMMENT '状态: upcoming=待服务, completed=已完成, cancelled=已取消',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES sys_users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES nail_services(id),
  FOREIGN KEY (artist_id) REFERENCES nail_artists(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约记录表';

-- 美甲师排班表
CREATE TABLE IF NOT EXISTS nail_artist_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artist_id INT NOT NULL COMMENT '美甲师ID',
  date DATE NOT NULL COMMENT '日期',
  time_slot VARCHAR(10) DEFAULT NULL COMMENT '时间段（如 14:00），NULL 表示整天不可用',
  is_unavailable TINYINT(1) DEFAULT 1 COMMENT '是否不可用：1=不可用, 0=可用',
  reason VARCHAR(200) DEFAULT '' COMMENT '不可用原因（休息/请假等）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_artist_date_slot (artist_id, date, time_slot),
  INDEX idx_date (date),
  FOREIGN KEY (artist_id) REFERENCES nail_artists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='美甲师排班表';

-- ============================================
-- 第三部分：初始数据
-- ============================================

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
(13, NULL, '排班管理', 'schedules',     'fas fa-calendar-alt', '/admin/schedules',        6),
(6, NULL, '用户管理',  'users',         'fas fa-users',          '/admin/users',           7),
(7, NULL, '系统设置',  'settings',      'fas fa-cog',            '/admin/settings',        8),
(12, 7,  '内容管理',  'settings.content','fas fa-file-alt',     '/admin/settings/content', 1),
(8, 7,   '基础配置',  'settings.basic', 'fas fa-sliders-h',     '/admin/settings/basic',  2),
(9, 7,   '短信配置',  'settings.sms',   'fas fa-sms',           '/admin/settings/sms',    3),
(10, 7,  '菜单管理',  'settings.menus', 'fas fa-bars',           '/admin/settings/menus',  4),
(11, 7,  '管理员账号','settings.admins','fas fa-user-shield',    '/admin/settings/admins', 5),
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
('booking_fee', '0.01', '预约费用（元）'),
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

-- 服务项目
INSERT IGNORE INTO nail_services (id, name, price, duration, description, detail, icon, sort_order) VALUES
(1, '经典护理', 128.00, 45, '深层清洁、修型、去死皮、手部按摩及上色', '采用进口OPI专业护理产品，从指芯清洁到甲型修整，再到角质层护理与手部精油按摩，最后上色定妆。全程45分钟的沉浸式呵护，让双手焕然新生。', 'fa-hand-sparkles', 1),
(2, '凝胶美甲', 198.00, 60, '高端凝胶甲油，持久亮丽可达3周以上', '使用日本进口凝胶甲油，色彩饱和度高、覆盖力强，配合LED灯固化技术，持久度可达3周以上。200+色号任选，支持纯色、渐变、猫眼等多种效果。', 'fa-gem', 2),
(3, '法式优雅', 228.00, 60, '经典法式白边，永恒优雅之选', '法式美甲是永不过时的经典。我们采用微雕技法打造自然弧线的微笑线，白边纯净通透，搭配裸粉色底胶，尽显指尖的优雅与精致。', 'fa-crown', 3),
(4, '艺术彩绘', 268.00, 90, '手绘花纹、渐变、晕染等创意设计', '由资深美甲师手绘创作，支持花卉、几何、动漫等各类题材。结合渐变、晕染、镶钻等复合技法，让每个指甲都成为微型画布。', 'fa-palette', 4),
(5, '日式花艺', 298.00, 90, '精致日式干花、贴纸与立体装饰组合', '精选日本进口干花素材与金属贴纸，结合珍珠、水钻等立体装饰，在方寸之间营造花艺世界。每一款都是独一无二的指尖花园。', 'fa-fan', 5),
(6, '3D立体甲', 358.00, 120, '炫酷3D立体造型，打造超凡视觉效果', '利用UV凝胶雕塑技法，在指甲上创作立体蝴蝶、玫瑰等3D造型。结合幻彩粉、荧光胶等特效材料，在不同光线下呈现变幻色彩。', 'fa-cube', 6);

-- 服务图片
INSERT IGNORE INTO nail_service_images (service_id, url, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop', 1),
(1, 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&h=450&fit=crop', 2),
(1, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=600&h=450&fit=crop', 3),
(2, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&h=450&fit=crop', 1),
(2, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&h=450&fit=crop', 2),
(2, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=450&fit=crop', 3),
(3, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=600&h=450&fit=crop&crop=top', 1),
(3, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&crop=bottom', 2),
(3, 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&h=450&fit=crop&crop=top', 3),
(4, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=450&fit=crop&crop=top', 1),
(4, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&h=450&fit=crop&crop=bottom', 2),
(4, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&h=450&fit=crop&crop=top', 3),
(5, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&h=450&fit=crop&crop=top', 1),
(5, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=450&fit=crop&crop=center', 2),
(5, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=600&h=450&fit=crop&crop=bottom', 3),
(6, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=600&h=450&fit=crop&crop=top', 1),
(6, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&crop=center', 2),
(6, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=600&h=450&fit=crop&crop=bottom', 3);

-- 服务样式参考
INSERT IGNORE INTO nail_service_styles (service_id, image_url, name, description, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=400&fit=crop&crop=top', '裸粉丝绸', '温润裸粉底色，光泽如丝', 1),
(1, 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=300&h=400&fit=crop&crop=center', '乳白月光', '纯白甲面配月牙白光泽', 2),
(1, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=300&h=400&fit=crop&crop=bottom', '蜜桃初绽', '柔和蜜桃色，元气满满', 3),
(1, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=300&h=400&fit=crop', '焦糖拿铁', '温暖焦糖棕，秋冬必备', 4),
(2, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=300&h=400&fit=crop&crop=top', '猫眼星河', '磁吸猫眼，光影流转', 1),
(2, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=300&h=400&fit=crop&crop=center', '渐变暮色', '紫粉渐变，如晚霞般温柔', 2),
(2, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop&crop=bottom', '极光绿洲', '绿金极光，神秘璀璨', 3),
(2, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=300&h=400&fit=crop&crop=top', '酒红丝绒', '深红凝胶，丝绒质感', 4),
(3, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=300&h=400&fit=crop&crop=center', '经典白法式', '永恒白边，简约优雅', 1),
(3, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=400&fit=crop&crop=left', '彩边法式', '彩色微笑线，活泼俏皮', 2),
(3, 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=300&h=400&fit=crop&crop=right', '反法式', '底部着色，反转经典', 3),
(3, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=300&h=400&fit=crop&crop=center', '金边法式', '金属边线，轻奢质感', 4),
(4, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop&crop=center', '樱花手绘', '指尖绽放的粉色浪漫', 1),
(4, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=300&h=400&fit=crop&crop=left', '星空晕染', '深蓝紫晕染，繁星点点', 2),
(4, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=300&h=400&fit=crop&crop=right', '几何线条', '极简线条，现代艺术', 3),
(4, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=300&h=400&fit=crop&crop=bottom', '海洋贝壳', '贝壳纹理，海洋气息', 4),
(5, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=300&h=400&fit=crop&crop=center', '干花庭院', '真花封存，指尖花园', 1),
(5, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop&crop=top', '珍珠蕾丝', '珍珠点缀，法式浪漫', 2),
(5, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=300&h=400&fit=crop&crop=bottom', '金箔和风', '金箔碎片，和风雅韵', 3),
(5, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=300&h=400&fit=crop&crop=left', '水钻皇冠', '水钻排列，华丽加冕', 4),
(6, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=300&h=400&fit=crop&crop=center', '立体蝴蝶', '翩翩蝶翼，栩栩如生', 1),
(6, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=400&fit=crop&crop=left', '3D玫瑰', '层层花瓣，指尖绽放', 2),
(6, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=300&h=400&fit=crop&crop=right', '浮雕城堡', '童话城堡，梦幻立体', 3),
(6, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop&crop=top', '荧光幻彩', '暗夜荧光，酷炫夺目', 4);

-- 美甲师
INSERT IGNORE INTO nail_artists (id, name, title, rating, experience_years, specialty, image_url, bio, sort_order) VALUES
(1, '小雅', '首席美甲师', 4.9, 8, '日式花艺 / 3D立体', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face', '毕业于东京NAIL协会，师从日本花艺美甲大师田中绘里。擅长将东方美学与现代美甲技法融合，作品多次入选国际美甲大赛决赛。', 1),
(2, '思琪', '高级美甲师', 4.8, 5, '艺术彩绘 / 法式', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face', '美术科班出身，将绘画功底融入美甲创作。擅长手绘花卉、风景、动漫等题材，笔触细腻生动。', 2),
(3, '若琳', '高级美甲师', 4.7, 4, '凝胶美甲 / 渐变', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=500&fit=crop&crop=face', '凝胶美甲领域的行家，精通各类进口凝胶产品特性。对渐变、猫眼等光学效果有独到研究。', 3),
(4, '小微', '美甲师', 4.6, 2, '经典护理 / 简约风', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face', '凭借对美甲的热爱和刻苦钻研，已成长为店内护理项目的实力担当。手法温柔细致。', 4);

-- 美甲师资质
INSERT IGNORE INTO nail_artist_certifications (artist_id, certification_name) VALUES
(1, '日本JNA高级美甲师'), (1, 'OPI认证技师'), (1, '国际美甲大赛金奖'),
(2, 'CND认证美甲师'), (2, '创意彩绘专项认证'), (2, '年度最受欢迎美甲师'),
(3, '韩式凝胶美甲认证'), (3, '光疗凝胶专项技师'), (3, '色彩顾问资格'),
(4, '基础美甲师资格证'), (4, '手部护理专项培训'), (4, '客户满意度之星');

-- 美甲师作品
INSERT IGNORE INTO nail_artist_works (artist_id, image_url, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&h=200&fit=crop', 1),
(1, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=200&h=200&fit=crop', 2),
(1, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=200&h=200&fit=crop', 3),
(2, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=200&h=200&fit=crop', 1),
(2, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=200&h=200&fit=crop', 2),
(2, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop', 3),
(3, 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=200&h=200&fit=crop', 1),
(3, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&h=200&fit=crop&crop=top', 2),
(3, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=200&h=200&fit=crop&crop=bottom', 3),
(4, 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=200&h=200&fit=crop', 1),
(4, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop', 2),
(4, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=200&h=200&fit=crop', 3);

-- 画廊分类
INSERT IGNORE INTO nail_gallery_categories (name, sort_order) VALUES
('日式花艺', 1),
('法式优雅', 2),
('艺术彩绘', 3),
('凝胶美甲', 4),
('3D立体甲', 5),
('经典护理', 6);

-- 画廊作品
INSERT IGNORE INTO nail_gallery_items (image_url, title, category_id, sort_order) VALUES
('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop&crop=top', '樱花季节', (SELECT id FROM nail_gallery_categories WHERE name='日式花艺'), 1),
('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400&h=500&fit=crop&crop=center', '极简法式', (SELECT id FROM nail_gallery_categories WHERE name='法式优雅'), 2),
('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop&crop=top', '星空幻境', (SELECT id FROM nail_gallery_categories WHERE name='艺术彩绘'), 3),
('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop&crop=center', '金色年华', (SELECT id FROM nail_gallery_categories WHERE name='凝胶美甲'), 4),
('https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=500&fit=crop&crop=top', '3D蝴蝶', (SELECT id FROM nail_gallery_categories WHERE name='3D立体甲'), 5),
('https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=500&fit=crop&crop=bottom', '海洋之心', (SELECT id FROM nail_gallery_categories WHERE name='艺术彩绘'), 6),
('https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=500&fit=crop&crop=top', '玫瑰物语', (SELECT id FROM nail_gallery_categories WHERE name='日式花艺'), 7),
('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop&crop=bottom', '经典红唇', (SELECT id FROM nail_gallery_categories WHERE name='凝胶美甲'), 8),
('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400&h=500&fit=crop&crop=bottom', '裸粉温柔', (SELECT id FROM nail_gallery_categories WHERE name='经典护理'), 9),
('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop&crop=center', '彩边法式', (SELECT id FROM nail_gallery_categories WHERE name='法式优雅'), 10),
('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop&crop=top', '猫眼星河', (SELECT id FROM nail_gallery_categories WHERE name='凝胶美甲'), 11),
('https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=500&fit=crop&crop=bottom', '干花庭院', (SELECT id FROM nail_gallery_categories WHERE name='日式花艺'), 12),
('https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=500&fit=crop&crop=top', '几何线条', (SELECT id FROM nail_gallery_categories WHERE name='艺术彩绘'), 13),
('https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=500&fit=crop&crop=bottom', '立体玫瑰', (SELECT id FROM nail_gallery_categories WHERE name='3D立体甲'), 14),
('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop&crop=center', '焦糖拿铁', (SELECT id FROM nail_gallery_categories WHERE name='经典护理'), 15),
('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400&h=500&fit=crop&crop=top', '金边法式', (SELECT id FROM nail_gallery_categories WHERE name='法式优雅'), 16),
('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop&crop=bottom', '渐变暮色', (SELECT id FROM nail_gallery_categories WHERE name='凝胶美甲'), 17),
('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop&crop=top', '珍珠蕾丝', (SELECT id FROM nail_gallery_categories WHERE name='日式花艺'), 18),
('https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=500&fit=crop&crop=center', '海洋贝壳', (SELECT id FROM nail_gallery_categories WHERE name='艺术彩绘'), 19),
('https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=500&fit=crop&crop=bottom', '荧光幻彩', (SELECT id FROM nail_gallery_categories WHERE name='3D立体甲'), 20),
('https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=500&fit=crop&crop=top', '蜜桃初绽', (SELECT id FROM nail_gallery_categories WHERE name='经典护理'), 21),
('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop&crop=left', '反法式', (SELECT id FROM nail_gallery_categories WHERE name='法式优雅'), 22),
('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400&h=500&fit=crop&crop=right', '酒红丝绒', (SELECT id FROM nail_gallery_categories WHERE name='凝胶美甲'), 23),
('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop&crop=center', '金箔和风', (SELECT id FROM nail_gallery_categories WHERE name='日式花艺'), 24);

-- ============================================
-- 完成！数据库初始化成功
-- ============================================
