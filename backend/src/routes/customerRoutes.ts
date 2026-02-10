import { Router, Request, Response } from 'express';
import CustomerService from '../services/CustomerService';
import { ApiResponse, Customer } from '../types';

const router = Router();

// 延迟初始化服务
let customerService: CustomerService;

function getCustomerService(): CustomerService {
  if (!customerService) {
    customerService = new CustomerService();
  }
  return customerService;
}

/**
 * GET /api/customers - 查询客户列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;

    const result = await getCustomerService().getCustomers(page, pageSize);

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
 * GET /api/customers/:companyName/orders - 获取客户的所有订单
 */
router.get('/:companyName/orders', async (req: Request, res: Response) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;

    const result = await getCustomerService().getCustomerOrders(companyName, page, pageSize);

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

    const statusCode = error.message === '客户不存在' ? 404 : 500;
    res.status(statusCode).json(response);
  }
});

/**
 * PUT /api/customers/:companyName - 更新客户商机
 */
router.put('/:companyName', async (req: Request, res: Response) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName);
    const { businessOpportunity } = req.body;

    if (!businessOpportunity && businessOpportunity !== '') {
      const response: ApiResponse<null> = {
        success: false,
        message: '参数验证失败',
        error: 'businessOpportunity字段为必填',
      };

      return res.status(400).json(response);
    }

    const customer = await getCustomerService().updateBusinessOpportunity(companyName, businessOpportunity);

    const response: ApiResponse<Customer> = {
      success: true,
      message: '客户商机更新成功',
      data: customer,
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      message: '更新失败',
      error: error.message,
    };

    const statusCode = error.message === '客户不存在' ? 404 : 400;
    res.status(statusCode).json(response);
  }
});

export default router;
