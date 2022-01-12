import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import Logger from '../common/logger.js';
import { Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import { useService } from './container-context.js';
import { useLanguage } from './language-context.js';
import { toTrimmedString } from '../utils/sanitize.js';
import inputValidators from '../utils/input-validators.js';
import React, { useEffect, useRef, useState } from 'react';
import LanguageSelect from './localization/language-select.js';
import { documentMetadataShape } from '../ui/default-prop-types.js';
import DocumentApiClient from '../api-clients/document-api-client.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

function DocumentCreationModal({ isVisible, onClose, clonedDocument }) {
  const formRef = useRef(null);
  const { language: uiLanguage } = useLanguage();
  const { t } = useTranslation('documentCreationModal');
  const documentApiClient = useService(DocumentApiClient);

  const [loading, setLoading] = useState(false);

  const defaultDocument = {
    title: clonedDocument?.title ? `${clonedDocument.title} ${t('copyTitleSuffix')}` : t('newDocument'),
    slug: clonedDocument?.slug ? `${clonedDocument.slug}-${t('copySlugSuffix')}` : '',
    language: clonedDocument?.language || getDefaultLanguageFromUiLanguage(uiLanguage)
  };

  const titleValidationRules = [
    {
      required: true,
      message: t('titleRequired'),
      whitespace: true
    }
  ];

  const slugValidationRules = [
    {
      validator: (rule, value) => {
        return value && !inputValidators.isValidSlug(value)
          ? Promise.reject(new Error(t('common:invalidSlug')))
          : Promise.resolve();
      }
    }
  ];

  useEffect(() => {
    if (isVisible && formRef.current) {
      formRef.current.resetFields();
    }
  }, [isVisible]);

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const mapToDocumentModel = ({ title, slug, language }) => {
    return {
      title: toTrimmedString(title),
      slug: toTrimmedString(slug) || '',
      language,
      sections: [],
      tags: clonedDocument?.tags ? [...clonedDocument.tags] : [],
      archived: false
    };
  };

  const handleOnFinish = async ({ title, slug, language }) => {
    try {
      setLoading(true);

      const documentModel = mapToDocumentModel({ title, slug, language });
      const { documentRevision } = await documentApiClient.saveDocument(documentModel);

      setLoading(false);
      onClose();

      window.location = urls.getEditDocUrl(documentRevision.key);
    } catch (error) {
      setLoading(false);
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleCancel = () => onClose();

  return (
    <Modal
      title={t('newDocument')}
      visible={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      okButtonProps={{ loading }}
      >
      <Form onFinish={handleOnFinish} ref={formRef} name="new-document-form" layout="vertical">
        <FormItem name="title" label={t('common:title')} initialValue={defaultDocument.title} rules={titleValidationRules}>
          <Input />
        </FormItem>
        <FormItem name="language" label={t('common:language')} initialValue={defaultDocument.language}>
          <LanguageSelect />
        </FormItem>
        <FormItem name="slug" label={t('common:slug')} initialValue={defaultDocument.slug} rules={slugValidationRules}>
          <Input />
        </FormItem>
      </Form>
    </Modal>
  );
}

DocumentCreationModal.defaultProps = {
  clonedDocument: null
};

DocumentCreationModal.propTypes = {
  clonedDocument: documentMetadataShape,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
export default DocumentCreationModal;
