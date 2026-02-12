import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import excelService, { ImportResult } from '../../services/excelService';
import ImportResultModal from './ImportResultModal';

interface ExcelImportButtonProps {
  onImportSuccess?: () => void;
  onImportError?: (error: string) => void;
}

/**
 * Excel 导入按钮组件
 * 使用 Ant Design Upload 组件实现文件上传和导入功能
 */
const ExcelImportButton: React.FC<ExcelImportButtonProps> = ({
  onImportSuccess,
  onImportError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      // 验证文件类型
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');

      if (!isExcel) {
        message.error('不支持的文件格式，请上传 .xlsx 或 .xls 文件');
        onImportError?.('不支持的文件格式');
        return Upload.LIST_IGNORE;
      }

      // 验证文件大小（10MB）
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小超过 10MB 限制');
        onImportError?.('文件大小超过限制');
        return Upload.LIST_IGNORE;
      }

      // 开始上传
      handleUpload(file);
      return false; // 阻止自动上传
    },
  };

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      const result: ImportResult = await excelService.importOrders(file);

      // 保存导入结果并显示弹窗
      setImportResult(result);
      setModalVisible(true);

      // 调用成功回调
      onImportSuccess?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '导入失败，请稍后重试';
      message.error(errorMessage);
      onImportError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setImportResult(null);
  };

  return (
    <>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          {uploading ? '导入中...' : '导入 Excel'}
        </Button>
      </Upload>

      <ImportResultModal
        visible={modalVisible}
        result={importResult}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default ExcelImportButton;
