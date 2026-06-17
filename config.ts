# ============================================================
# Copia este archivo como .env y ajusta los valores
# cp .env.example .env
# ============================================================

# --- Base de datos MySQL ---
DATABASE_URL=mysql+aiomysql://activity_user:N0m3l4s3,.@host.docker.internal:3307/activity_tracker

# --- JWT ---
# Genera una clave segura con: openssl rand -hex 32
SECRET_KEY=f5ff5c76fee0dc3ca65aafd44cba7d41413a0b1283694c112395b7cdaeb9f926
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# --- Redis ---
REDIS_URL=redis://redis:6379/0

# --- App ---
APP_ENV=development
# En producción cambiar a False
DEBUG=True
CORS_ORIGINS=http://localhost,http://localhost:5173,http://localhost:80

# --- Seed (usuario admin inicial) ---
FIRST_ADMIN_EMAIL=rafaelmolano@solucionessyh.com
FIRST_ADMIN_PASSWORD=Admin123456
FIRST_ADMIN_NAME=Administrador



CREATE DATABASE `activity_tracker`


CREATE TABLE `activities` (
  `id` char(32) NOT NULL,
  `user_id` char(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `tags` json NOT NULL,
  `observations` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_activities_name` (`name`),
  KEY `ix_activities_date` (`date`),
  KEY `ix_activities_user_id` (`user_id`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `users` (
  `id` char(32) NOT NULL,
  `email` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
