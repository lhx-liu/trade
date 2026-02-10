import React, { useState } from 'react';
import { Table, Button, Space, Modal, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatCurrency } from '../../utils';
import type { Order } from '../../types';

const { confirm } = Modal;

interface OrderTableProps {
  onEdit: (order: Order) => void;
  onCompanyClick: (companyName: string) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ onEdit, onCompanyClick }) => {
  const { state, actions } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleDelete = (order: Order) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除订单 "${order.leadNumber}" 吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (order.id) {
          await actions.deleteOrder(order.id);
          // 刷新订单列表
          await actions.fetchOrders({
            ...state.queryParams,
            page: currentPage,
            pageSize,
          });
        }
      },
    });
  };

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) {
      setPageSize(newPageSize);
    }
    actions.fetchOrders({
      ...state.queryParams,
      page,
      pageSize: newPageSize || pageSize,
    });
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      fixed: 'left',
      render: (date: string) => formatDate(date),
    },
    {
      title: '公司名',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 150,
      fixed: 'left',
      render: (companyName: string) => (
        <a onClick={() => onCompanyClick(companyName)}>{companyName}</a>
      ),
    },
    {
      title: '客户信息',
      dataIndex: 'contactInfo',
      key: 'contactInfo',
      width: 200,
      render: (contactInfo: any[]) => {
        if (!contactInfo || contactInfo.length === 0) return '-';
        return (
          <div>
            {contactInfo.map((contact, index) => (
              <div key={index} style={{ fontSize: '12px' }}>
                {contact.name} ({contact.email})
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: '线索编号',
      dataIndex: 'leadNumber',
      key: 'leadNumber',
      width: 120,
    },
    {
      title: '客户商机',
      dataIndex: 'businessOpportunity',
      key: 'businessOpportunity',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '新老客户',
      dataIndex: 'newOrOld',
      key: 'newOrOld',
      width: 100,
      render: (value: string) => {
        if (!value) return '-';
        return <Tag color={value === '新客户' ? 'green' : 'blue'}>{value}</Tag>;
      },
    },
    {
      title: '客户等级',
      dataIndex: 'customerLevel',
      key: 'customerLevel',
      width: 100,
      render: (level: string) => {
        if (!level) return '-';
        const colors: Record<string, string> = { A: 'red', B: 'orange', C: 'default' };
        return <Tag color={colors[level]}>{level}</Tag>;
      },
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      width: 100,
    },
    {
      title: '大洲',
      dataIndex: 'continent',
      key: 'continent',
      width: 100,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
    },
    {
      title: '客户性质',
      dataIndex: 'customerNature',
      key: 'customerNature',
      width: 100,
    },
    {
      title: '发票金额',
      dataIndex: 'invoiceAmount',
      key: 'invoiceAmount',
      width: 120,
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '到款金额',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      width: 120,
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={state.orders}
      rowKey="id"
      loading={state.loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: state.totalOrders,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条记录`,
        pageSizeOptions: ['10', '20', '50', '100'],
        onChange: handlePageChange,
      }}
      scroll={{ x: 2000 }}
    />
  );
};

export default OrderTable;
