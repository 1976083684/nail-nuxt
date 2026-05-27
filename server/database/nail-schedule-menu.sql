-- 排班管理菜单改为二级菜单结构
USE luxe_nail;

-- 将原排班管理(id=13)改为父菜单，route 设为子菜单默认路由
UPDATE sys_menus SET name='排班管理', perm_key='schedules', icon='fas fa-calendar-alt', route='/admin/schedules', sort_order=8 WHERE id=13;

-- 删除旧的排班权限关联（如果有普通管理员引用）
DELETE FROM sys_admin_menus WHERE menu_id = 13;

-- 子菜单：排班总览、新增排班、排班记录
INSERT IGNORE INTO sys_menus (id, parent_id, name, perm_key, icon, route, sort_order) VALUES
(14, 13, '排班总览', 'schedules.overview', 'fas fa-calendar-day', '/admin/schedules', 1),
(15, 13, '新增排班', 'schedules.create', 'fas fa-plus-circle', '/admin/schedules/create', 2),
(16, 13, '排班记录', 'schedules.records', 'fas fa-list-alt', '/admin/schedules/records', 3);
