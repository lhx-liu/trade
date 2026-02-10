import express, { Express } from 'express';
import cors from 'cors';
import DatabaseManager from './database/DatabaseManager';
import orderRoutes from './routes/orderRoutes';
import customerRoutes from './routes/customerRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// 配置CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// 配置JSON body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API路由
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/statistics', statisticsRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 初始化数据库并启动服务器
async function startServer() {
  try {
    // 初始化数据库
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    console.log('数据库初始化成功');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  const dbManager = DatabaseManager.getInstance();
  dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  const dbManager = DatabaseManager.getInstance();
  dbManager.close();
  process.exit(0);
});

// 启动服务器
startServer();

export default app;
