# Bordertravelling 技术架构方案

## 1. 技术选型总览

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Next.js)                        │
│                   Port 3000 / 静态托管                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS (api-border.qinglv.online)
┌─────────────────────────▼───────────────────────────────────┐
│                     API Layer (Node.js)                      │
│                   Port 8080 / Fastify                        │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + PostGIS  │  本地文件存储  │  Cloudflare CDN    │
└─────────────────────────────────────────────────────────────┘
```

## 2. 前后端分离方案

### 推荐方案：前后端分离 + BFF 模式

**技术栈：**
- **前端框架**：Next.js 14 (App Router) + React 18 + TypeScript
- **后端框架**：Fastify（比Express更轻量，的性能更好）
- **移动端**：React Native 或 微信小程序（后期考虑）

**选型理由：**

| 方案 | 优点 | 缺点 | 适合度 |
|------|------|------|--------|
| Next.js 全栈 | SSR/SSG灵活，API Routes可当BFF | 单体复杂度高 | ★★★★ |
| 纯前端 + 独立后端 | 职责清晰，可独立部署 | 两套代码，两套部署 | ★★★★ |
| Nuxt3 全栈 | Vue生态，上手快 | 生态不如Next.js | ★★★ |
| 微信小程序 | 流量红利，传播容易 | 功能限制，审核复杂 | ★★★ |

**结论**：采用 Next.js 前端 + Fastify 后端分离。BFF（Backend For Frontend）模式，前端通过 `/api/*` 调用后端，后端专注业务逻辑。

**理由**：
1. GPS照片提取验证需要客户端EXIF解析，Next.js客户端组件天然支持
2. 地图展示需要SSR优化SEO，Next.js有先天优势
3. 团队已有 Leaflet + GeoJSON Demo，前端框架迁移成本低
4. Fastify 比 Express 快 2-3倍，业余项目性能冗余大

## 3. 数据库选型

### 推荐方案：PostgreSQL + PostGIS + Redis

```
PostgreSQL 15 (主数据库)
├── users 表 (用户数据)
├── tracks 表 (轨迹数据，GIS几何字段)
├── photos 表 (照片元数据，EXIF JSON)
├── certificates 表 (证书数据)
└── PostGIS 扩展 (地理空间查询)
```

**选型理由：**

| 存储方案 | 适用场景 | 业余项目适合度 |
|----------|----------|----------------|
| PostgreSQL + PostGIS | 轨迹本身就是GIS数据，空间查询 | ★★★★★ |
| MongoDB | 文档存储，EXIF JSON灵活 | ★★★ |
| MySQL + 文本字段 | 简单CRUD | ★★ |
| SQLite | 单机简单 | 不适合（多用户） |

**核心表结构预览：**

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 轨迹表 (使用PostGIS几何类型)
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  geojson GEOMETRY(LineString, 4326) NOT NULL,  -- 边境线轨迹
  distance_km DECIMAL(10, 2),                   -- 总距离
  start_point GEOMETRY(Point, 4326),
  end_point GEOMETRY(Point, 4326),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 照片表 (EXIF元数据JSON存储)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id),
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  exif_data JSONB,                              -- EXIF完整信息
  gps_lat DECIMAL(10, 7),
  gps_lng DECIMAL(10, 7),
  taken_at TIMESTAMP,                           -- 拍摄时间
  verified BOOLEAN DEFAULT false,               -- GPS验证状态
  created_at TIMESTAMP DEFAULT NOW()
);

-- 证书表
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  track_id UUID REFERENCES tracks(id),
  certificate_no VARCHAR(50) UNIQUE NOT NULL,   -- 证书编号
  issued_at TIMESTAMP DEFAULT NOW(),
  share_url VARCHAR(200)
);
```

**为什么不用MongoDB？**
- 轨迹数据需要空间查询（ST_Distance, ST_Within），PostGIS远强于MongoDB
- 用户量级小，PostgreSQL完全够用
- JSONB类型已提供足够的灵活性存储EXIF数据

**Redis用途：**
- Session存储 / JWT黑名单
- 简单的rate limiting
- 验证码/OTP缓存

## 4. API 设计

### 架构：RESTful + JSON

**基础URL：** `https://api-border.qinglv.online/api/v1`

### 核心接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /auth/register | 用户注册 | 否 |
| POST | /auth/login | 用户登录 | 否 |
| POST | /auth/logout | 登出 | 是 |
| GET | /users/me | 当前用户信息 | 是 |
| GET | /tracks | 轨迹列表（分页） | 否 |
| POST | /tracks | 创建轨迹 | 是 |
| GET | /tracks/:id | 轨迹详情 | 否 |
| DELETE | /tracks/:id | 删除轨迹 | 是 |
| POST | /photos/upload | 上传照片（含EXIF） | 是 |
| GET | /photos/:id | 照片详情 | 否 |
| POST | /photos/:id/verify | GPS验证照片 | 是 |
| GET | /certificates | 我的证书列表 | 是 |
| POST | /certificates/generate | 生成证书 | 是 |
| GET | /certificates/:id | 证书详情 | 否 |
| GET | /certificates/:id/share | 分享页面 | 否 |

### 请求/响应示例

```json
// POST /tracks 创建轨迹
// Request
{
  "name": "G219西藏段",
  "geojson": {
    "type": "LineString",
    "coordinates": [[85.3, 32.1], [85.4, 32.2], ...]
  },
  "distance_km": 1256.8
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "name": "G219西藏段",
    "geojson": {...},
    "distance_km": 1256.8,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "GPS_VERIFY_FAILED",
    "message": "照片GPS位置与轨迹不符"
  }
}
```

## 5. 照片存储方案

### 推荐方案：本地存储 + CDN 加速（渐进式）

**Phase 1 (MVP)：本地存储**
```
/data/apps/bordertravelling/
├── uploads/
│   ├── photos/
│   │   ├── original/      # 原始照片
│   │   └── thumb/         # 缩略图
│   └── certificates/      # 生成的证书图片
├── nginx/static/          # 静态资源
```

**Phase 2 (用户增长后)：迁移到 OSS**
- 阿里云 OSS / 腾讯云 COS
- 预估费用：~50元/月（100GB存储 + 流量）

**为什么不用一开始就用OSS？**
1. 业余项目，用户量不确定，本地存储零成本
2. 服务器带宽足够（ESC 47.95.170.152）
3. 迁移成本低：只需改filepath字段

**照片处理流程：**
```
用户上传 → 服务端接收 → 提取EXIF → 生成缩略图 → 存储 → 返回URL
```

**技术选型：**
- 文件上传：`fastify-multipart`
- 图片处理：`sharp`（生成缩略图，EXIF处理）
- EXIF解析：`exif-parser`（已有Demo验证）

## 6. GPS验证技术方案

### 验证策略：服务端验证为主 + 客户端辅助

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  客户端上传照片  │ ──▶ │  EXIF提取GPS    │ ──▶ │  服务端验证     │
│  (含原始EXIF)   │     │  (exif-parser)  │     │  (精确算法)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**验证流程：**

1. **客户端提取EXIF**（已有Demo验证）
   - 提取 GPSLatitude, GPSLongitude, DateTimeOriginal
   - 精度：设备GPS精度（通常5-15米）

2. **服务端验证逻辑**
   ```
   验证点: 用户声明的照片拍摄位置 (lat, lng, time)
   
   1. 找到轨迹上时间最接近的点
   2. 计算 Haversine 距离
   3. 阈值: < 500米 → 通过, 500-2km → 警告, > 2km → 拒绝
   ```

3. **防伪造措施**
   - 要求上传原始EXIF（非二次编辑过的）
   - 检查EXIF签名/元数据完整性
   - 拍摄时间需在轨迹时间段内
   - 同一位置多张照片交叉验证

**精度说明：**
- 手机GPS精度：5-15米（开阔地）
- 轨迹点间距：建议每10秒一个点或10米一个点
- 验证阈值：500米（考虑GPS漂移和轨迹点密度）

**为什么不纯客户端验证？**
- 防止客户端伪造EXIF数据
- 统一的验证规则
- 便于后续证书认证

## 7. 部署架构

### 部署拓扑

```
                         ┌──────────────────────────────────┐
                         │         Cloudflare CDN           │
                         │   (border.qinglv.online)         │
                         └──────────────┬───────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
          ┌─────────▼─────────┐ ┌───────▼───────┐ ┌────────▼────────┐
          │   前端静态资源     │ │  API服务       │ │   数据库        │
          │   /data/apps/     │ │  :8080         │ │   PostgreSQL   │
          │   bordertravelling│ │  (Fastify)     │ │   :5432        │
          │   /frontend       │ │                │ │                │
          └───────────────────┘ └────────────────┘ └────────────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │   nginx (80/443)  │
                              │   ESC 47.95.170.152│
                              └───────────────────┘
```

### nginx 配置要点

```nginx
# /etc/nginx/conf.d/bordertravelling.conf

# 前端静态资源
server {
    listen 80;
    server_name border.qinglv.online;
    root /data/apps/bordertravelling/frontend;
    
    # Next.js 静态资源缓存
    location /_next/static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 照片等上传文件
    location /uploads {
        expires 7d;
        add_header Cache-Control "public";
    }
    
    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# API 专用域名（可选，统一API入口）
server {
    listen 80;
    server_name api-border.qinglv.online;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### PM2 进程管理

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bordertravelling-api',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
}
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install & Build
        run: |
          npm ci
          npm run build
          
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: gpt-app
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /data/apps/bordertravelling
            git pull
            npm ci
            npm run build
            pm2 restart bordertravelling-api
```

## 8. MVP 开发优先级

### Phase 1：核心闭环（4-6周）

**目标：跑通 MVP 铁三角**

| 优先级 | 功能 | 技术要点 |
|--------|------|----------|
| P0 | 用户注册登录 | JWT + bcrypt |
| P0 | 轨迹上传与存储 | GeoJSON存储，PostGIS索引 |
| P0 | 照片上传与EXIF提取 | multipart + exif-parser |
| P0 | GPS位置验证 | Haversine距离算法 |
| P0 | 地图轨迹展示 | Leaflet + GeoJSON渲染 |
| P1 | 简单证书生成 | 模板渲染 + 图片合成 |

**交付物：**
- 用户可注册并登录
- 可上传轨迹并在地图上展示
- 可上传带GPS的照片并验证
- 可生成简单证书

### Phase 2：证书体系（2-3周）

**目标：完整的证书体验**

| 优先级 | 功能 | 技术要点 |
|--------|------|----------|
| P0 | 证书编号生成 | UUID + 序列号 |
| P0 | 证书图片生成 | sharp模板渲染 |
| P0 | 证书分享页面 | 公开查看页 + 动态OG图 |
| P1 | 证书真伪验证API | 编号查询接口 |

**交付物：**
- 完整的证书生成流程
- 可分享的证书链接
- 证书验证页面

### Phase 3：数据展示与社交（4-6周）

**目标：社区氛围**

| 优先级 | 功能 | 技术要点 |
|--------|------|----------|
| P1 | 轨迹排行榜 | 距离/难度/时间 |
| P1 | 用户主页 | 轨迹集/照片墙 |
| P2 | 轨迹评论/点赞 | 简单社交 |
| P2 | 边境线地图聚合 | 所有用户轨迹热力图 |

### Phase 4：运营能力（持续迭代）

- 数据统计后台
- 违规内容处理
- 活动运营支持

## 9. 项目目录结构

```
bordertravelling/
├── docs/
│   └── architecture.md          # 本文档
├── src/
│   ├── frontend/                # Next.js 前端
│   │   ├── app/
│   │   │   ├── (auth)/          # 认证页面
│   │   │   ├── (main)/          # 主站页面
│   │   │   │   ├── tracks/      # 轨迹相关
│   │   │   │   ├── photos/      # 照片相关
│   │   │   │   └── certificates/# 证书相关
│   │   │   └── api/             # BFF层
│   │   ├── components/
│   │   └── lib/
│   ├── backend/                 # Fastify 后端
│   │   ├── src/
│   │   │   ├── routes/          # API路由
│   │   │   ├── services/        # 业务逻辑
│   │   │   ├── plugins/         # 插件
│   │   │   └── utils/           # 工具函数
│   │   └── dist/                # 编译输出
│   └── shared/                  # 共享类型/常量
├── uploads/                     # 本地文件存储
├── scripts/
│   └── init-db.sql              # 数据库初始化
├── ecosystem.config.js          # PM2配置
└── docker-compose.yml           # 本地开发用
```

## 10. 关键结论

1. **前后端分离**：Next.js + Fastify，职责清晰，团队分工明确
2. **数据库**：PostgreSQL + PostGIS，轨迹数据天然支持空间查询
3. **API**：RESTful + JSON，接口简单直观
4. **照片存储**：本地起步，OSS按需迁移
5. **GPS验证**：服务端验证为主，客户端提取为辅，500米容错阈值
6. **部署**：nginx反代 + PM2进程管理 + GitHub Actions自动化
7. **MVP优先级**：Phase1完成核心闭环，Phase2完善证书，Phase3社交

---

*文档版本：v1.0*
*最后更新：2024年*
