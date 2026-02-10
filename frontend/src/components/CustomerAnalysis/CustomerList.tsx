import React from 'react';
import { Table, Card } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { CustomerMetrics, PaginationConfig } from '../../types/customerAnalysis';
import { formatCurrency } from '../../utils/formatters';

interface CustomerListProps {
  customers: CustomerMetrics[];
  loading: boolean;
  pagination: PaginationConfig;
  onPageChange: (page: number, pageSize: number) => void;
  onSort: (field: string, order: 'ascend' | 'descend' | null) => void;
  onCustomerClick: (companyName: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading,
  pagination,
  onPageChange,
  onSort,
  onCustomerClick,
}) => {
  // 定义表格列
  const columns: ColumnsType<CustomerMetrics> = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      fixed: 'left',
      width: 200,
      render: (text: string) => (
        <a onClick={() => onCustomerClick(text)}>{text}</a>
      ),
    },
    {
      title: '订单总数',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      width: 120,
      sorter: true,
      align: 'right',
    },
    {
      title: '月均订单数',
      dataIndex: 'monthlyOrderFrequency',
      key: 'monthlyOrderFrequency',
      width: 130,
      sorter: true,
      align: 'right',
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '平均订单金额',
      dataIndex: 'averageOrderAmount',
      key: 'averageOrderAmount',
      width: 150,
      sorter: true,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '最近订单日期',
      dataIndex: 'lastOrderDate',
      key: 'lastOrderDate',
      width: 140,
      sorter: true,
    },
    {
      title: '首次订单日期',
      dataIndex: 'firstOrderDate',
      key: 'firstOrderDate',
      width: 140,
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      width: 120,
    },
    {
      title: '客户等级',
      dataIndex: 'customerLevel',
      key: 'customerLevel',
      width: 100,
      align: 'center',
    },
    {
      title: '客户类型',
      dataIndex: 'customerType',
      key: 'customerType',
      width: 100,
      align: 'center',
    },
  ];

  // 处理表格变化（排序、分页）
  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    _filters: any,
    sorter: any
  ) => {
    // 处理分页
    if (paginationConfig.current && paginationConfig.pageSize) {
      onPageChange(paginationConfig.current, paginationConfig.pageSize);
    }

    // 处理排序
    if (sorter.field && sorter.order) {
      onSort(sorter.field as string, sorter.order);
    } else if (!sorter.order) {
      onSort('', null);
    }
  };

  return (
    <Card>
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="companyName"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个客户`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default CustomerList;
