USE luxe_nail;

-- ============ 美甲业务相关表 ============

-- 服务项目表
CREATE TABLE IF NOT EXISTS nail_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INT NOT NULL COMMENT '时长(分钟)',
  description VARCHAR(200) NOT NULL,
  detail TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 服务图片表
CREATE TABLE IF NOT EXISTS nail_service_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES nail_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 服务样式参考表
CREATE TABLE IF NOT EXISTS nail_service_styles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES nail_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 美甲师表
CREATE TABLE IF NOT EXISTS nail_artists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  title VARCHAR(50) NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  experience_years INT NOT NULL DEFAULT 0,
  specialty VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  bio TEXT NOT NULL,
  sort_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 美甲师资质表
CREATE TABLE IF NOT EXISTS nail_artist_certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artist_id INT NOT NULL,
  certification_name VARCHAR(100) NOT NULL,
  FOREIGN KEY (artist_id) REFERENCES nail_artists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 美甲师作品表
CREATE TABLE IF NOT EXISTS nail_artist_works (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artist_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  description VARCHAR(200) DEFAULT '' COMMENT '作品描述',
  sort_order INT DEFAULT 0,
  FOREIGN KEY (artist_id) REFERENCES nail_artists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 画廊作品表
CREATE TABLE IF NOT EXISTS nail_gallery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL,
  title VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 画廊点赞表
CREATE TABLE IF NOT EXISTS nail_gallery_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gallery_item_id INT NOT NULL,
  user_id INT NOT NULL,
  UNIQUE KEY uk_item_user (gallery_item_id, user_id),
  FOREIGN KEY (gallery_item_id) REFERENCES nail_gallery_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES sys_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 预约记录表
CREATE TABLE IF NOT EXISTS nail_appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_id INT NOT NULL,
  artist_id INT DEFAULT NULL,
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL,
  customer_name VARCHAR(50) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  note VARCHAR(500) DEFAULT '',
  status ENUM('upcoming','completed','cancelled') DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES sys_users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES nail_services(id),
  FOREIGN KEY (artist_id) REFERENCES nail_artists(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ 初始数据 ============

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

-- 画廊作品
INSERT IGNORE INTO nail_gallery_items (image_url, title, category, sort_order) VALUES
('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop&crop=top', '樱花季节', '日式花艺', 1),
('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400&h=500&fit=crop&crop=center', '极简法式', '法式优雅', 2),
('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop&crop=top', '星空幻境', '艺术彩绘', 3),
('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop&crop=center', '金色年华', '凝胶美甲', 4),
('https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=500&fit=crop&crop=top', '3D蝴蝶', '3D立体甲', 5),
('https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=500&fit=crop&crop=bottom', '海洋之心', '艺术彩绘', 6),
('https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=500&fit=crop&crop=top', '玫瑰物语', '日式花艺', 7),
('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop&crop=bottom', '经典红唇', '凝胶美甲', 8),
('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400&h=500&fit=crop&crop=bottom', '裸粉温柔', '经典护理', 9),
('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop&crop=center', '彩边法式', '法式优雅', 10),
('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop&crop=top', '猫眼星河', '凝胶美甲', 11),
('https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=500&fit=crop&crop=bottom', '干花庭院', '日式花艺', 12),
('https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=500&fit=crop&crop=top', '几何线条', '艺术彩绘', 13),
('https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=500&fit=crop&crop=bottom', '立体玫瑰', '3D立体甲', 14),
('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop&crop=center', '焦糖拿铁', '经典护理', 15),
('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400&h=500&fit=crop&crop=top', '金边法式', '法式优雅', 16),
('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop&crop=bottom', '渐变暮色', '凝胶美甲', 17),
('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop&crop=top', '珍珠蕾丝', '日式花艺', 18),
('https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=500&fit=crop&crop=center', '海洋贝壳', '艺术彩绘', 19),
('https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=500&fit=crop&crop=bottom', '荧光幻彩', '3D立体甲', 20),
('https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=500&fit=crop&crop=top', '蜜桃初绽', '经典护理', 21),
('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=500&fit=crop&crop=left', '反法式', '法式优雅', 22),
('https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=400&h=500&fit=crop&crop=right', '酒红丝绒', '凝胶美甲', 23),
('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=500&fit=crop&crop=center', '金箔和风', '日式花艺', 24);
