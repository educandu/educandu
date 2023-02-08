import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import UrlInput from '../url-input.js';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { createCopyrightForSourceMetadata } from '../../utils/source-utils.js';

const FormItem = Form.Item;

function SecondaryTrackEditor({ content, onContentChanged }) {
  const { t } = useTranslation('');
  const { name, sourceUrl, copyrightNotice } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleNameChange = event => {
    changeContent({ name: event.target.value });
  };

  const handleSourceUrlChange = (value, metadata) => {
    changeContent({
      sourceUrl: value,
      copyrightNotice: createCopyrightForSourceMetadata(metadata, t)
    });
  };

  const handleCopyrightNoticeChanged = event => {
    changeContent({ copyrightNotice: event.target.value });
  };

  return (
    <Fragment>
      <FormItem label={t('common:name')} {...FORM_ITEM_LAYOUT}>
        <Input value={name} onChange={handleNameChange} />
      </FormItem>
      <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
        <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
      </FormItem>
      <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
        <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChanged} />
      </FormItem>
    </Fragment>
  );
}

SecondaryTrackEditor.propTypes = {
  content: PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    copyrightNotice: PropTypes.string
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired
};

export default SecondaryTrackEditor;
