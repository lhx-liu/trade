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

## 功能特性

- 订单录入和管理
- 客户信息自动管理（通过公司名关联）
- 高级查询界面（9个查询条件）
- 数据统计与报表
- Excel 报表导出

## 许可证

ISC
