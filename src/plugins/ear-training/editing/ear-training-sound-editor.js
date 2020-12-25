const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Input, Radio } = require('antd');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context');
const CdnFilePicker = require('../../../components/cdn-file-picker');
const { clientSettingsProps } = require('../../../ui/default-prop-types');

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
      testIndex: testIndex,
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
    const { docKey, sound } = this.props;

    const sourceRow = (
      <tr>
        <td style={{ paddingTop: '8px' }}>
          Audio-Quelle:
        </td>
        <td style={{ paddingTop: '8px' }}>
          <RadioGroup
            value={sound.type}
            onChange={this.handleSoundTypeChanged}
            >
            <RadioButton value="midi">MIDI (auto)</RadioButton>
            <RadioButton value="external">Externer Link</RadioButton>
            <RadioButton value="internal">Elmu CDN</RadioButton>
          </RadioGroup>
        </td>
      </tr>
    );

    const urlRow = sound.type === 'midi'
      ? null
      : (
        <tr>
          <td style={{ paddingTop: '8px' }}>
            {sound.type === 'external' && 'Externe URL:'}
            {sound.type === 'internal' && 'Interne URL:'}
          </td>
          <td style={{ paddingTop: '8px' }}>
            {sound.type === 'external' && (
              <Input
                value={sound.url}
                onChange={this.handleExternalUrlChanged}
                />
            )}
            {sound.type === 'internal' && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${this.props.clientSettings.cdnRootUrl}/`}
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
        </tr>
      );

    const textRow = sound.type === 'midi'
      ? null
      : (
        <tr>
          <td style={{ paddingTop: '8px' }}>
            Copyright Infos:
          </td>
          <td style={{ paddingTop: '8px' }}>
            <TextArea
              value={sound.text}
              autoSize={{ minRows: 3 }}
              onChange={this.handleTextChanged}
              />
          </td>
        </tr>
      );

    return (
      <table style={{ width: '100%' }}>
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
  docKey: PropTypes.string.isRequired,
  onSoundChanged: PropTypes.func.isRequired,
  sound: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string,
    text: PropTypes.string
  }).isRequired,
  testIndex: PropTypes.number.isRequired,
  ...clientSettingsProps
};

module.exports = inject({
  clientSettings: ClientSettings
}, EarTrainingSoundEditor);
