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

# 安装 Node.js 依赖 (使用 pnpm 加速)
pnpm install --dir backend
pnpm install --dir frontend
```

### 2. 数据库初始化

```bash
# 进入 backend 目录
cd /data/apps/bordertravelling/backend

# 运行迁移
pnpm db:generate
pnpm db:push

# 预置路线数据
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

### 4. PM2 配置

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
        JWT_SECRET: 'YOUR_SECRET_HERE',
      },
      instances: 1,
      autorestart: true,
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
    },
  ],
};
```

```bash
# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx 配置

```nginx
# /etc/nginx/conf.d/bordertravelling.conf

# Frontend
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

# Backend
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

### 6. 环境变量

**Backend (.env)**
```
JWT_SECRET=<生成强随机密钥>
NODE_ENV=production
PORT=3002
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=https://api-border.qinglv.online
```

---

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发
pnpm dev
```

---

## 验证清单

- [ ] Backend 健康检查: `curl https://api-border.qinglv.online/health`
- [ ] 发送验证码: `POST https://api-border.qinglv.online/api/auth/send-code`
- [ ] Frontend 首页可访问: `https://border.qinglv.online`
- [ ] 登录流程完整
- [ ] 地图页加载
- [ ] 上传功能可用
