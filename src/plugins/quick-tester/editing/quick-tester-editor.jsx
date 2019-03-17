const React = require('react');
const Form = require('antd/lib/form');
const autoBind = require('auto-bind');
const Input = require('antd/lib/input');
const Table = require('antd/lib/table');
const message = require('antd/lib/message');
const { sectionEditorProps } = require('../../../ui/default-prop-types');

const { TextArea } = Input;
const FormItem = Form.Item;

class QuickTesterEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);

    this.columns = [
      {
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
      }
    ];
  }

  handleJSONValueChanged(event) {
    const { value } = event.target;

    let newContent;
    try {
      newContent = JSON.parse(value);
    } catch (err) {
      message.error('Kein gültiges JSON');
      return;
    }

    this.changeContent({ ...newContent });
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
    const json = JSON.stringify(content, null, 2) || '';

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
        <TextArea value={json} onChange={this.handleJSONValueChanged} autosize={{ minRows: 3 }} />
      </div>
    );
  }
}

QuickTesterEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = QuickTesterEditor;
