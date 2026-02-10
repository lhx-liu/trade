import React, { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Card, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAppContext } from '../../context/AppContext';
import { debounce, getCurrentYearRange } from '../../utils';
import type { QueryParams } from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const QueryForm: React.FC = () => {
  const [form] = Form.useForm();
  const { actions } = useAppContext();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [start, end] = getCurrentYearRange();
    return [dayjs(start), dayjs(end)];
  });
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // 初始化时自动查询当年数据
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 创建防抖搜索函数
  const debouncedSearch = debounce((params: QueryParams) => {
    actions.fetchOrders(params);
  }, 500);

  // 处理文本输入变化（带防抖）
  const handleTextChange = (field: string, value: string) => {
    const values = form.getFieldsValue();
    const params: QueryParams = {
      ...values,
      [field]: value,
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
      page: 1,
      pageSize: 20,
    };
    debouncedSearch(params);
  };

  // 处理日期范围变化（立即触发查询）
  const handleDateRangeChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      const values = form.getFieldsValue();
      const params: QueryParams = {
        ...values,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
        page: 1,
        pageSize: 20,
      };
      actions.fetchOrders(params);
    }
  };

  // 处理搜索按钮点击
  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params: QueryParams = {
      ...values,
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
      page: 1,
      pageSize: 20,
    };
    actions.fetchOrders(params);
  };

  // 处理重置按钮点击
  const handleReset = () => {
    form.resetFields();
    const [start, end] = getCurrentYearRange();
    const newDateRange: [Dayjs, Dayjs] = [dayjs(start), dayjs(end)];
    setDateRange(newDateRange);
    
    const params: QueryParams = {
      startDate: start,
      endDate: end,
      page: 1,
      pageSize: 20,
    };
    actions.fetchOrders(params);
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Form form={form} layout="vertical">
        {/* 始终显示的字段 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="日期范围" name="dateRange">
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="公司名称" name="companyName">
              <Input
                placeholder="请输入公司名称"
                allowClear
                onChange={(e) => handleTextChange('companyName', e.target.value)}
              />
            </Form.Item>
          </Col>
          <Col span={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button
                  type="link"
                  icon={expanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={toggleExpanded}
                >
                  {expanded ? '收起条件' : '更多条件'}
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>

        {/* 可展开的字段 */}
        {expanded && (
          <>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="客户名称" name="customerName">
                  <Input
                    placeholder="请输入客户名称"
                    allowClear
                    onChange={(e) => handleTextChange('customerName', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="新老客户" name="newOrOld">
                  <Select placeholder="请选择新老客户" allowClear>
                    <Option value="新客户">新客户</Option>
                    <Option value="老客户">老客户</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="客户等级" name="customerLevel">
                  <Select placeholder="请选择客户等级" allowClear>
                    <Option value="A">A</Option>
                    <Option value="B">B</Option>
                    <Option value="C">C</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="国家" name="country">
                  <Input
                    placeholder="请输入国家"
                    allowClear
                    onChange={(e) => handleTextChange('country', e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="大洲" name="continent">
                  <Input
                    placeholder="请输入大洲"
                    allowClear
                    onChange={(e) => handleTextChange('continent', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="来源" name="source">
                  <Input
                    placeholder="请输入来源"
                    allowClear
                    onChange={(e) => handleTextChange('source', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="客户性质" name="customerNature">
                  <Input
                    placeholder="请输入客户性质"
                    allowClear
                    onChange={(e) => handleTextChange('customerNature', e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Card>
  );
};

export default QueryForm;
