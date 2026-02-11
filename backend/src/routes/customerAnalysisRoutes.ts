import { Router } from 'express';
import CustomerAnalysisController from '../controllers/CustomerAnalysisController';

const router = Router();

// 延迟初始化控制器
let controller: CustomerAnalysisController;

function getController(): CustomerAnalysisController {
  if (!controller) {
    controller = new CustomerAnalysisController();
  }
  return controller;
}

/**
 * GET /api/customer-analysis/customers - 获取客户列表及指标
 */
router.get('/customers', async (req, res) => {
  await getController().getCustomers(req, res);
});

/**
 * GET /api/customer-analysis/customers/:companyName - 获取单个客户详细分析
 */
router.get('/customers/:companyName', async (req, res) => {
  await getController().getCustomerDetail(req, res);
});

/**
 * GET /api/customer-analysis/customers/:companyName/top-products - 获取客户Top N成单产品
 */
router.get('/customers/:companyName/top-products', async (req, res) => {
  await getController().getTopProducts(req, res);
});

export default router;
