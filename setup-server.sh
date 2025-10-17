#!/bin/bash

# 服务器初始化脚本
# 用途：在服务器 165.227.56.186 上执行此脚本，完成环境配置
# 
# 使用方法：
# 1. 将此文件上传到服务器：scp setup-server.sh root@165.227.56.186:/root/
# 2. SSH 登录服务器：ssh root@165.227.56.186
# 3. 添加执行权限：chmod +x setup-server.sh
# 4. 运行脚本：./setup-server.sh

set -e  # 遇到错误立即退出

echo "========================================="
echo "开始配置服务器..."
echo "========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 域名和路径配置
DOMAIN="onespecial.me"
DEPLOY_PATH="/var/www/${DOMAIN}"
BACKEND_PORT=3000

# 步骤 1: 更新系统
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
apt update && apt upgrade -y

# 步骤 2: 安装 Nginx
echo -e "${YELLOW}[2/8] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    echo -e "${GREEN}✓ Nginx 安装成功${NC}"
else
    echo -e "${GREEN}✓ Nginx 已安装${NC}"
fi

# 步骤 3: 安装 Node.js
echo -e "${YELLOW}[3/8] 安装 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✓ Node.js 安装成功${NC}"
else
    echo -e "${GREEN}✓ Node.js 已安装 (版本: $(node -v))${NC}"
fi

# 步骤 4: 安装 PM2
echo -e "${YELLOW}[4/8] 安装 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 安装成功${NC}"
else
    echo -e "${GREEN}✓ PM2 已安装${NC}"
fi

# 步骤 5: 安装 Certbot
echo -e "${YELLOW}[5/8] 安装 Certbot (SSL 证书工具)...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install certbot python3-certbot-nginx -y
    echo -e "${GREEN}✓ Certbot 安装成功${NC}"
else
    echo -e "${GREEN}✓ Certbot 已安装${NC}"
fi

# 步骤 6: 创建部署目录
echo -e "${YELLOW}[6/8] 创建部署目录...${NC}"
mkdir -p ${DEPLOY_PATH}
chown -R www-data:www-data ${DEPLOY_PATH}
chmod -R 755 /var/www
echo -e "${GREEN}✓ 部署目录创建成功: ${DEPLOY_PATH}${NC}"

# 步骤 7: 配置 Nginx
echo -e "${YELLOW}[7/8] 配置 Nginx...${NC}"

# 备份现有配置（如果存在）
if [ -f "/etc/nginx/sites-available/${DOMAIN}" ]; then
    cp /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-available/${DOMAIN}.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${YELLOW}已备份现有配置${NC}"
fi

# 创建 Nginx 配置文件
cat > /etc/nginx/sites-available/${DOMAIN} <<'EOF'
# HTTP 服务器（稍后会重定向到 HTTPS）
server {
    listen 80;
    listen [::]:80;
    server_name onespecial.me www.onespecial.me;

    # Let's Encrypt 验证路径
    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        root /var/www/onespecial.me;
    }

    # 前端静态文件
    root /var/www/onespecial.me;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 前端路由处理（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 代理后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 创建符号链接
ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}

# 删除默认站点（如果存在）
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
fi

# 测试 Nginx 配置
if nginx -t; then
    echo -e "${GREEN}✓ Nginx 配置测试通过${NC}"
    systemctl restart nginx
    echo -e "${GREEN}✓ Nginx 已重启${NC}"
else
    echo -e "${RED}✗ Nginx 配置错误${NC}"
    exit 1
fi

# 步骤 8: 配置防火墙
echo -e "${YELLOW}[8/8] 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    echo -e "${GREEN}✓ 防火墙规则已配置${NC}"
else
    echo -e "${YELLOW}未检测到 ufw，跳过防火墙配置${NC}"
fi

# 完成
echo ""
echo "========================================="
echo -e "${GREEN}服务器配置完成！${NC}"
echo "========================================="
echo ""
echo "下一步操作："
echo ""
echo "1. 配置 DNS："
echo "   - 登录你的域名注册商"
echo "   - 添加 A 记录：onespecial.me → 165.227.56.186"
echo "   - 添加 CNAME 记录：www.onespecial.me → onespecial.me"
echo ""
echo "2. 等待 DNS 生效（通常需要几分钟到几小时）"
echo "   验证命令：ping onespecial.me"
echo ""
echo "3. DNS 生效后，获取 SSL 证书："
echo "   sudo certbot --nginx -d onespecial.me -d www.onespecial.me"
echo ""
echo "4. 在 GitHub 仓库中配置 Secrets："
echo "   - SERVER_HOST: 165.227.56.186"
echo "   - SERVER_USER: root"
echo "   - SERVER_SSH_KEY: (SSH 私钥内容)"
echo "   - DEPLOY_PATH: /var/www/onespecial.me"
echo ""
echo "5. 推送代码到 dev-pzj 分支，触发自动部署"
echo ""
echo "========================================="
echo "安装的软件版本："
echo "- Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "- Node.js: $(node -v)"
echo "- npm: $(npm -v)"
echo "- PM2: $(pm2 -v)"
echo "========================================="
