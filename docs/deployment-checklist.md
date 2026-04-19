# MVP 部署检查清单

**版本**: v0.1 MVP
**日期**: 2026-04-19

---

## 服务端部署步骤

### 1. 环境准备

```bash
# 创建目录
mkdir -p /data/apps/bordertravelling/{frontend,backend}/uploads
mkdir -p /data/apps/bordertravelling/backend/dist

# 安装依赖
cd /data/apps/bordertravelling
npm install -g pnpm
pnpm install --dir backend
pnpm install --dir frontend
```

### 2. 数据库初始化

```bash
cd /data/apps/bordertravelling/backend

# 运行迁移（创建表）
pnpm db:push

# 预置边境路线数据（3条种子路线）
pnpm db:seed
```

### 3. 构建

```bash
# Backend
cd /data/apps/bordertravelling/backend
pnpm build

# Frontend
cd /data/apps/bordertravelling/frontend
pnpm build
```

### 4. 环境变量

**Backend (.env)**
```
JWT_SECRET=<生成一个随机字符串>
NODE_ENV=production
PORT=3002
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=https://api-border.qinglv.online
```

### 5. PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'border-backend',
      cwd: '/data/apps/bordertravelling/backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        JWT_SECRET: '<YOUR_SECRET>',
      },
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: 'border-frontend',
      cwd: '/data/apps/bordertravelling/frontend',
      script: '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3003',
      },
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
```

```bash
# 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 开机自启
```

### 6. Nginx 配置

```nginx
# /etc/nginx/conf.d/bordertravelling.conf

# Frontend (border.qinglv.online)
server {
    listen 80;
    server_name border.qinglv.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name border.qinglv.online;

    ssl_certificate /etc/cloudflare/*.pem;
    ssl_certificate_key /etc/cloudflare/*.key;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend (api-border.qinglv.online)
server {
    listen 80;
    server_name api-border.qinglv.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api-border.qinglv.online;

    ssl_certificate /etc/cloudflare/*.pem;
    ssl_certificate_key /etc/cloudflare/*.key;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 7. SSL 证书

Cloudflare 生成的证书通常在 `/etc/cloudflare/` 目录下。检查是否存在：
```bash
ls /etc/cloudflare/*.pem 2>/dev/null || echo "需要上传 Cloudflare 证书"
```

如果没有，使用以下命令从 Cloudflare 下载：
```bash
# Cloudflare Dashboard > SSL/TLS > Origin Server > 创建证书
# 下载 PEM 文件并上传到 /etc/cloudflare/
```

### 8. Nginx 重载

```bash
nginx -t && nginx -s reload
```

---

## 验证清单

- [ ] Backend 健康检查: `curl https://api-border.qinglv.online/health`
- [ ] 发送验证码: `curl -X POST https://api-border.qinglv.online/api/auth/send-code -H "Content-Type: application/json" -d '{"phone":"13800138000"}'`
- [ ] Frontend 首页可访问: `https://border.qinglv.online`
- [ ] 登录流程完整
- [ ] 地图页加载
- [ ] 上传功能可用（照片含 GPS 信息）

---

## 技术说明

### API 通信
- 前端 API base: `https://api-border.qinglv.online`
- 前端直接调用后端 API（跨域，由后端 CORS 处理）
- CORS 已配置为允许 `https://border.qinglv.online` 和 `https://www.border.qinglv.online`

### 数据库
- SQLite 文件位于 `backend/data/bordertravelling.db`
- 预置路线: G219, G331, G228

### 照片存储
- 上传目录: `backend/uploads/`
- 文件通过 API 访问: `GET /api/photos/:id/file`
