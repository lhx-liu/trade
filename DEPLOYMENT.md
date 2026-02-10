# 外贸订单管理系统 - 部署文档

## 系统要求

- Node.js 18+ 
- npm 或 yarn
- Windows/Linux/macOS

## 开发环境部署

### 1. 后端部署

```bash
cd backend
npm install
npm run dev
```

后端服务将运行在 http://localhost:5000

### 2. 前端部署

```bash
cd frontend
npm install
npm run dev
```

前端服务将运行在 http://localhost:3000

## 生产环境部署

### 1. 构建后端

```bash
cd backend
npm install
npm run build
```

### 2. 构建前端

```bash
cd frontend
npm install
npm run build
```

构建产物将生成在 `frontend/dist` 目录

### 3. 启动生产服务

#### 后端

```bash
cd backend
NODE_ENV=production node dist/server.js
```

或使用 PM2：

```bash
pm2 start dist/server.js --name foreign-trade-api
```

#### 前端

将 `frontend/dist` 目录部署到静态文件服务器（如 Nginx）

## 环境变量配置

### 后端环境变量 (.env)

```
NODE_ENV=development
PORT=5000
DATABASE_PATH=./orders.db
CORS_ORIGIN=http://localhost:3000
```

### 前端环境变量 (.env)

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 数据库

系统使用 SQLite 数据库，数据库文件为 `orders.db`，首次启动时会自动创建。

## 功能特性

### 已实现功能

✅ 订单管理（创建、编辑、删除、查询）
✅ 客户信息自动管理
✅ 9个查询条件的高级搜索
✅ 统计报表和图表展示
✅ Excel 报表导出
✅ 响应式界面设计

### 核心技术栈

**后端**
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- Winston (日志)
- ExcelJS (报表导出)

**前端**
- React 18 + TypeScript
- Ant Design 5
- Ant Design Charts
- Axios
- React Router
- dayjs

## 访问系统

开发环境：http://localhost:3000
生产环境：根据实际部署配置

## 默认功能

- 订单列表页面：查看、搜索、编辑、删除订单
- 统计报表页面：查看统计数据和图表
- 自动查询当年数据
- 支持防抖搜索（500ms）
- 分页显示（默认20条/页）

## 故障排查

### 后端无法启动

1. 检查端口5000是否被占用
2. 检查数据库文件权限
3. 查看 error.log 日志文件

### 前端无法连接后端

1. 确认后端服务已启动
2. 检查 CORS 配置
3. 检查 API_BASE_URL 配置

## 技术支持

如有问题，请查看日志文件：
- 后端日志：`backend/error.log` 和 `backend/combined.log`
- 前端控制台：浏览器开发者工具
