import { Router, Request, Response } from 'express';
import multer from 'multer';
import OrderService from '../services/OrderService';
import { ExcelImportService } from '../services/excelImportService';
import { ExcelExportService } from '../services/excelExportService';
import { ApiResponse, Order, QueryParams } from '../types';

const router = Router();

// 延迟初始化服务
let orderService: OrderService;
let excelImportService: ExcelImportService;
let excelExportService: ExcelExportService;

function getOrderService(): OrderService {
  if (!orderService) {
    orderService = new OrderService();
  }
  return orderService;
}

function getExcelImportService(): ExcelImportService {
  if (!excelImportService) {
    excelImportService = new ExcelImportService();
  }
  return excelImportService;
}

function getExcelExportService(): ExcelExportService {
  if (!excelExportService) {
    excelExportService = new ExcelExportService();
  }
  return excelExportService;
}

// 配置 multer 用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 验证文件类型
    const allowedExtensions = ['.xlsx', '.xls'];
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedExtensions.includes(fileExtension) || allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，请上传 .xlsx 或 .xls 文件'));
    }
  }
});

/**
 * POST /api/orders/import - 导入 Excel 文件
 */
router.post('/import', (req: Request, res: Response, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // 处理 multer 错误
      if (err.code === 'LIMIT_FILE_SIZE') {
        const response: ApiResponse<null> = {
          success: false,
          message: '文件大小超过 10MB 限制',
          error: err.message,
        };
        return res.status(400).json(response);
      }

      // 处理文件类型错误
      if (err.message && err.message.includes('不支持的文件格式')) {
        const response: ApiResponse<null> = {
          success: false,
          message: err.message,
          error: '文件类型验证失败',
        };
        return res.status(400).json(response);
      }

      // 其他 multer 错误
      const response: ApiResponse<null> = {
        success: false,
        message: '文件上传失败',
        error: err.message,
      };
      return res.status(400).json(response);
    }

    // 继续处理请求
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    // 检查文件是否存在
    if (!req.file) {
      const response: ApiResponse<null> = {
        success: false,
        message: '请上传文件',
        error: '未找到上传的文件',
      };
      return res.status(400).json(response);
    }

    // 调用 ExcelImportService 处理导入
    const result = await getExcelImportService().importOrders(req.file.buffer);

    // 返回导入结果
    const response: ApiResponse<typeof result> = {
      success: true,
      message: `导入完成：成功 ${result.successCount} 条，失败 ${result.failureCount} 条`,
      data: result,
    };

    res.status(200).json(response);
  } catch (error: any) {
    // 其他错误
    const response: ApiResponse<null> = {
      success: false,
      message: '导入失败',
      error: error.message,
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/orders/export - 导出订单为 Excel 文件
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    // 调用 ExcelExportService 生成文件
    const buffer = await getExcelExportService().exportOrders();

    // 生成文件名
    const fileName = ExcelExportService.generateFileName();
    
    // Encode filename for Content-Disposition header (RFC 5987)
    const encodedFileName = encodeURIComponent(fileName);

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);

    // 返回文件流
    res.send(buffer);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: 'Excel 文件生成失败',
      error: error.message,
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/orders - 创建订单
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const orderData: Order = req.body;
    const order = await getOrderService().createOrder(orderData);

    const response: ApiResponse<Order> = {
      success: true,
      message: '订单创建成功',
      data: order,
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: '订单创建失败',
      error: error.message,
    };

    res.status(400).json(response);
  }
});

/**
 * GET /api/orders - 查询订单列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params: QueryParams = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      companyName: req.query.companyName as string,
      customerName: req.query.customerName as string,
      newOrOld: req.query.newOrOld as string,
      customerLevel: req.query.customerLevel as string,
      country: req.query.country as string,
      continent: req.query.continent as string,
      source: req.query.source as string,
      customerNature: req.query.customerNature as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
    };

    const result = await getOrderService().queryOrders(params);

    const response: ApiResponse<typeof result> = {
      success: true,
      message: '查询成功',
      data: result,
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
 * GET /api/orders/:id - 获取单个订单
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const order = await getOrderService().getOrderById(id);

    if (!order) {
      const response: ApiResponse<null> = {
        success: false,
        message: '订单不存在',
        error: '未找到指定的订单',
      };

      return res.status(404).json(response);
    }

    const response: ApiResponse<Order> = {
      success: true,
      message: '查询成功',
      data: order,
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
 * PUT /api/orders/:id - 更新订单
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const orderData: Order = req.body;
    const order = await getOrderService().updateOrder(id, orderData);

    const response: ApiResponse<Order> = {
      success: true,
      message: '订单更新成功',
      data: order,
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: '订单更新失败',
      error: error.message,
    };

    const statusCode = error.message === '订单不存在' ? 404 : 400;
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /api/orders/:id - 删除订单
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await getOrderService().deleteOrder(id);

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      message: '订单删除成功',
      data: { deleted },
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: '订单删除失败',
      error: error.message,
    };

    const statusCode = error.message === '订单不存在' ? 404 : 400;
    res.status(statusCode).json(response);
  }
});

export default router;
