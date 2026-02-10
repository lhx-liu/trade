import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import winston from 'winston';

// 配置日志记录器
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // 根据错误类型返回适当的响应
  let statusCode = 500;
  let message = '服务器内部错误';

  if (err.message.includes('必填字段') || err.message.includes('格式无效') || err.message.includes('必须是有效数字')) {
    statusCode = 400;
    message = '参数验证失败';
  } else if (err.message.includes('不存在')) {
    statusCode = 404;
    message = '资源不存在';
  }

  const response: ApiResponse<null> = {
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? '请稍后重试' : err.message,
  };

  res.status(statusCode).json(response);
}

/**
 * 404错误处理
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    message: '资源不存在',
    error: `路径 ${req.path} 不存在`,
  };

  res.status(404).json(response);
}
