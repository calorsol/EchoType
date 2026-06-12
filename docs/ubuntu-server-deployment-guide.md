# EchoType 部署到 Ubuntu 云服务器实战记录

这份文档整理了 EchoType 从本地代码到 Ubuntu 云服务器上线的完整流程，适合自己复盘，也适合做视频分享。

本文使用的是一套真实可落地的静态站部署方案：

- 前端项目：`Vite + React`
- 服务器系统：`Ubuntu 22.04`
- Web 服务：`Nginx`（运行在 Docker 容器中）
- 域名解析：`Cloudflare DNS`
- HTTPS 证书：`Let's Encrypt`

## 一、先判断项目适合什么部署方式

EchoType 是纯静态前端项目，构建后只会产出 `dist/` 目录，不需要 Node.js 常驻运行。

所以这类项目最适合的部署方式是：

1. 本地执行构建
2. 将 `dist/` 上传到服务器
3. 让 Nginx 直接托管静态文件
4. 为域名配置 HTTPS

这类项目不需要：

- `pm2`
- `systemd` 启动 Node 服务
- 后端进程守护

## 二、这次部署使用的站点信息

本文示例使用的是：

- 服务器 IP：`64.83.35.146`
- 站点域名：`echotype.868601.xyz`
- 站点目录：`/home/web/html/echotype`
- Nginx 配置目录：`/home/web/conf.d`

说明：

- 同一台服务器可以部署多个网站
- 多个网站可以共用同一个服务器 IP
- 真正区分网站的是域名，而不是 IP

## 三、DNS 应该怎么配置

在 Cloudflare 中，为站点增加一条 `A` 记录：

```text
Type: A
Name: echotype
IPv4 address: 64.83.35.146
Proxy status: Proxied
TTL: Auto
```

这样访问的就是：

```text
https://echotype.868601.xyz
```

如果以后还有别的网站，也继续指向同一台服务器：

```text
blog.868601.xyz   -> 64.83.35.146
admin.868601.xyz  -> 64.83.35.146
api.868601.xyz    -> 64.83.35.146
```

后端再由 Nginx 按域名分别转发。

## 四、服务器目录规划

为了方便以后扩展多站点，建议从一开始就把目录规划清楚：

```text
/home/web/html/
  echotype/
  blog/
  admin/

/home/web/conf.d/
  default.conf
  echotype.868601.xyz.conf
  blog.868601.xyz.conf
  admin.868601.xyz.conf
```

这个结构的好处是：

- 每个站点有自己的静态目录
- 每个站点有自己独立的 Nginx 配置
- 后续新增站点时不会互相影响

## 五、首次部署的核心步骤

### 1. 本地构建项目

```bash
npm install
npm run build
```

构建完成后会生成：

```text
dist/
```

### 2. 上传静态文件到服务器

将本地的 `dist/` 上传到服务器站点目录：

```bash
scp -r dist/* root@64.83.35.146:/home/web/html/echotype/
```

如果希望覆盖得更干净，可以先清空服务器目录：

```bash
ssh root@64.83.35.146 "mkdir -p /home/web/html/echotype && find /home/web/html/echotype -mindepth 1 -maxdepth 1 -exec rm -rf {} +"
scp -r dist/* root@64.83.35.146:/home/web/html/echotype/
```

## 六、Nginx 如何配置域名站点

这次部署中，Nginx 跑在 Docker 容器里，配置文件放在：

```text
/home/web/conf.d/echotype.868601.xyz.conf
```

HTTP + HTTPS 配置思路如下：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name echotype.868601.xyz;

    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name echotype.868601.xyz;

    ssl_certificate /etc/nginx/certs/echotype.868601.xyz_cert.pem;
    ssl_certificate_key /etc/nginx/certs/echotype.868601.xyz_key.pem;

    root /var/www/html/echotype;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

关键点：

- `try_files $uri $uri/ /index.html;` 适合前端路由项目
- `80` 端口用于跳转到 HTTPS
- `443` 端口使用正式证书提供服务

## 七、HTTPS 是怎么配上的

这次使用的是 `Let's Encrypt + Certbot`。

签发方式采用 `webroot`，这样不需要停掉现有 Nginx：

```bash
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /home/web/letsencrypt:/var/www/letsencrypt \
  certbot/certbot certonly \
  --webroot \
  -w /var/www/letsencrypt \
  -d echotype.868601.xyz \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  --key-type ecdsa \
  --force-renewal
```

证书签发后，将它复制到 Nginx 使用的证书目录：

```bash
cp /etc/letsencrypt/live/echotype.868601.xyz/fullchain.pem /home/web/certs/echotype.868601.xyz_cert.pem
cp /etc/letsencrypt/live/echotype.868601.xyz/privkey.pem /home/web/certs/echotype.868601.xyz_key.pem
```

最后重载 Nginx：

```bash
docker exec nginx nginx -t
docker exec nginx nginx -s reload
```

Cloudflare 的 SSL 模式建议设置为：

```text
Full (strict)
```

## 八、后续更新 EchoType 的方法

EchoType 是静态站，所以后续更新非常简单，不需要重新配 Nginx，也不需要重新配域名。

现在项目里已经加入了一键部署脚本。

直接执行：

```bash
npm run deploy:echotype
```

这条命令会自动完成：

1. 本地执行 `npm run build`
2. 清空服务器上的 `/home/web/html/echotype`
3. 将本地 `dist/` 上传到服务器

如果已经提前构建过，也可以跳过构建：

```bash
powershell -ExecutionPolicy Bypass -File ./scripts/deploy-echotype.ps1 -SkipBuild
```

## 九、这套方案适合什么项目

这套方案最适合：

- `Vite`
- `React`
- `Vue`
- 其他构建后只产出静态文件的前端项目

如果是下面这些项目，部署方式就会不同：

- Node.js 服务端项目
- Python / Django / Flask 项目
- Java / Go 服务项目
- Docker Compose 全栈项目

简单判断方法：

- 有 `dist/`、`build/` 输出目录，通常是静态站部署
- 需要 `npm run start`、`node server.js`、`python app.py`，通常是服务部署

## 十、做视频分享时建议强调的几个重点

建议重点讲清楚这 5 件事：

1. 静态站和服务端项目的部署方式不一样
2. 多个网站可以共用同一个服务器 IP
3. DNS 只负责把域名指向服务器，真正的网站分流由 Nginx 完成
4. HTTPS 证书建议用 Let's Encrypt 自动化处理
5. 更新静态站时，本质上只是“重新构建并覆盖上传 dist”

## 十一、安全建议

分享部署过程时，不要在视频或文档里暴露这些信息：

- 服务器密码
- SSH 私钥
- Cloudflare API Token
- GitHub Token
- 任何 `.env` 中的密钥

推荐做法：

- 所有密码和令牌只保存在本机或密码管理器中
- 仓库里只提交脚本和说明，不提交凭据
- 如果凭据曾在聊天、截图或录屏中出现，事后尽快更换

## 十二、最终上线结果

这次 EchoType 的最终访问地址是：

- `https://echotype.868601.xyz`

默认服务器 IP 入口仍然保留可访问，但正式分享和后续运营建议统一使用域名访问。
