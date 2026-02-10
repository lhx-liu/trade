import { Router, Request, Response } from 'express';
import OrderService from '../services/OrderService';
import { ApiResponse, Order, QueryParams } from '../types';

const router = Router();

// 延迟初始化服务
let orderService: OrderService;

function getOrderService(): OrderService {
  if (!orderService) {
    orderService = new OrderService();
  }
  return orderService;
}

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
