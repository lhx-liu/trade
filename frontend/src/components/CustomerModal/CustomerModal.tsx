import React, { useEffect, useState } from 'react';
import { Modal, Table, Descriptions, Spin, Button, Space, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatCurrency } from '../../utils';
import OrderForm from '../OrderForm/OrderForm';
import type { Order, Customer } from '../../types';

interface CustomerModalProps {
  visible: boolean;
  onCancel: () => void;
  companyName: string;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  visible,
  onCancel,
  companyName,
}) => {
  const { state, actions } = useAppContext();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderFormVisible, setOrderFormVisible] = useState(false);

  // 加载客户订单数据
  const loadCustomerOrders = async (page: number = 1) => {
    if (!companyName) return;
    
    try {
      setLoading(true);
      const response = await actions.fetchCustomerOrders(companyName, page, pageSize);
      setCustomer(response.customer);
      setOrders(response.orders);
      setTotal(response.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load customer orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && companyName) {
      loadCustomerOrders(1);
    }
  }, [visible, companyName]);

  const handlePageChange = (page: number) => {
    loadCustomerOrders(page);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setOrderFormVisible(true);
  };

  const handleOrderFormCancel = () => {
    setOrderFormVisible(false);
    setEditingOrder(null);
  };

  const handleModalClose = () => {
    // 刷新主列表
    actions.fetchOrders(state.queryParams);
    onCancel();
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
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      width: 100,
    },
    {
      title: '公司名',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 150,
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
      title: '客户背调',
      dataIndex: 'customerBackgroundCheck',
      key: 'customerBackgroundCheck',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '成单产品',
      dataIndex: 'closedProduct',
      key: 'closedProduct',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '请购单号',
      dataIndex: 'purchaseOrderNumber',
      key: 'purchaseOrderNumber',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '线索编号',
      dataIndex: 'leadNumber',
      key: 'leadNumber',
      width: 120,
    },
    {
      title: '到款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date: string) => date ? formatDate(date) : '-',
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
      title: 'EXW货值',
      dataIndex: 'exwValue',
      key: 'exwValue',
      width: 120,
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
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
      title: '建档日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => date ? formatDate(date) : '-',
    },
    {
      title: '客户性质',
      dataIndex: 'customerNature',
      key: 'customerNature',
      width: 100,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
    },
    {
      title: '大洲',
      dataIndex: 'continent',
      key: 'continent',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditOrder(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={`客户订单 - ${companyName}`}
        open={visible}
        onCancel={handleModalClose}
        width={1400}
        footer={null}
      >
        <Spin spinning={loading}>
          {customer && (
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="公司名">
                {customer.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="客户商机">
                {customer.businessOpportunity || '-'}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: handlePageChange,
            }}
            scroll={{ x: 2500 }}
          />
        </Spin>
      </Modal>

      <OrderForm
        visible={orderFormVisible}
        onCancel={handleOrderFormCancel}
        editingOrder={editingOrder}
      />
    </>
  );
};

export default CustomerModal;
