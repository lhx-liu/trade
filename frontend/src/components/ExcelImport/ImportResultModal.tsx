import React from 'react';
import { Modal, Table, Typography, Space, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

/**
 * 导入结果接口
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
 * ImportResultModal 组件属性
 */
export interface ImportResultModalProps {
  visible: boolean;
  result: ImportResult | null;
  onClose: () => void;
}

/**
 * 导入结果弹窗组件
 * 显示导入结果摘要和错误列表
 */
const ImportResultModal: React.FC<ImportResultModalProps> = ({
  visible,
  result,
  onClose,
}) => {
  // 定义错误列表的表格列
  const columns: ColumnsType<{ row: number; message: string }> = [
    {
      title: '行号',
      dataIndex: 'row',
      key: 'row',
      width: 100,
      align: 'center',
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
    },
  ];

  if (!result) {
    return null;
  }

  const hasErrors = result.failureCount > 0;

  return (
    <Modal
      title="导入结果"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 导入结果摘要 */}
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <Text strong>成功导入：</Text>
            <Tag color="success">{result.successCount} 条</Tag>
          </Space>
          
          {hasErrors && (
            <Space>
              <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
              <Text strong>导入失败：</Text>
              <Tag color="error">{result.failureCount} 条</Tag>
            </Space>
          )}
        </Space>

        {/* 错误列表 */}
        {hasErrors && (
          <div>
            <Title level={5}>错误详情</Title>
            <Table
              columns={columns}
              dataSource={result.errors}
              rowKey={(record) => `${record.row}-${record.message}`}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 条错误`,
              }}
              size="small"
            />
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default ImportResultModal;
