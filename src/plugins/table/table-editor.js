import React, { Fragment } from 'react';
import { Radio, Form, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import TableDesigner from './table-designer.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import { COLUMN_DISTRIBUTION } from './table-utils.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

function TableEditor({ content, onContentChanged }) {
  const { t } = useTranslation('table');

  const { columnDistribution, width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleColumnDistributionChange = event => {
    updateContent({ columnDistribution: event.target.value });
  };

  const handleWidthChange = newValue => {
    updateContent({ width: newValue });
  };

  return (
    <div className="TableEditor">
      <Form>
        <Form.Item label={t('columnDistribution')} {...FORM_ITEM_LAYOUT}>
          <Radio.Group value={columnDistribution} onChange={handleColumnDistributionChange}>
            <Radio.Button value={COLUMN_DISTRIBUTION.automatic}>{t('columnDistribution_automatic')}</Radio.Button>
            <Radio.Button value={COLUMN_DISTRIBUTION.even}>{t('columnDistribution_even')}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
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
