import { Button, Form, Input } from 'antd';
import * as React from 'react';
import { SocketContext } from '../../../utils/context';

const FormItem = Form.Item;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 }
  }
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0
    },
    sm: {
      span: 16,
      offset: 8
    }
  }
};

function hasErrors(fieldsError: any) {
  return Object.keys(fieldsError).some((field: string) => fieldsError[field]);
}

const FormComponent = React.memo((props: { onSuccess: () => void; form: any }) => {
  const socket = React.useContext(SocketContext);

  const handleSubmit = React.useCallback(
    (e: any) => {
      e.preventDefault();

      socket.emit('addPage', props.form.getFieldsValue());

      props.onSuccess();
    },
    [props, socket]
  );

  return (
    <Form onSubmit={handleSubmit}>
      <FormItem {...formItemLayout} label="Path">
        {props.form.getFieldDecorator('path', {
          initialValue: 'about',
          rules: [
            {
              type: 'string',
              message: 'Path must be string!'
            },
            {
              required: true,
              message: 'Path is required!'
            }
          ]
        })(<Input />)}
      </FormItem>

      <FormItem {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit" disabled={hasErrors(props.form.getFieldsError())}>
          Ok
        </Button>
      </FormItem>
    </Form>
  );
});

export default Form.create()(FormComponent as any) as any;
