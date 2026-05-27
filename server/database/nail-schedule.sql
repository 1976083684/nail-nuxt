USE luxe_nail;

-- 美甲师排班表
CREATE TABLE IF NOT EXISTS nail_artist_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artist_id INT NOT NULL COMMENT '美甲师ID',
  date DATE NOT NULL COMMENT '日期',
  time_slot VARCHAR(10) DEFAULT NULL COMMENT '时间段（如 14:00），NULL 表示整天不可用',
  is_unavailable TINYINT(1) DEFAULT 1 COMMENT '是否不可用：1=不可用',
  reason VARCHAR(200) DEFAULT '' COMMENT '不可用原因（休息/请假等）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_artist_date_slot (artist_id, date, time_slot),
  INDEX idx_date (date),
  FOREIGN KEY (artist_id) REFERENCES nail_artists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='美甲师排班表';

-- 预约表增加 end_time 字段，用于基于服务时长的冲突检测
ALTER TABLE nail_appointments ADD COLUMN end_time VARCHAR(10) DEFAULT NULL COMMENT '预约结束时间' AFTER time;
