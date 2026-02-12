import React, { useEffect, useState } from 'react';
import { Card, DatePicker, Button, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { Dayjs } from 'dayjs';
import { useAppContext } from '../../context/AppContext';
import { statisticsApi } from '../../services/api';
import StatisticsPanel from './StatisticsPanel';
import Charts from './Charts';

const { RangePicker } = DatePicker;

const Statistics: React.FC = () => {
  const { state, actions } = useAppContext();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [exporting, setExporting] = useState(false);

  // 初始化时加载全部统计数据
  useEffect(() => {
    actions.fetchStatistics();
  }, []);

  // 处理日期范围变化
  const handleDateRangeChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      actions.fetchStatistics(startDate, endDate);
    } else {
      // 清空日期范围，查询全部数据
      setDateRange(null);
      actions.fetchStatistics();
    }
  };

  // 处理导出报表
  const handleExport = async () => {
    try {
      setExporting(true);
      
      let blob;
      if (dateRange) {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        blob = await statisticsApi.exportExcel(startDate, endDate);
      } else {
        blob = await statisticsApi.exportExcel();
      }
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = dateRange 
        ? `订单报表_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.xlsx`
        : `订单报表_全部.xlsx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('报表导出成功');
    } catch (error) {
      console.error('Export failed:', error);
      message.error('报表导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            导出报表
          </Button>
        </Space>
      </Card>

      <StatisticsPanel statistics={state.statistics} loading={state.loading} />

      <Charts statistics={state.statistics} loading={state.loading} />
    </div>
  );
};

export default Statistics;
