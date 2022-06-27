import React from 'react';
import PropTypes from 'prop-types';
import { Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import { SOUND_SOURCE_TYPE } from './constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import MarkdownInput from '../../components/markdown-input.js';
import ResourcePicker from '../../components/resource-picker.js';
import { useService } from '../../components/container-context.js';
import { storageLocationPathToUrl, urlToSorageLocationPath } from '../../utils/storage-utils.js';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function EarTrainingSoundEditor({ sound, onSoundChanged }) {
  const { t } = useTranslation('earTraining');
  const clientConfig = useService(ClientConfig);

  const changeSound = newValues => {
    onSoundChanged({ ...sound, ...newValues });
  };

  const handleSourceTypeChanged = event => {
    const { value } = event.target;
    changeSound({
      sourceType: value,
      sourceUrl: value === SOUND_SOURCE_TYPE.midi ? null : '',
      text: value === SOUND_SOURCE_TYPE.midi ? null : sound.text || ''
    });
  };

  const handleExternalUrlChanged = event => {
    const { value } = event.target;
    changeSound({ sourceUrl: value });
  };

  const handleInternalUrlChanged = e => {
    changeSound({ sourceUrl: e.target.value });
  };

  const handleInternalUrlFileNameChanged = value => {
    changeSound({ sourceUrl: value });
  };

  const handleTextChanged = event => {
    const { value } = event.target;
    changeSound({ text: value });
  };

  const renderSourceRow = () => (
    <tr>
      <td style={{ padding: 8 }}>&nbsp;</td>
      <td style={{ padding: 8 }}>{t('audioSource')}:</td>
      <td style={{ padding: 8 }}>
        <RadioGroup
          value={sound.sourceType}
          onChange={handleSourceTypeChanged}
          >
          <RadioButton value={SOUND_SOURCE_TYPE.midi}>{t('midi')}</RadioButton>
          <RadioButton value={SOUND_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
          <RadioButton value={SOUND_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
        </RadioGroup>
      </td>
      <td style={{ padding: 8 }}>&nbsp;</td>
    </tr>
  );

  const renderUrlRow = () => (
    <tr>
      <td style={{ padding: 8 }}>&nbsp;</td>
      <td style={{ padding: 8 }}>
        {sound.sourceType === SOUND_SOURCE_TYPE.external && `${t('common:externalUrl')}:`}
        {sound.sourceType === SOUND_SOURCE_TYPE.internal && `${t('common:internalUrl')}:`}
      </td>
      <td style={{ padding: 8 }}>
        {sound.sourceType === SOUND_SOURCE_TYPE.external && (
        <Input
          value={sound.sourceUrl}
          onChange={handleExternalUrlChanged}
          />
        )}
        {sound.sourceType === SOUND_SOURCE_TYPE.internal && (
        <div className="u-input-and-button">
          <Input
            addonBefore={`${clientConfig.cdnRootUrl}/`}
            value={sound.sourceUrl}
            onChange={handleInternalUrlChanged}
            />
          <ResourcePicker
            url={storageLocationPathToUrl(sound.sourceUrl)}
            onUrlChange={url => handleInternalUrlFileNameChanged(urlToSorageLocationPath(url))}
            />
        </div>
        )}
      </td>
      <td style={{ padding: 8 }}>&nbsp;</td>
    </tr>
  );

  const renderTextRow = () => (
    <tr>
      <td style={{ padding: 8 }}>&nbsp;</td>
      <td style={{ padding: 8 }}>{t('common:copyrightInfos')}:</td>
      <td style={{ padding: 8 }}>
        <MarkdownInput
          value={sound.text}
          onChange={handleTextChanged}
          />
      </td>
      <td style={{ padding: 8 }}>&nbsp;</td>
    </tr>
  );

  return (
    <table style={{ width: '100%' }}>
      <colgroup>
        <col style={{ width: 80, minWidth: 80 }} />
        <col style={{ width: 168, minWidth: 168 }} />
        <col />
        <col style={{ width: 48, minWidth: 48 }} />
      </colgroup>
      <tbody>
        {renderSourceRow()}
        {sound.sourceType !== 'midi' && renderUrlRow()}
        {sound.sourceType !== SOUND_SOURCE_TYPE.midi && renderTextRow()}
      </tbody>
    </table>
  );
}

EarTrainingSoundEditor.propTypes = {
  onSoundChanged: PropTypes.func.isRequired,
  sound: PropTypes.shape({
    sourceType: PropTypes.string.isRequired,
    sourceUrl: PropTypes.string,
    text: PropTypes.string
  }).isRequired
};

export default EarTrainingSoundEditor;
