import React from 'react';
import { Card, Empty } from 'antd';
import { MonthlyOrderCount, AmountTrendItem } from '../../types/customerAnalysis';

interface AnalysisChartsProps {
  monthlyTrend?: MonthlyOrderCount[];
  amountTrend?: AmountTrendItem[];
}

/**
 * 数据可视化图表组件
 * 注意：这是一个简化版本，使用文本展示数据
 * 如需完整的图表功能，可以集成 @ant-design/charts 或 recharts
 */
const AnalysisCharts: React.FC<AnalysisChartsProps> = ({
  monthlyTrend,
  amountTrend,
}) => {
  return (
    <div>
      {/* 月度订单趋势 */}
      {monthlyTrend && monthlyTrend.length > 0 && (
        <Card title="月度订单趋势" style={{ marginBottom: 16 }}>
          <div>
            {monthlyTrend.map((item) => (
              <div key={item.month} style={{ marginBottom: 8 }}>
                <span style={{ display: 'inline-block', width: 100 }}>
                  {item.month}
                </span>
                <span>
                  {'█'.repeat(Math.min(item.count, 20))} {item.count} 个订单
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 订单金额趋势 */}
      {amountTrend && amountTrend.length > 0 && (
        <Card title="订单金额趋势">
          <div>
            {amountTrend.map((item) => (
              <div key={item.date} style={{ marginBottom: 8 }}>
                <span style={{ display: 'inline-block', width: 120 }}>
                  {item.date}
                </span>
                <span>¥{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(!monthlyTrend || monthlyTrend.length === 0) &&
        (!amountTrend || amountTrend.length === 0) && (
          <Card>
            <Empty description="暂无图表数据" />
          </Card>
        )}
    </div>
  );
};

export default AnalysisCharts;
