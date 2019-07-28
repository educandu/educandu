const React = require('react');
const Form = require('antd/lib/form');
const autoBind = require('auto-bind');
const Input = require('antd/lib/input');
const Table = require('antd/lib/table');
const Button = require('antd/lib/button');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const { swapItems, removeItem } = require('../../../utils/immutable-array-utils');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

const { TextArea } = Input;
const FormItem = Form.Item;
const ButtonGroup = Button.Group;

class EarTrainingEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);

    this.columns = [
      {
        width: 80,
        key: 'upDown',
        render: (upDown, item, index) => (
          <ButtonGroup>
            <Button data-index={index} disabled={index === 0} icon="arrow-up" onClick={this.handleUpCircleButtonClick} />
            <Button data-index={index} disabled={index === this.props.content.tests.length - 1} icon="arrow-down" onClick={this.handleDownCircleButtonClick} />
          </ButtonGroup>
        )
      }, {
        title: 'Vorgabe-ABC-Code',
        dataIndex: 'startAbcCode',
        key: 'startAbcCode',
        render: (startAbcCode, item, index) => (
          <TextArea data-index={index} value={startAbcCode} onChange={this.handleStartAbcCodeChanged} rows={6} />
        )
      }, {
        title: 'Lösungs-ABC-Code',
        dataIndex: 'fullAbcCode',
        key: 'fullAbcCode',
        render: (fullAbcCode, item, index) => (
          <TextArea data-index={index} value={fullAbcCode} onChange={this.handleFullAbcCodeChanged} rows={6} />
        )
      }, {
        title: (
          <Button type="primary" icon="plus" onClick={this.handleAddButtonClick} />
        ),
        width: 48,
        key: 'button',
        render: (value, item, index) => (
          <Button data-index={index} type="danger" icon="delete" disabled={this.props.content.tests.length < 2} onClick={this.handleDeletButtonClick} />
        )
      }
    ];
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  handleTitleChanged(event) {
    const { value } = event.target;
    this.changeContent({ title: value });
  }

  handleMaxWidthChanged(newValue) {
    this.changeContent({ maxWidth: newValue });
  }

  handleStartAbcCodeChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((t, i) => i === index ? { startAbcCode: value, fullAbcCode: t.fullAbcCode } : t);
    this.changeContent({ tests: newTests });
  }

  handleFullAbcCodeChanged(event) {
    const { value, dataset } = event.target;
    const index = Number.parseInt(dataset.index, 10);
    const oldTests = this.props.content.tests;
    const newTests = oldTests.map((t, i) => i === index ? { startAbcCode: t.startAbcCode, fullAbcCode: value } : t);
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
    newTests.push({ startAbcCode: 'X:1', fullAbcCode: 'X:1' });
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
      startAbcCode: t.startAbcCode,
      fullAbcCode: t.fullAbcCode
    }));

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label="Titel:" {...formItemLayout}>
            <Input value={content.title} onChange={this.handleTitleChanged} />
          </FormItem>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={content.maxWidth} onChange={this.handleMaxWidthChanged} />
          </Form.Item>
        </Form>
        <Table dataSource={dataSource} columns={this.columns} pagination={false} size="small" />
      </div>
    );
  }
}

EarTrainingEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = EarTrainingEditor;
