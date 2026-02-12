import React, { useState } from 'react';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import excelService from '../../services/excelService';

interface ExcelExportButtonProps {
  disabled?: boolean;
}

/**
 * Excel 导出按钮组件
 * 使用 Ant Design Button 组件实现订单数据导出功能
 */
const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({ disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      await excelService.exportOrders();
    } catch (error) {
      // 错误已在 excelService 中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      loading={loading}
      disabled={disabled}
      onClick={handleExport}
    >
      {loading ? '导出中...' : '导出 Excel'}
    </Button>
  );
};

export default ExcelExportButton;
