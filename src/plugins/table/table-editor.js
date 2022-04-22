import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Form, Input, message } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

const { TextArea } = Input;

function TableEditor({ content, onContentChanged }) {
  const { t } = useTranslation('table');
  const json = JSON.stringify(content, null, 2) || '';

  const { renderMedia } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleJSONValueChanged = event => {
    const { value } = event.target;

    let newContent;
    try {
      newContent = JSON.parse(value);
    } catch (err) {
      message.error(err.message);
      return;
    }

    updateContent({ ...newContent });
  };

  const handleRenderMediaChanged = event => {
    updateContent({ renderMedia: event.target.checked });
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  return (
    <div className="TableEditor">
      <Form>
        <Form.Item label="JSON" {...formItemLayout}>
          <TextArea value={json} onChange={handleJSONValueChanged} autoSize={{ minRows: 10 }} />
        </Form.Item>
        <Form.Item label={t('common:renderMedia')} {...formItemLayout}>
          <Checkbox checked={renderMedia} onChange={handleRenderMediaChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

TableEditor.propTypes = {
  ...sectionEditorProps
};

export default TableEditor;
