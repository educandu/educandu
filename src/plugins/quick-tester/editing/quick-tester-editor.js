const React = require('react');
const autoBind = require('auto-bind');
const { Form, Input, Table, Button } = require('antd');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const { swapItems, removeItem } = require('../../../utils/immutable-array-utils');
const { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, DeleteOutlined } = require('@ant-design/icons');

const FormItem = Form.Item;
const ButtonGroup = Button.Group;

class QuickTesterEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);

    this.columns = [
      {
        width: 80,
        key: 'upDown',
        render: (upDown, item, index) => (
          <ButtonGroup>
            <Button
              data-index={index}
              disabled={index === 0}
              icon={<ArrowUpOutlined />}
              onClick={this.handleUpCircleButtonClick}
              />
            <Button
              data-index={index}
              disabled={index === this.props.content.tests.length - 1}
              icon={<ArrowDownOutlined />}
              onClick={this.handleDownCircleButtonClick}
              />
          </ButtonGroup>
        )
      }, {
        title: 'Frage',
        dataIndex: 'question',
        key: 'question',
        render: (question, item, index) => (
          <Input data-index={index} value={question} onChange={this.handleInputQuestionChanged} />
        )
      }, {
        title: 'Antwort',
        dataIndex: 'answer',
        key: 'answer',
        render: (answer, item, index) => (
          <Input data-index={index} value={answer} onChange={this.handleInputAnswerChanged} />
        )
      }, {
        title: (
          <Button type="primary" icon={<PlusOutlined />} onClick={this.handleAddButtonClick} />
        ),
        width: 48,
        key: 'button',
        render: (value, item, index) => (
          <Button data-index={index} type="danger" icon={<DeleteOutlined />} onClick={this.handleDeletButtonClick} />
        )
      }
    ];
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  handleTeaserValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ teaser: value });
  }

  handleTitleValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ title: value });
  }

  handleInputQuestionChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((t, i) => i === index ? { question: value, answer: t.answer } : t);
    this.changeContent({ tests: newTests });
  }

  handleInputAnswerChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((t, i) => i === index ? { question: t.question, answer: value } : t);
    this.changeContent({ tests: newTests });
  }

  handleDeletButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = removeItem(oldTests, index);
    this.changeContent({ tests: newTests });
  }

  handleAddButtonClick() {
    const newTests = this.props.content.tests.slice();
    newTests.push({ question: '', answer: '' });
    this.changeContent({ tests: newTests });
  }

  handleUpCircleButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newTests = swapItems(this.props.content.tests, index, index - 1);
    this.changeContent({ tests: newTests });
  }

  handleDownCircleButtonClick(event) {
    const { dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const newTests = swapItems(this.props.content.tests, index, index + 1);
    this.changeContent({ tests: newTests });
  }

  render() {
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };
    const { content } = this.props;
    const dataSource = content.tests.map((t, i) => ({
      key: i,
      question: t.question,
      answer: t.answer
    }));

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label="Link-Text:" {...formItemLayout}>
            <Input value={content.teaser} onChange={this.handleTeaserValueChanged} />
          </FormItem>
          <FormItem label="Titel:" {...formItemLayout}>
            <Input value={content.title} onChange={this.handleTitleValueChanged} />
          </FormItem>
        </Form>
        <Table dataSource={dataSource} columns={this.columns} pagination={false} size="small" />
      </div>
    );
  }
}

QuickTesterEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = QuickTesterEditor;
