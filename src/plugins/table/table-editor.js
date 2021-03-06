import React from 'react';
import { Radio, Checkbox, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import TableDesigner from './table-designer.js';
import { COLUMN_DISTRIBUTION } from './table-utils.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

function TableEditor({ content, onContentChanged }) {
  const { t } = useTranslation('table');

  const { columnDistribution, width, renderMedia } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleColumnDistributionChange = event => {
    updateContent({ columnDistribution: event.target.value });
  };

  const handleWidthChange = newValue => {
    updateContent({ width: newValue });
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
        <Form.Item label={t('columnDistribution')} {...formItemLayout}>
          <Radio.Group value={columnDistribution} onChange={handleColumnDistributionChange}>
            <Radio.Button value={COLUMN_DISTRIBUTION.automatic}>{t('columnDistribution_automatic')}</Radio.Button>
            <Radio.Button value={COLUMN_DISTRIBUTION.even}>{t('columnDistribution_even')}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
        <Form.Item label={t('common:renderMedia')} {...formItemLayout}>
          <Checkbox checked={renderMedia} onChange={handleRenderMediaChange} />
        </Form.Item>
      </Form>
      <div className="Panel">
        <div className="Panel-content">
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
