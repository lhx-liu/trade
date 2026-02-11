import apiClient from './api';
import type {
  CustomerMetrics,
  CustomerDetailAnalysis,
  FilterCriteria,
} from '../types/customerAnalysis';

/**
 * 客户分析相关 API 方法
 */
export const customerAnalysisApi = {
  /**
   * 获取客户列表及指标
   */
  async getCustomers(params: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    country?: string;
    customerLevel?: string;
    customerType?: string;
  }): Promise<{
    customers: CustomerMetrics[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        customers: CustomerMetrics[];
        total: number;
      };
    }>('/customer-analysis/customers', { params });

    const { customers, total } = response.data.data;
    return {
      customers,
      total,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
    };
  },

  /**
   * 获取单个客户详细分析
   */
  async getCustomerDetail(companyName: string): Promise<CustomerDetailAnalysis> {
    const response = await apiClient.get<{
      success: boolean;
      data: CustomerDetailAnalysis;
    }>(`/customer-analysis/customers/${encodeURIComponent(companyName)}`);

    return response.data.data;
  },

  /**
   * 获取客户的Top N成单产品
   */
  async getTopProducts(companyName: string, limit: number = 5): Promise<{
    products: Array<{ productName: string; count: number; rank: number }>;
    totalCount: number;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        products: Array<{ productName: string; count: number; rank: number }>;
        totalCount: number;
      };
    }>(`/customer-analysis/customers/${encodeURIComponent(companyName)}/top-products`, {
      params: { limit },
    });

    return response.data.data;
  },
};
