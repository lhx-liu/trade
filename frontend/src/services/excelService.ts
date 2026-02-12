import apiClient from './api';
import { message } from 'antd';

/**
 * Excel 导入结果接口
 */
export interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

/**
 * Excel 导入导出服务
 */
export const excelService = {
  /**
   * 导入订单数据
   * @param file - Excel 文件
   * @returns 导入结果
   */
  async importOrders(file: File): Promise<ImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: ImportResult;
      }>('/orders/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        message.success(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      // 错误已在拦截器中处理
      throw error;
    }
  },

  /**
   * 导出订单数据为 Excel 文件
   */
  async exportOrders(): Promise<void> {
    try {
      const response = await apiClient.get('/orders/export', {
        responseType: 'blob',
      });

      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let filename = '订单数据.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          // 解码 URL 编码的文件名
          filename = decodeURIComponent(filename);
        }
      }

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // 清理
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch (error: any) {
      // 错误已在拦截器中处理
      throw error;
    }
  },
};

export default excelService;
