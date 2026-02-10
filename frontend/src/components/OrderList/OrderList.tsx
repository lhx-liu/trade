import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import QueryForm from './QueryForm';
import OrderTable from './OrderTable';
import OrderForm from '../OrderForm/OrderForm';
import CustomerModal from '../CustomerModal/CustomerModal';
import type { Order } from '../../types';

const OrderList: React.FC = () => {
  const [orderFormVisible, setOrderFormVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');

  // 打开新建订单表单
  const handleCreateOrder = () => {
    setEditingOrder(null);
    setOrderFormVisible(true);
  };

  // 打开编辑订单表单
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setOrderFormVisible(true);
  };

  // 关闭订单表单
  const handleOrderFormCancel = () => {
    setOrderFormVisible(false);
    setEditingOrder(null);
  };

  // 打开客户订单弹窗
  const handleCompanyClick = (companyName: string) => {
    setSelectedCompanyName(companyName);
    setCustomerModalVisible(true);
  };

  // 关闭客户订单弹窗
  const handleCustomerModalCancel = () => {
    setCustomerModalVisible(false);
    setSelectedCompanyName('');
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateOrder}
        >
          新建订单
        </Button>
      </Space>

      <QueryForm />

      <OrderTable
        onEdit={handleEditOrder}
        onCompanyClick={handleCompanyClick}
      />

      <OrderForm
        visible={orderFormVisible}
        onCancel={handleOrderFormCancel}
        editingOrder={editingOrder}
      />

      <CustomerModal
        visible={customerModalVisible}
        onCancel={handleCustomerModalCancel}
        companyName={selectedCompanyName}
      />
    </div>
  );
};

export default OrderList;
