import axios from 'axios';
import { ProductRankingItem, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * 产品排行榜 API 服务
 */

interface ProductRankingResponse {
  products: ProductRankingItem[];
  total: number;
}

interface GetProductRankingParams {
  startDate?: string;
  endDate?: string;
}

/**
 * 获取产品销售排行榜
 * @param params 查询参数
 * @returns 产品排行榜数据
 */
export const getProductRanking = async (
  params?: GetProductRankingParams
): Promise<ProductRankingResponse> => {
  try {
    const response = await axios.get<ApiResponse<ProductRankingResponse>>(
      `${API_BASE_URL}/product-ranking`,
      { params }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '获取产品排行榜失败');
    }
  } catch (error: any) {
    console.error('获取产品排行榜失败:', error);
    throw error;
  }
};
