import React from 'react';
import PropTypes from 'prop-types';
import { Input, Radio } from 'antd';
import { SOUND_TYPE } from '../constants.js';
import { useTranslation } from 'react-i18next';
import ClientConfig from '../../../bootstrap/client-config.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { useService } from '../../../components/container-context.js';

const { TextArea } = Input;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function EarTrainingSoundEditor({ sound, onSoundChanged, sectionContainerId }) {
  const { t } = useTranslation('earTraining');
  const clientConfig = useService(ClientConfig);

  const changeSound = newValues => {
    onSoundChanged({ ...sound, ...newValues });
  };

  const handleSoundTypeChanged = event => {
    const { value } = event.target;
    changeSound({
      type: value,
      url: value === SOUND_TYPE.midi ? null : '',
      text: value === SOUND_TYPE.midi ? null : sound.text || ''
    });
  };

  const handleExternalUrlChanged = event => {
    const { value } = event.target;
    changeSound({ url: value });
  };

  const handleInternalUrlChanged = e => {
    changeSound({ url: e.target.value });
  };

  const handleInternalUrlFileNameChanged = value => {
    changeSound({ url: value });
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
          value={sound.type}
          onChange={handleSoundTypeChanged}
          >
          <RadioButton value={SOUND_TYPE.midi}>{t('midi')}</RadioButton>
          <RadioButton value={SOUND_TYPE.external}>{t('externalLink')}</RadioButton>
          <RadioButton value={SOUND_TYPE.internal}>{t('internalCdn')}</RadioButton>
        </RadioGroup>
      </td>
      <td style={{ padding: 8 }}>&nbsp;</td>
    </tr>
  );

  const renderUrlRow = () => (
    <tr>
      <td style={{ padding: 8 }}>&nbsp;</td>
      <td style={{ padding: 8 }}>
        {sound.type === SOUND_TYPE.external && `${t('externalUrl')}:`}
        {sound.type === SOUND_TYPE.internal && `${t('internalUrl')}:`}
      </td>
      <td style={{ padding: 8 }}>
        {sound.type === SOUND_TYPE.external && (
        <Input
          value={sound.url}
          onChange={handleExternalUrlChanged}
          />
        )}
        {sound.type === SOUND_TYPE.internal && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Input
            addonBefore={`${clientConfig.cdnRootUrl}/`}
            value={sound.url}
            onChange={handleInternalUrlChanged}
            />
          <CdnFilePicker
            rootPrefix="media"
            uploadPrefix={`media/${sectionContainerId}`}
            initialPrefix={`media/${sectionContainerId}`}
            fileName={sound.url}
            onFileNameChanged={handleInternalUrlFileNameChanged}
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
      <td style={{ padding: 8 }}>{t('copyrightInfos')}:</td>
      <td style={{ padding: 8 }}>
        <TextArea
          value={sound.text}
          autoSize={{ minRows: 3 }}
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
        {sound.type !== 'midi' && renderUrlRow()}
        {sound.type !== SOUND_TYPE.midi && renderTextRow()}
      </tbody>
    </table>
  );
}

EarTrainingSoundEditor.propTypes = {
  onSoundChanged: PropTypes.func.isRequired,
  sectionContainerId: PropTypes.string.isRequired,
  sound: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string,
    text: PropTypes.string
  }).isRequired
};

export default EarTrainingSoundEditor;
