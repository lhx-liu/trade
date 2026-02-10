import { Request, Response } from 'express';
import CustomerAnalysisService from '../services/CustomerAnalysisService';
import { CustomerAnalysisQuery } from '../types';

/**
 * CustomerAnalysisController - 客户分析控制器
 * 处理客户行为分析相关的HTTP请求
 */
class CustomerAnalysisController {
  private service: CustomerAnalysisService;

  constructor() {
    this.service = new CustomerAnalysisService();
  }

  /**
   * 获取客户列表及指标
   * GET /api/customer-analysis/customers
   */
  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      // 参数验证
      const { page, pageSize, sortBy, sortOrder, country, customerLevel, customerType } = req.query;

      // 验证页码
      if (page && (isNaN(Number(page)) || Number(page) < 1)) {
        res.status(400).json({
          success: false,
          message: '页码必须是大于0的整数',
        });
        return;
      }

      // 验证每页数量
      if (pageSize && (isNaN(Number(pageSize)) || Number(pageSize) < 1)) {
        res.status(400).json({
          success: false,
          message: '每页数量必须是大于0的整数',
        });
        return;
      }

      // 验证排序方向
      if (sortOrder && sortOrder !== 'asc' && sortOrder !== 'desc') {
        res.status(400).json({
          success: false,
          message: '排序方向必须是 asc 或 desc',
        });
        return;
      }

      // 构建查询参数
      const query: CustomerAnalysisQuery = {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        country: country as string,
        customerLevel: customerLevel as string,
        customerType: customerType as string,
      };

      // 调用服务层
      const result = await this.service.getCustomerMetrics(query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('获取客户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取客户列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * 获取单个客户详细分析
   * GET /api/customer-analysis/customers/:companyName
   */
  async getCustomerDetail(req: Request, res: Response): Promise<void> {
    try {
      const { companyName } = req.params;

      // 参数验证
      if (!companyName) {
        res.status(400).json({
          success: false,
          message: '公司名称不能为空',
        });
        return;
      }

      // 调用服务层
      const result = await this.service.getCustomerDetail(decodeURIComponent(companyName));

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('获取客户详情失败:', error);
      
      if (error.message === '客户不存在或没有订单') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '获取客户详情失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default CustomerAnalysisController;
