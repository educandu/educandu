import React from 'react';
import autoBind from 'auto-bind';
import { Input, message } from 'antd';
import { sectionEditorProps } from '../../../ui/default-prop-types';

const { TextArea } = Input;

class IntervalTrainerEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
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

  render() {
    const { content } = this.props;
    const json = JSON.stringify(content, null, 2) || '';

    return (
      <div>
        <TextArea value={json} onChange={this.handleJSONValueChanged} autoSize={{ minRows: 3 }} />
      </div>
    );
  }
}

IntervalTrainerEditor.propTypes = {
  ...sectionEditorProps
};

export default IntervalTrainerEditor;
