import React from 'react';
import autoBind from 'auto-bind';
import { Input, message } from 'antd';
import { withTranslation } from 'react-i18next';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types.js';

const { TextArea } = Input;

class IntervalTrainerEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleJSONValueChanged(event) {
    const { t } = this.props;
    const { value } = event.target;

    let newContent;
    try {
      newContent = JSON.parse(value);
    } catch (err) {
      message.error(t('invalidJson'));
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
  ...translationProps,
  ...sectionEditorProps
};

export default withTranslation('intervalTrainer')(IntervalTrainerEditor);
