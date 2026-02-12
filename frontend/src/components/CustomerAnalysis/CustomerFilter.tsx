import React from 'react';
import { Form, Select, Button, Space, Card, Input } from 'antd';
import { FilterCriteria } from '../../types/customerAnalysis';

const { Option } = Select;

interface CustomerFilterProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  onReset: () => void;
}

const CustomerFilter: React.FC<CustomerFilterProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [form] = Form.useForm();

  // 处理筛选条件变更
  const handleValuesChange = (_: any, allValues: FilterCriteria) => {
    onFilterChange(allValues);
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="inline"
        initialValues={filters}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="country" label="国家">
          <Input
            placeholder="请输入国家"
            allowClear
            style={{ width: 150 }}
          />
        </Form.Item>

        <Form.Item name="customerLevel" label="客户等级">
          <Select
            placeholder="请选择等级"
            allowClear
            style={{ width: 120 }}
          >
            <Option value="A">A级</Option>
            <Option value="B">B级</Option>
            <Option value="C">C级</Option>
          </Select>
        </Form.Item>

        <Form.Item name="customerType" label="客户类型">
          <Select
            placeholder="请选择类型"
            allowClear
            style={{ width: 120 }}
          >
            <Option value="新客户">新客户</Option>
            <Option value="老客户">老客户</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CustomerFilter;
