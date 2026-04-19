# 技术架构文档

**产品**：环中国边境线旅行记录平台（BorderTravelling）
**版本**：v0.1 MVP
**更新日期**：2026-04-19
**状态**：待评审

---

## 一、技术选型

### 1.1 前端

| 项目 | 选择 | 理由 |
|------|------|------|
| 框架 | Next.js 14 (App Router) | SSR + 静态生成，SEO友好，响应式 |
| UI库 | Tailwind CSS + shadcn/ui | 快速开发，一致性设计 |
| 地图 | Leaflet + React-Leaflet | 开源免费，定制灵活 |
| 状态管理 | Zustand | 轻量，React兼容 |
| 表单 | React Hook Form + Zod | 类型安全，验证方便 |
| HTTP客户端 | ky (或 fetch) | 简洁，Promise友好 |

### 1.2 后端

| 项目 | 选择 | 理由 |
|------|------|------|
| 框架 | Fastify | 高性能，Schema验证内置，TypeScript支持好 |
| ORM | Drizzle ORM | 轻量，类型安全，SQLite友好 |
| 数据库 | SQLite (dev) / PostgreSQL (prod) | 快速启动，零配置 |
| 认证 | JWT + 手机号登录 | 简单可靠 |
| 文件存储 | 本地 /data/apps/bordertravelling/uploads | MVP阶段，后续迁OSS |
| GPS提取 | exif-parser / exifr | 照片EXIF解析 |

### 1.3 基础设施

| 项目 | 选择 |
|------|------|
| 部署 | PM2 (当前服务器) |
| Web服务器 | nginx (反向代理) |
| 域名 | border.qinglv.online (前台)、api-border.qinglv.online (API) |
| SSL | Cloudflare Origin Certificate |
| CDN | Cloudflare (已配置) |

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│   Web Browser / Mobile Web                                  │
│   Next.js (SSR + CSR)                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     nginx                                    │
│   border.qinglv.online  → :3003 (Frontend)                  │
│   api-border.qinglv.online → :3002 (Backend)                │
│   (Cloudflare CDN + Origin SSL)                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐    ┌───────────────┐
│  Frontend      │    │   Backend     │
│  Next.js       │    │   Fastify     │
│  Port: 3003    │    │   Port: 3002  │
└───────────────┘    └───────┬───────┘
                             │
                    ┌────────▼────────┐
                    │   SQLite DB     │
                    │   (border.db)   │
                    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │   File Storage  │
                    │  /uploads/photos│
                    └─────────────────┘
```

---

## 三、API 设计

### 3.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/send-code | 发送手机验证码 |
| POST | /api/auth/verify | 验证验证码，登录/注册 |
| GET | /api/auth/me | 获取当前用户信息 |

### 3.2 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users/:id | 获取用户公开信息 |
| PATCH | /api/users/:id | 更新个人资料 |
| GET | /api/users/:id/journeys | 获取用户的旅程列表 |

### 3.3 照片

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/photos/upload | 上传照片（含GPS） |
| GET | /api/photos/:id | 获取照片详情 |
| DELETE | /api/photos/:id | 删除照片 |
| GET | /api/photos | 获取照片列表（支持路线/地区筛选） |

### 3.4 旅程

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/journeys | 创建旅程记录 |
| GET | /api/journeys/:id | 获取旅程详情 |
| PATCH | /api/journeys/:id | 更新旅程状态（进行中/已完成） |
| GET | /api/journeys | 获取当前用户的旅程列表 |

### 3.5 路线

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/routes | 获取三条路线信息（G219/G331/G228） |
| GET | /api/routes/:id/segments | 获取路线分段 |

---

## 四、数据模型

### 4.1 Users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Photos

```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  latitude REAL,
  longitude REAL,
  location_name TEXT,
  captured_at DATETIME,
  description TEXT,
  route_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Journeys

