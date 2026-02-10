/**
 * 类型定义文件
 */

// 联系人信息
export interface ContactInfo {
  name: string;      // 客户名
  email: string;     // 邮箱
  phone: string;     // 联系方式
}

// 订单实体
export interface Order {
  id?: number;
  orderDate: string;              // YYYY-MM-DD
  companyName: string;
  contactInfo: ContactInfo[];
  leadNumber: string;
  newOrOld?: string;              // "新客户" | "老客户"
  customerLevel?: string;         // "A" | "B" | "C"
  country?: string;
  continent?: string;
  source?: string;
  customerNature?: string;
  invoiceAmount?: number;
  paymentAmount?: number;
  businessOpportunity?: string;   // 客户商机（仅用于API传输，不存储在订单表）
  createdAt?: string;
  updatedAt?: string;
}

// 客户实体
export interface Customer {
  companyName: string;
  businessOpportunity?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 查询参数
export interface QueryParams {
  startDate?: string;
  endDate?: string;
  companyName?: string;
  customerName?: string;
  newOrOld?: string;
  customerLevel?: string;
  country?: string;
  continent?: string;
  source?: string;
  customerNature?: string;
  page?: number;
  pageSize?: number;
}

// 统计数据
export interface Statistics {
  totalOrders: number;
  totalCustomers: number;
  totalInvoiceAmount: number;
  totalPaymentAmount: number;
  byCountry: Record<string, number>;
  byContinent: Record<string, number>;
  byCustomerLevel: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    orderCount: number;
    invoiceAmount: number;
    paymentAmount: number;
  }>;
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
