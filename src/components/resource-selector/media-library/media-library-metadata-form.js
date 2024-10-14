import Info from '../../info.js';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import TagSelect from '../../tag-select.js';
import { Checkbox, Form, Radio } from 'antd';
import Logger from '../../../common/logger.js';
import { useTranslation } from 'react-i18next';
import LicenseSelect from '../../license-select.js';
import { handleApiError } from '../../../ui/error-helper.js';
import LanguageSelect from '../../localization/language-select.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import NeverScrollingTextArea from '../../never-scrolling-text-area.js';
import MediaLibraryApiClient from '../../../api-clients/media-library-api-client.js';
import { maxMediaLibraryItemShortDescriptionLength } from '../../../domain/validation-constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

const logger = new Logger(import.meta.url);

function MediaLibraryMetadataForm({ form, file, useAllRightsReserved, useOptimizeImages, disableOptimizeImages, onFinish }) {
  const { t } = useTranslation('mediaLibraryMetadataForm');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const isAllRightsReservedChecked = Form.useWatch('allRightsReserved', form);

  const initialFormValues = useMemo(() => {
    return {
      shortDescription: '',
      languages: [],
      licenses: [],
      allRightsReserved: false,
      tags: [],
      ...file,
      optimizeImages: true,
      allRightsReservedConfirmed: file?.allRightsReserved || false
    };
  }, [file]);

  const allRightsReservedOptions = useMemo(() => [
    { label: t('freeLicense'), value: false },
    { label: t('common:allRightsReserved'), value: true }
  ], [t]);

  const handleMediaLibraryTagSuggestionsNeeded = searchText => {
    return mediaLibraryApiClient.getMediaLibraryTagSuggestions(searchText).catch(error => {
      handleApiError({ error, logger, t });
      return [];
    });
  };

  const handleFormValuesChange = changedValues => {
    if ('allRightsReserved' in changedValues) {
      form.setFields([
        {
          name: 'licenses',
          value: [],
          errors: [],
          warnings: [],
          touched: false,
          validating: false
        },
        {
          name: 'allRightsReservedConfirmed',
          value: false,
          errors: [],
          warnings: [],
          touched: false,
          validating: false
        }
      ]);
    }
  };

  const agreementValidationRules = [
    {
      message: t('common:confirmationValidationMessage'),
      validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error(t('common:confirmationValidationMessage')))
    }
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialFormValues}
      onFinish={onFinish}
      onValuesChange={handleFormValuesChange}
      >
      <FormItem
        name="shortDescription"
        label={<Info tooltip={t('common:shortDescriptionInfo')} iconAfterContent>{t('common:shortDescription')}</Info>}
        >
        <NeverScrollingTextArea rows={3} maxLength={maxMediaLibraryItemShortDescriptionLength} />
      </FormItem>
      <FormItem name="languages" label={t('common:languages')}>
        <LanguageSelect multi />
      </FormItem>
      <FormItem name="allRightsReserved" hidden={!useAllRightsReserved}>
        <RadioGroup optionType="button" options={allRightsReservedOptions} />
      </FormItem>
      <FormItem
        name="licenses"
        label={t('common:licenses')}
        hidden={isAllRightsReservedChecked}
        dependencies={['allRightsReserved']}
        rules={[{ required: !isAllRightsReservedChecked, message: t('licensesRequired') }]}
        >
        <LicenseSelect multi />
      </FormItem>
      <FormItem
        valuePropName="checked"
        name="allRightsReservedConfirmed"
        hidden={!isAllRightsReservedChecked}
        dependencies={['allRightsReserved']}
        rules={isAllRightsReservedChecked ? agreementValidationRules : null}
        >
        <Checkbox>{t('allRightsReservedConfirmationWarning')}</Checkbox>
      </FormItem>
      <FormItem
        name="tags"
        label={<Info tooltip={t('tagsInfo')} iconAfterContent>{t('common:tags')}</Info>}
        rules={[{ required: true, message: t('tagsRequired') }]}
        >
        <TagSelect placeholder={t('common:tagsPlaceholder')} onSuggestionsNeeded={handleMediaLibraryTagSuggestionsNeeded} />
      </FormItem>
      <FormItem name="optimizeImages" valuePropName="checked" hidden={!useOptimizeImages}>
        <Checkbox disabled={disableOptimizeImages}>{t('common:optimizeImages')}</Checkbox>
      </FormItem>
    </Form>
  );
}

MediaLibraryMetadataForm.propTypes = {
  form: PropTypes.object.isRequired,
  file: PropTypes.shape({
    shortDescription: PropTypes.string,
    languages: PropTypes.arrayOf(PropTypes.string),
    allRightsReserved: PropTypes.bool,
    licenses: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string)
  }),
  useOptimizeImages: PropTypes.bool,
  disableOptimizeImages: PropTypes.bool,
  useAllRightsReserved: PropTypes.bool,
  onFinish: PropTypes.func.isRequired
};

MediaLibraryMetadataForm.defaultProps = {
  file: null,
  useOptimizeImages: true,
  useAllRightsReserved: true,
  disableOptimizeImages: false
};

export default MediaLibraryMetadataForm;
