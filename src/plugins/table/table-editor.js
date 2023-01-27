import React from 'react';
import { Radio, Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import TableDesigner from './table-designer.js';
import { COLUMN_DISTRIBUTION } from './table-utils.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

function TableEditor({ content, onContentChanged }) {
  const { t } = useTranslation('table');

  const { columnDistribution, width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleColumnDistributionChange = event => {
    updateContent({ columnDistribution: event.target.value });
  };

  const handleWidthChange = newValue => {
    updateContent({ width: newValue });
  };

  return (
    <div className="TableEditor">
      <Form labelAlign="left">
        <Form.Item label={t('columnDistribution')} {...FORM_ITEM_LAYOUT}>
          <Radio.Group value={columnDistribution} onChange={handleColumnDistributionChange}>
            <Radio.Button value={COLUMN_DISTRIBUTION.automatic}>{t('columnDistribution_automatic')}</Radio.Button>
            <Radio.Button value={COLUMN_DISTRIBUTION.even}>{t('columnDistribution_even')}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
      </Form>
      <div className="u-panel">
        <TableDesigner content={content} onContentChange={updateContent} />
      </div>
    </div>
  );
}

TableEditor.propTypes = {
  ...sectionEditorProps
};

export default TableEditor;
