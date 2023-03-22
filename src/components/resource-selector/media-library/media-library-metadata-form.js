import Info from '../../info.js';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import TagSelect from '../../tag-select.js';
import { Checkbox, Form, Input } from 'antd';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import LicenseSelect from '../../license-select.js';
import { handleApiError } from '../../../ui/error-helper.js';
import LanguageSelect from '../../localization/language-select.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { maxMediaLibraryItemDescriptionLength } from '../../../domain/validation-constants.js';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

const logger = new Logger(import.meta.url);

function MediaLibraryMetadataForm({ form, file, useOptimizeImage, disableOptimizeImage, onFinish }) {
  const { t } = useTranslation('mediaLibraryMetadataForm');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const initialFormValues = useMemo(() => {
    return {
      description: '',
      languages: [],
      licenses: [],
      tags: [],
      optimizeImage: true,
      ...file
    };
  }, [file]);

  const handleMediaLibraryTagSuggestionsNeeded = searchText => {
    return mediaLibraryApiClient.getMediaLibraryTagSuggestions(searchText).catch(error => {
      handleApiError({ error, logger, t });
      return [];
    });
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialFormValues} onFinish={onFinish}>
      <FormItem name="description" label={t('common:description')}>
        <TextArea rows={3} maxLength={maxMediaLibraryItemDescriptionLength} />
      </FormItem>
      <FormItem name="languages" label={t('common:languages')}>
        <LanguageSelect multi />
      </FormItem>
      <FormItem name="licenses" label={t('common:licenses')} rules={[{ required: true, message: t('licensesRequired') }]}>
        <LicenseSelect multi />
      </FormItem>
      <FormItem
        name="tags"
        label={<Info tooltip={t('tagsInfo')} iconAfterContent>{t('common:tags')}</Info>}
        rules={[{ required: true, message: t('tagsRequired') }]}
        >
        <TagSelect placeholder={t('common:tagsPlaceholder')} onSuggestionsNeeded={handleMediaLibraryTagSuggestionsNeeded} />
      </FormItem>
      {!!useOptimizeImage && (
      <FormItem name="optimizeImage" valuePropName="checked">
        <Checkbox disabled={disableOptimizeImage}>{t('optimizeImage')}</Checkbox>
      </FormItem>
      )}
    </Form>
  );
}

MediaLibraryMetadataForm.propTypes = {
  form: PropTypes.object.isRequired,
  file: PropTypes.shape({
    description: PropTypes.string,
    languages: PropTypes.arrayOf(PropTypes.string),
    licenses: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string)
  }),
  useOptimizeImage: PropTypes.bool,
  disableOptimizeImage: PropTypes.bool,
  onFinish: PropTypes.func.isRequired
};

MediaLibraryMetadataForm.defaultProps = {
  file: null,
  useOptimizeImage: true,
  disableOptimizeImage: false
};

export default MediaLibraryMetadataForm;
