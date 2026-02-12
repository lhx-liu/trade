import { Router } from 'express';
import ProductRankingController from '../controllers/ProductRankingController';

const router = Router();

// 延迟初始化控制器
let controller: ProductRankingController;

function getController(): ProductRankingController {
  if (!controller) {
    controller = new ProductRankingController();
  }
  return controller;
}

/**
 * 产品排行榜路由
 */

// 获取产品销售排行榜
router.get('/', async (req, res) => {
  await getController().getProductRanking(req, res);
});

export default router;
