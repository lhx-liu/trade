import React, { useEffect } from 'react';
import { Form, Input, DatePicker, Select, InputNumber, Modal, Spin } from 'antd';
import dayjs from 'dayjs';
import ContactInfoInput from './ContactInfoInput';
import { useAppContext } from '../../context/AppContext';
import { validateNumber } from '../../utils';
import type { Order } from '../../types';

const { Option } = Select;

interface OrderFormProps {
  visible: boolean;
  onCancel: () => void;
  editingOrder?: Order | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ visible, onCancel, editingOrder }) => {
  const [form] = Form.useForm();
  const { state, actions } = useAppContext();
  const isEditing = !!editingOrder;

  // 当编辑订单时，填充表单
  useEffect(() => {
    if (visible && editingOrder) {
      // 加载客户商机信息
      const loadCustomerInfo = async () => {
        try {
          // 先填充订单基本信息
          form.setFieldsValue({
            ...editingOrder,
            orderDate: editingOrder.orderDate ? dayjs(editingOrder.orderDate) : null,
          });

          // 异步加载客户商机信息
          const customerData = await actions.fetchCustomerOrders(editingOrder.companyName);
          if (customerData?.customer?.businessOpportunity) {
            form.setFieldsValue({
              businessOpportunity: customerData.customer.businessOpportunity,
            });
          }
        } catch (error) {
          console.error('Failed to load customer info:', error);
          // 即使加载失败，也保留订单基本信息
        }
      };
      loadCustomerInfo();
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, editingOrder, form, actions]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 提取商机信息
      const { businessOpportunity, ...orderFields } = values;
      
      // 转换日期格式
      const orderData: Order = {
        ...orderFields,
        orderDate: values.orderDate ? dayjs(values.orderDate).format('YYYY-MM-DD') : '',
      };

      // 将商机信息作为额外参数传递
      const orderDataWithOpportunity = {
        ...orderData,
        businessOpportunity,
      };

      if (isEditing && editingOrder?.id) {
        await actions.updateOrder(editingOrder.id, orderDataWithOpportunity);
      } else {
        await actions.createOrder(orderDataWithOpportunity);
      }

      form.resetFields();
      onCancel();
      
      // 刷新订单列表
      await actions.fetchOrders(state.queryParams);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={isEditing ? '编辑订单' : '新建订单'}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={800}
      confirmLoading={state.loading}
      destroyOnClose
    >
      <Spin spinning={state.loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            contactInfo: [{ name: '', email: '', phone: '' }],
          }}
        >
          {/* 必填字段 */}
          <Form.Item
            label="订单日期"
            name="orderDate"
            rules={[{ required: true, message: '请选择订单日期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="公司名"
            name="companyName"
            rules={[
              { required: true, message: '请输入公司名' },
              { max: 100, message: '公司名不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入公司名" />
          </Form.Item>

          <Form.Item label="客户信息" required>
            <ContactInfoInput />
          </Form.Item>

          <Form.Item
            label="线索编号"
            name="leadNumber"
            rules={[
              { required: true, message: '请输入线索编号' },
              { max: 50, message: '线索编号不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入线索编号" />
          </Form.Item>

          {/* 可选字段 */}
          <Form.Item label="新老客户" name="newOrOld">
            <Select placeholder="请选择新老客户" allowClear>
              <Option value="新客户">新客户</Option>
              <Option value="老客户">老客户</Option>
            </Select>
          </Form.Item>

          <Form.Item label="客户等级" name="customerLevel">
            <Select placeholder="请选择客户等级" allowClear>
              <Option value="A">A</Option>
              <Option value="B">B</Option>
              <Option value="C">C</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="国家"
            name="country"
            rules={[{ max: 50, message: '国家不能超过50个字符' }]}
          >
            <Input placeholder="请输入国家" />
          </Form.Item>

          <Form.Item
            label="大洲"
            name="continent"
            rules={[{ max: 50, message: '大洲不能超过50个字符' }]}
          >
            <Input placeholder="请输入大洲" />
          </Form.Item>

          <Form.Item
            label="来源"
            name="source"
            rules={[{ max: 50, message: '来源不能超过50个字符' }]}
          >
            <Input placeholder="请输入来源" />
          </Form.Item>

          <Form.Item
            label="客户性质"
            name="customerNature"
            rules={[{ max: 50, message: '客户性质不能超过50个字符' }]}
          >
            <Input placeholder="请输入客户性质" />
          </Form.Item>

          <Form.Item
            label="发票金额"
            name="invoiceAmount"
            rules={[
              {
                validator: (_, value) => {
                  if (validateNumber(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('请输入有效的金额'));
                },
              },
            ]}
          >
            <InputNumber
              placeholder="请输入发票金额"
              style={{ width: '100%' }}
              min={0}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            label="到款金额"
            name="paymentAmount"
            rules={[
              {
                validator: (_, value) => {
                  if (validateNumber(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('请输入有效的金额'));
                },
              },
            ]}
          >
            <InputNumber
              placeholder="请输入到款金额"
              style={{ width: '100%' }}
              min={0}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            label="客户商机"
            name="businessOpportunity"
            rules={[
              { max: 500, message: '客户商机不能超过500个字符' }
            ]}
          >
            <Input.TextArea
              placeholder="请输入客户商机信息"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default OrderForm;
