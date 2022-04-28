import React from 'react';
import { Checkbox, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import TableDesigner from './table-designer.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

function TableEditor({ content, onContentChanged }) {
  const { t } = useTranslation('table');

  const { renderMedia } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleRenderMediaChange = event => {
    updateContent({ renderMedia: event.target.checked });
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  return (
    <div className="TableEditor">
      <Form>
        <Form.Item label={t('common:renderMedia')} {...formItemLayout}>
          <Checkbox checked={renderMedia} onChange={handleRenderMediaChange} />
        </Form.Item>
      </Form>
      <div className="Panel">
        <div className="Panel-content Panel-content--darker">
          <TableDesigner content={content} onContentChange={updateContent} />
        </div>
      </div>
    </div>
  );
}

TableEditor.propTypes = {
  ...sectionEditorProps
};

export default TableEditor;
