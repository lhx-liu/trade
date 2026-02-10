const http = require('http');

const orderData = {
  orderDate: '2024-01-15',
  companyName: '测试公司A',
  contactInfo: [
    {
      name: '张三',
      email: 'zhangsan@test.com',
      phone: '13800138000'
    }
  ],
  leadNumber: 'LEAD-001',
  newOrOld: '新客户',
  customerLevel: 'A',
  country: '中国',
  continent: '亚洲',
  source: '展会',
  customerNature: '贸易商',
  invoiceAmount: 10000.50,
  paymentAmount: 5000.00
};

const postData = JSON.stringify(orderData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应:', data);
    try {
      const json = JSON.parse(data);
      console.log('解析后的响应:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('无法解析JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.write(postData);
req.end();