```sql
CREATE TABLE journeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  route_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress', -- in_progress, completed
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.4 Routes (预置数据)

```sql
CREATE TABLE routes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- G219, G331, G228
  name TEXT NOT NULL,
  total_length_km INTEGER,
  description TEXT
);
```

### 4.5 Journey_Photos (关联表)

```sql
CREATE TABLE journey_photos (
  journey_id TEXT REFERENCES journeys(id),
  photo_id TEXT REFERENCES photos(id),
  sequence INTEGER,
  PRIMARY KEY (journey_id, photo_id)
);
```

---

## 五、目录结构

```
bordertravelling/
├── frontend/                  # Next.js 前端
│   ├── app/
│   │   ├── (auth)/           # 认证页面组
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/           # 主要页面组
│   │   │   ├── map/          # 地图页
│   │   │   ├── journey/      # 旅程页
│   │   │   ├── profile/      # 个人主页
│   │   │   └── upload/       # 上传页
│   │   ├── api/              # API 代理（可选）
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # shadcn/ui 组件
│   │   ├── map/             # 地图相关组件
│   │   ├── photo/           # 照片相关组件
│   │   └── layout/          # 布局组件
│   ├── lib/
│   │   ├── api.ts           # API 客户端
│   │   ├── auth.ts          # 认证工具
│   │   └── utils.ts
│   ├── public/
│   └── package.json
│
├── backend/                  # Fastify 后端
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── photos.ts
│   │   │   ├── journeys.ts
│   │   │   └── routes.ts
│   │   ├── db/
│   │   │   ├── index.ts     # 数据库连接
│   │   │   └── schema.ts    # Drizzle schema
│   │   ├── services/
│   │   │   ├── auth.ts
│   │   │   ├── photo.ts
│   │   │   └── journey.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   └── gps.ts       # GPS提取工具
│   │   └── index.ts         # 入口文件
│   ├── uploads/
│   ├── drizzle/              # 迁移文件
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                  # 工具脚本
│   └── seed-routes.ts       # 初始化路线数据
│
├── docs/                     # 文档
│   ├── product-roadmap.md
│   ├── competitor-research.md
│   └── technical-architecture.md
│
└── README.md
```

---

## 六、部署方案

### 6.1 当前服务器配置

| 服务 | 地址 | 端口 | 目录 |
|------|------|------|------|
| Frontend | border.qinglv.online | 3003 | /data/apps/bordertravelling/frontend |
| Backend | api-border.qinglv.online | 3002 | /data/apps/bordertravelling/backend |
| Nginx | 47.95.170.152 | 80/443 | /etc/nginx |

### 6.2 PM2 进程管理

```
border-frontend  →  node frontend/.next/standalone/server.js (3003)
border-backend   →  node backend/dist/index.js (3002)
```

### 6.3 Nginx 配置要点

```nginx
# Frontend
server {
  server_name border.qinglv.online;
  location / {
    proxy_pass http://127.0.0.1:3003;
  }
}

# Backend
server {
  server_name api-border.qinglv.online;
  location / {
    proxy_pass http://127.0.0.1:3002;
  }
}
```

---

## 七、开发规范

### 7.1 Git 工作流

- 分支：main (保护) → develop → feature/xxx
- PR 要求：至少 1 人 review + CI 通过
- Commit message: `type: description` (feat/fix/docs/style/refactor/test)

### 7.2 代码质量

- ESLint + Prettier (格式化)
- TypeScript strict mode
- 单元测试 (Jest/Vitest) - 后端核心逻辑覆盖

### 7.3 Cursor AI 集成

- 使用 Cursor 作为团队首选 AI 编程工具
- PR 自动 review via Cursor Agent
- 开发流程中自动触发 Cursor AI 调用

---

## 八、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| GPS 隐私顾虑 | 用户不愿上传 | 支持关闭GPS、模糊位置选项 |
| SQLite 并发限制 | 高并发下性能 | MVP 验证后迁 PostgreSQL |
| 照片存储量增长 | 磁盘空间 | 后续引入 OSS + CDN |
| nginx HTTPS 配置 | API 请求失败 | 使用 Cloudflare Origin SSL |

---

*架构待团队评审后执行。*