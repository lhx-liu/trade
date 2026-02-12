import { Request, Response } from 'express';
import ProductRankingService from '../services/ProductRankingService';
import { ProductRankingQuery } from '../types';

/**
 * ProductRankingController - 产品排行榜控制器
 * 处理产品销售排行榜相关的HTTP请求
 */
class ProductRankingController {
  private service: ProductRankingService;

  constructor() {
    this.service = new ProductRankingService();
  }

  /**
   * 获取产品销售排行榜
   * GET /api/product-ranking
   */
  async getProductRanking(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      // 验证日期格式
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      if (startDate && !dateRegex.test(startDate as string)) {
        res.status(400).json({
          success: false,
          message: '开始日期格式错误，应为 YYYY-MM-DD',
        });
        return;
      }

      if (endDate && !dateRegex.test(endDate as string)) {
        res.status(400).json({
          success: false,
          message: '结束日期格式错误，应为 YYYY-MM-DD',
        });
        return;
      }

      // 验证日期范围有效性
      if (startDate && endDate && new Date(startDate as string) > new Date(endDate as string)) {
        res.status(400).json({
          success: false,
          message: '开始日期不能晚于结束日期',
        });
        return;
      }

      // 构建查询参数
      const query: ProductRankingQuery = {
        startDate: startDate as string,
        endDate: endDate as string,
      };

      // 调用服务层
      const result = await this.service.getProductRanking(query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('获取产品排行榜失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品排行榜失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default ProductRankingController;
