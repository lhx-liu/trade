import React from 'react';
import { Form, Input, Button, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { validateEmail } from '../../utils';

interface ContactInfoInputProps {
  // 可以添加额外的props
}

const ContactInfoInput: React.FC<ContactInfoInputProps> = () => {
  return (
    <Form.List
      name="contactInfo"
      rules={[
        {
          validator: async (_, contactInfo) => {
            if (!contactInfo || contactInfo.length < 1) {
              return Promise.reject(new Error('至少需要添加一个联系人'));
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          {fields.map((field, index) => (
            <Space
              key={field.key}
              style={{ display: 'flex', marginBottom: 8 }}
              align="baseline"
            >
              <Form.Item
                {...field}
                name={[field.name, 'name']}
                label={index === 0 ? '客户名' : ''}
                rules={[
                  { required: true, message: '请输入客户名' },
                  { max: 50, message: '客户名不能超过50个字符' },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="客户名" style={{ width: 150 }} />
              </Form.Item>

              <Form.Item
                {...field}
                name={[field.name, 'email']}
                label={index === 0 ? '邮箱' : ''}
                rules={[
                  { required: true, message: '请输入邮箱' },
                  {
                    validator: (_, value) => {
                      if (!value || validateEmail(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('邮箱格式不正确'));
                    },
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="邮箱" style={{ width: 200 }} />
              </Form.Item>

              <Form.Item
                {...field}
                name={[field.name, 'phone']}
                label={index === 0 ? '联系方式' : ''}
                rules={[
                  { required: true, message: '请输入联系方式' },
                  { min: 8, message: '联系方式至少8位' },
                  { max: 20, message: '联系方式不能超过20位' },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="联系方式" style={{ width: 150 }} />
              </Form.Item>

              {fields.length > 1 && (
                <MinusCircleOutlined
                  onClick={() => remove(field.name)}
                  style={{ color: '#ff4d4f' }}
                />
              )}
            </Space>
          ))}

          <Form.Item>
            <Button
              type="dashed"
              onClick={() => add()}
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
            >
              添加联系人
            </Button>
            <Form.ErrorList errors={errors} />
          </Form.Item>
        </>
      )}
    </Form.List>
  );
};

export default ContactInfoInput;
