import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import { Input, Radio } from 'antd';
import { withTranslation } from 'react-i18next';
import ClientConfig from '../../../bootstrap/client-config.js';
import { inject } from '../../../components/container-context.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { clientConfigProps, translationProps } from '../../../ui/default-prop-types.js';

const { TextArea } = Input;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

class EarTrainingSoundEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  changeSound(newValues) {
    const { sound, testIndex, onSoundChanged } = this.props;
    onSoundChanged({
      testIndex,
      sound: { ...sound, ...newValues }
    });
  }

  handleSoundTypeChanged(event) {
    const { value } = event.target;
    const { sound } = this.props;
    this.changeSound({
      type: value,
      url: value === 'midi' ? null : '',
      text: value === 'midi' ? null : sound.text || ''
    });
  }

  handleExternalUrlChanged(event) {
    const { value } = event.target;
    this.changeSound({ url: value });
  }

  handleInternalUrlChanged(value) {
    this.changeSound({ url: value });
  }

  handleTextChanged(event) {
    const { value } = event.target;
    this.changeSound({ text: value });
  }

  render() {
    const { docKey, sound, t } = this.props;

    const sourceRow = (
      <tr>
        <td style={{ padding: 8 }}>&nbsp;</td>
        <td style={{ padding: 8 }}>{t('audioSource')}:</td>
        <td style={{ padding: 8 }}>
          <RadioGroup
            value={sound.type}
            onChange={this.handleSoundTypeChanged}
            >
            <RadioButton value="midi">{t('midi')}</RadioButton>
            <RadioButton value="external">{t('externalLink')}</RadioButton>
            <RadioButton value="internal">{t('elmuCdn')}</RadioButton>
          </RadioGroup>
        </td>
        <td style={{ padding: 8 }}>&nbsp;</td>
      </tr>
    );

    const urlRow = sound.type === 'midi'
      ? null
      : (
        <tr>
          <td style={{ padding: 8 }}>&nbsp;</td>
          <td style={{ padding: 8 }}>
            {sound.type === 'external' && `${t('externalUrl')}:`}
            {sound.type === 'internal' && `${t('internalUrl')}:`}
          </td>
          <td style={{ padding: 8 }}>
            {sound.type === 'external' && (
              <Input
                value={sound.url}
                onChange={this.handleExternalUrlChanged}
                />
            )}
            {sound.type === 'internal' && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${this.props.clientConfig.cdnRootUrl}/`}
                  value={sound.url}
                  readOnly
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  uploadPrefix={`media/${docKey}`}
                  initialPrefix={`media/${docKey}`}
                  fileName={sound.url}
                  onFileNameChanged={this.handleInternalUrlChanged}
                  />
              </div>
            )}
          </td>
          <td style={{ padding: 8 }}>&nbsp;</td>
        </tr>
      );

    const textRow = sound.type === 'midi'
      ? null
      : (
        <tr>
          <td style={{ padding: 8 }}>&nbsp;</td>
          <td style={{ padding: 8 }}>{t('copyrightInfos')}:</td>
          <td style={{ padding: 8 }}>
            <TextArea
              value={sound.text}
              autoSize={{ minRows: 3 }}
              onChange={this.handleTextChanged}
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
          {sourceRow}
          {urlRow}
          {textRow}
        </tbody>
      </table>
    );
  }
}

EarTrainingSoundEditor.propTypes = {
  ...translationProps,
  ...clientConfigProps,
  docKey: PropTypes.string.isRequired,
  onSoundChanged: PropTypes.func.isRequired,
  sound: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string,
    text: PropTypes.string
  }).isRequired,
  testIndex: PropTypes.number.isRequired
};

export default withTranslation('earTraining')(inject({
  clientConfig: ClientConfig
}, EarTrainingSoundEditor));
