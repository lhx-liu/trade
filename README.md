# 外贸订单管理系统

一个用于录入和管理外贸订单信息的业务系统。

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- SQLite3 (better-sqlite3)
- Jest + fast-check (测试)

### 前端
- React 18 + TypeScript
- Ant Design
- Vite
- React Query

## 项目结构

```
.
├── backend/          # 后端代码
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # 前端代码
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 开发指南

### 后端开发

```bash
cd backend
npm install
npm run dev
```

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

## 生产部署

### 方式一：使用部署脚本（推荐）

```bash
# 1. 构建前后端
deploy.bat

# 2. 启动服务器
start-production.bat
```

### 方式二：手动部署

```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 构建后端
cd ../backend
npm run build

# 3. 启动生产服务器
set NODE_ENV=production
npm start
```

部署完成后，访问 http://localhost:5000 即可使用系统。

### 部署说明

- 生产环境下，Express 会自动托管前端静态文件
- 前端打包文件位于 `frontend/dist`
- 后端会从 `../frontend/dist` 读取前端文件
- 所有 API 请求通过 `/api` 路径访问
- 支持前端路由（SPA）

## 功能特性

- 订单录入和管理
- 客户信息自动管理（通过公司名关联）
- 高级查询界面（9个查询条件）
- 数据统计与报表
- Excel 报表导出

## 许可证

ISC
