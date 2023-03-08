import PropTypes from 'prop-types';
import { Form, Radio } from 'antd';
import React, { memo } from 'react';
import Markdown from '../markdown.js';
import CustomAlert from '../custom-alert.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import { announcementShape } from '../../ui/default-prop-types.js';
import { ADMIN_PAGE_FORM_ITEM_LAYOUT } from '../../domain/constants.js';

const ANNOUNCEMENT_TYPE = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error'
};

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function AnnouncementSettings({ announcement, onChange }) {
  const { t } = useTranslation('announcementSettings');

  const text = announcement?.text || '';
  const type = announcement?.type || ANNOUNCEMENT_TYPE.info;

  const handleTextChange = event => {
    onChange({ text: event.target.value, type });
  };

  const handleTypeChange = event => {
    onChange({ text, type: event.target.value });
  };

  return (
    <div>
      <FormItem {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('common:text')}>
        <MarkdownInput inline value={text} onChange={handleTextChange} />
      </FormItem>
      <FormItem {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('common:type')}>
        <RadioGroup value={type} onChange={handleTypeChange}>
          <RadioButton value={ANNOUNCEMENT_TYPE.success}>{t(`announcementType_${ANNOUNCEMENT_TYPE.success}`)}</RadioButton>
          <RadioButton value={ANNOUNCEMENT_TYPE.info}>{t(`announcementType_${ANNOUNCEMENT_TYPE.info}`)}</RadioButton>
          <RadioButton value={ANNOUNCEMENT_TYPE.warning}>{t(`announcementType_${ANNOUNCEMENT_TYPE.warning}`)}</RadioButton>
          <RadioButton value={ANNOUNCEMENT_TYPE.error}>{t(`announcementType_${ANNOUNCEMENT_TYPE.error}`)}</RadioButton>
        </RadioGroup>
      </FormItem>
      <FormItem {...ADMIN_PAGE_FORM_ITEM_LAYOUT} label={t('common:preview')}>
        <CustomAlert banner message={<Markdown>{text}</Markdown>} type={type} />
      </FormItem>
    </div>
  );
}

AnnouncementSettings.propTypes = {
  announcement: announcementShape,
  onChange: PropTypes.func.isRequired
};

AnnouncementSettings.defaultProps = {
  announcement: null
};

export default memo(AnnouncementSettings);
