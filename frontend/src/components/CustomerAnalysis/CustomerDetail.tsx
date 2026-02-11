import React, { useEffect, useState } from 'react';
import { Drawer, Descriptions, Timeline, Spin, message, Divider, Row, Col, Statistic, Card, List, Empty, Alert } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { CustomerDetailAnalysis } from '../../types/customerAnalysis';
import { customerAnalysisApi } from '../../services/customerAnalysisService';
import { formatCurrency } from '../../utils/formatters';

interface CustomerDetailProps {
  companyName: string;
  visible: boolean;
  onClose: () => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({
  companyName,
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerDetailAnalysis | null>(null);
  const [topProducts, setTopProducts] = useState<Array<{ productName: string; count: number; rank: number }>>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [topProductsError, setTopProductsError] = useState<string | null>(null);

  // 加载客户详细数据
  useEffect(() => {
    if (visible && companyName) {
      loadCustomerDetail();
      loadTopProducts();
    }
  }, [visible, companyName]);

  const loadCustomerDetail = async () => {
    try {
      setLoading(true);
      const result = await customerAnalysisApi.getCustomerDetail(companyName);
      setData(result);
    } catch (error) {
      console.error('加载客户详情失败:', error);
      message.error('加载客户详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTopProducts = async () => {
    try {
      setTopProductsLoading(true);
      setTopProductsError(null);
      const result = await customerAnalysisApi.getTopProducts(companyName, 5);
      setTopProducts(result.products);
    } catch (error) {
      console.error('加载Top5成单产品失败:', error);
      setTopProductsError('加载失败');
    } finally {
      setTopProductsLoading(false);
    }
  };

  const retryLoadTopProducts = () => {
    loadTopProducts();
  };

  return (
    <Drawer
      title={`客户分析 - ${companyName}`}
      placement="right"
      width={720}
      onClose={onClose}
      open={visible}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <>
          {/* 基本信息 */}
          <Descriptions title="基本信息" bordered column={2}>
            <Descriptions.Item label="公司名称" span={2}>
              {data.basicInfo.companyName}
            </Descriptions.Item>
            <Descriptions.Item label="国家">
              {data.basicInfo.country}
            </Descriptions.Item>
            <Descriptions.Item label="客户等级">
              {data.basicInfo.customerLevel}
            </Descriptions.Item>
            <Descriptions.Item label="客户类型">
              {data.basicInfo.customerType}
            </Descriptions.Item>
            <Descriptions.Item label="商机描述" span={2}>
              {data.basicInfo.businessOpportunity || '无'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* 下单频率分析 */}
          <h3>下单频率分析</h3>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="订单总数"
                  value={data.orderFrequency.totalOrders}
                  suffix="个"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="月均订单数"
                  value={data.orderFrequency.monthlyAverage}
                  precision={2}
                  suffix="个/月"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="平均订单间隔"
                  value={data.orderFrequency.averageInterval || '不适用'}
                  suffix={data.orderFrequency.averageInterval ? '天' : ''}
                />
              </Card>
            </Col>
          </Row>

          {/* 月度订单趋势 */}
          {data.orderFrequency.monthlyTrend.length > 0 && (
            <>
              <h4>月度订单趋势</h4>
              <div style={{ marginBottom: 24 }}>
                {data.orderFrequency.monthlyTrend.map((item) => (
                  <div key={item.month} style={{ marginBottom: 8 }}>
                    {item.month}: {item.count} 个订单
                  </div>
                ))}
              </div>
            </>
          )}

          <Divider />

          {/* 采购习惯分析 */}
          <h3>采购习惯分析</h3>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="最小订单金额"
                  value={data.purchasePattern.amountRange.min}
                  prefix="¥"
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="平均订单金额"
                  value={data.purchasePattern.amountRange.average}
                  prefix="¥"
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="最大订单金额"
                  value={data.purchasePattern.amountRange.max}
                  prefix="¥"
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
          </Row>

          <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="采购周期规律">
              {data.purchasePattern.cyclePattern}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Top5成单产品 */}
          <h3><TrophyOutlined /> Top5成单产品</h3>
          {topProductsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin />
            </div>
          ) : topProductsError ? (
            <Alert
              message="加载失败"
              description={topProductsError}
              type="error"
              showIcon
              action={
                <a onClick={retryLoadTopProducts}>重试</a>
              }
              style={{ marginBottom: 24 }}
            />
          ) : topProducts.length > 0 ? (
            <List
              dataSource={topProducts}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: item.rank <= 3 ? '#ffd700' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: item.rank <= 3 ? '#fff' : '#666',
                      }}>
                        {item.rank}
                      </div>
                    }
                    title={item.productName}
                    description={`采购次数: ${item.count}`}
                  />
                </List.Item>
              )}
              style={{ marginBottom: 24 }}
            />
          ) : (
            <Empty
              description="暂无成单产品数据"
              style={{ marginBottom: 24 }}
            />
          )}

          <Divider />

          {/* 订单时间线 */}
          <h3>订单时间线</h3>
          <Timeline>
            {data.orderTimeline.map((order) => (
              <Timeline.Item key={order.id}>
                <p><strong>{order.orderDate}</strong></p>
                <p>线索编号: {order.leadNumber}</p>
                <p>发票金额: ¥{formatCurrency(order.invoiceAmount)}</p>
                <p>到款金额: ¥{formatCurrency(order.paymentAmount)}</p>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      ) : null}
    </Drawer>
  );
};

export default CustomerDetail;
