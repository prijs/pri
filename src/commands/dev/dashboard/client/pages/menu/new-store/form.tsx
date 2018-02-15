import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './new-store.type'
import * as S from '../menu.style'
import { PureComponent } from '../../../utils/react-helper'
import { Form, Button, Input, Switch } from 'antd'

const FormItem = Form.Item

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
}

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
}

function hasErrors(fieldsError: any) {
  return Object.keys(fieldsError).some((field: string) => fieldsError[field])
}

@Connect
class FormComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  public render() {
    return (
      <Form onSubmit={this.handleSubmit}>
        <FormItem
          {...formItemLayout}
          label="Name"
        >
          {this.props.form.getFieldDecorator('name', {
            initialValue: 'application',
            rules: [{
              type: 'string', message: 'Name must be string!',
            }, {
              required: true, message: 'Name is required!',
            }],
          })(
            <Input />
          )}
        </FormItem>

        <FormItem
          {...formItemLayout}
          label="With demo"
        >
          {this.props.form.getFieldDecorator('withDemo', {
            initialValue: true,
            valuePropName: "checked"
          })(
            <Switch />
          )}
        </FormItem>

        <FormItem {...tailFormItemLayout}>
          <Button
            type="primary"
            htmlType="submit"
            disabled={hasErrors(this.props.form.getFieldsError())}
          >Ok</Button>
        </FormItem>
      </Form>
    )
  }

  private handleSubmit = async (e: any) => {
    e.preventDefault();
    await this.props.ApplicationAction.addStore(this.props.form.getFieldsValue())
    this.props.onSuccess()
  }
}

export default Form.create()(FormComponent as any) as any