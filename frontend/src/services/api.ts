import axios, { AxiosInstance, AxiosError } from 'axios';
import { message } from 'antd';
import type {
  Order,
  Customer,
  QueryParams,
  Statistics,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// 创建 Axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器（错误处理）
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<any>>) => {
    if (error.response) {
      // 服务器返回错误响应
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message.error(`验证错误: ${data.error || '请求参数有误'}`);
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后重试');
          break;
        default:
          message.error('请求失败');
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message.error('网络连接失败，请检查网络');
    } else {
      // 请求配置错误
      message.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

// 订单相关 API 方法
export const orderApi = {
  // 创建订单
  async createOrder(orderData: Order): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', orderData);
    return response.data.data!;
  },

  // 更新订单
  async updateOrder(id: number, orderData: Order): Promise<Order> {
    const response = await apiClient.put<ApiResponse<Order>>(`/orders/${id}`, orderData);
    return response.data.data!;
  },

  // 删除订单
  async deleteOrder(id: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/orders/${id}`);
    return response.data.data!.deleted;
  },

  // 查询订单列表
  async queryOrders(params: QueryParams): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<ApiResponse<{
      orders: Order[];
      total: number;
      page: number;
      pageSize: number;
    }>>('/orders', { params });
    
    const { orders, total, page, pageSize } = response.data.data!;
    return {
      items: orders,
      total,
      page,
      pageSize,
    };
  },

  // 获取单个订单
  async getOrderById(id: number): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data!;
  },
};

// 客户相关 API 方法
export const customerApi = {
  // 获取客户列表
  async getCustomers(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Customer>> {
    const response = await apiClient.get<ApiResponse<{
      customers: Customer[];
      total: number;
    }>>('/customers', { params: { page, pageSize } });
    
    const { customers, total } = response.data.data!;
    return {
      items: customers,
      total,
      page,
      pageSize,
    };
  },

  // 获取客户的所有订单
  async getCustomerOrders(
    companyName: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    customer: Customer;
    orders: PaginatedResponse<Order>;
  }> {
    const response = await apiClient.get<ApiResponse<{
      customer: Customer;
      orders: Order[];
      total: number;
    }>>(`/customers/${encodeURIComponent(companyName)}/orders`, {
      params: { page, pageSize },
    });
    
    const { customer, orders, total } = response.data.data!;
    return {
      customer,
      orders: {
        items: orders,
        total,
        page,
        pageSize,
      },
    };
  },

  // 更新客户商机
  async updateBusinessOpportunity(
    companyName: string,
    businessOpportunity: string
  ): Promise<Customer> {
    const response = await apiClient.put<ApiResponse<Customer>>(
      `/customers/${encodeURIComponent(companyName)}`,
      { businessOpportunity }
    );
    return response.data.data!;
  },
};

// 统计相关 API 方法
export const statisticsApi = {
  // 获取统计数据
  async getStatistics(startDate?: string, endDate?: string): Promise<Statistics> {
    const response = await apiClient.get<ApiResponse<Statistics>>('/statistics', {
      params: { startDate, endDate },
    });
    return response.data.data!;
  },

  // 导出 Excel 报表
  async exportExcel(startDate?: string, endDate?: string): Promise<Blob> {
    const response = await apiClient.get('/export', {
      params: { startDate, endDate, format: 'excel' },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default apiClient;
