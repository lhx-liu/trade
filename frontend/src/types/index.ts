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
  businessOpportunity?: string;   // 客户商机（从客户表关联查询）
  // 新增字段
  customerBackgroundCheck?: string; // 客户背调
  closedProduct: string;            // 成单产品（必填）
  paymentDate?: string;             // 到款日期 (YYYY-MM-DD)
  exwValue?: number;                // EXW货值
  purchaseOrderNumber?: string;     // 请购单号
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

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
