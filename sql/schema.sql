-- Core CMS Nexus tables (MySQL 5.7+)
-- Run this once in your database (cms_nexus).

CREATE TABLE IF NOT EXISTS cms_connections (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('wordpress','drupal','joomla') NOT NULL,
  url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  status ENUM('connected','disconnected','error') NOT NULL DEFAULT 'connected',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_content_items (
  id VARCHAR(64) PRIMARY KEY,
  cms_id VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  body LONGTEXT NOT NULL,
  author VARCHAR(255) NOT NULL DEFAULT '',
  status ENUM('published','draft','pending') NOT NULL DEFAULT 'draft',
  date DATETIME NOT NULL,
  tags JSON NOT NULL,
  word_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_id (cms_id),
  INDEX idx_status (status),
  INDEX idx_date (date),
  CONSTRAINT fk_content_connection FOREIGN KEY (cms_id) REFERENCES cms_connections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(64) PRIMARY KEY,
  content_id VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description LONGTEXT NOT NULL,
  priority ENUM('high','medium','low') NOT NULL,
  suggested_action LONGTEXT NOT NULL,
  status ENUM('pending','accepted','dismissed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_content_id (content_id),
  INDEX idx_assignment_status (status),
  CONSTRAINT fk_assignment_content FOREIGN KEY (content_id) REFERENCES cms_content_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_agent_reports (
  id VARCHAR(64) PRIMARY KEY,
  agent_id VARCHAR(128) NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  connection_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(64) NOT NULL,
  content_title VARCHAR(500) NOT NULL,
  result JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agent_id (agent_id),
  INDEX idx_connection_id (connection_id),
  INDEX idx_content_id (content_id),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_report_connection FOREIGN KEY (connection_id) REFERENCES cms_connections(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_content FOREIGN KEY (content_id) REFERENCES cms_content_items(id) ON DELETE CASCADE
);

