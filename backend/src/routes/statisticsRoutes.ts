import { Router, Request, Response } from 'express';
import StatisticsService from '../services/StatisticsService';
import { ApiResponse, Statistics } from '../types';

const router = Router();

// 延迟初始化服务
let statisticsService: StatisticsService;

function getStatisticsService(): StatisticsService {
  if (!statisticsService) {
    statisticsService = new StatisticsService();
  }
  return statisticsService;
}

/**
 * GET /api/statistics - 获取统计数据
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      const response: ApiResponse<null> = {
        success: false,
        message: '参数验证失败',
        error: 'startDate和endDate为必填参数',
      };

      return res.status(400).json(response);
    }

    const statistics = await getStatisticsService().calculateStatistics(startDate, endDate);

    const response: ApiResponse<Statistics> = {
      success: true,
      message: '查询成功',
      data: statistics,
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: '查询失败',
      error: error.message,
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/export - 导出Excel报表
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      const response: ApiResponse<null> = {
        success: false,
        message: '参数验证失败',
        error: 'startDate和endDate为必填参数',
      };

      return res.status(400).json(response);
    }

    const buffer = await getStatisticsService().generateExcelReport(startDate, endDate);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${startDate}_${endDate}.xlsx`);
    res.send(buffer);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: '导出失败',
      error: error.message,
    };

    res.status(500).json(response);
  }
});

export default router;
