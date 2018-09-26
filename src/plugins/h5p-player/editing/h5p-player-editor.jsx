/* eslint react/jsx-max-depth: 0 */

const React = require('react');
const autoBind = require('auto-bind');
const Icon = require('antd/lib/icon');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const PropTypes = require('prop-types');
const Upload = require('antd/lib/upload');
const Button = require('antd/lib/button');
const message = require('antd/lib/message');
const urls = require('../../../utils/urls');
const HttpClient = require('../../../services/http-client');
const { inject } = require('../../../components/container-context.jsx');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

const FormItem = Form.Item;

class H5pPlayerEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  async onCustomUpload({ file, onProgress, onSuccess }) {
    const { httpClient } = this.props;

    const hide = message.loading('Datei-Upload', 0);

    const pluginPrefix = urls.getPluginApiPathPrefix('h5p-player');
    const uploadUrl = urls.concatParts(pluginPrefix, 'upload');

    const { applicationId } = await httpClient
      .post(uploadUrl)
      .accept('json')
      .attach('file', file, file.name)
      .on('progress', onProgress)
      .then(res => res.body);

    onSuccess();
    hide();

    this.changeContent({ applicationId });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content } = this.props;
    const { applicationId, maxWidth } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label="Content-ID" {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                value={applicationId}
                readOnly
                />
              <div style={{ flex: 'none' }}>
                <Upload
                  showUploadList={false}
                  customRequest={this.onCustomUpload}
                  >
                  <Button><Icon type="upload" /> Datei auswählen</Button>
                </Upload>
              </div>
            </div>
          </FormItem>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

H5pPlayerEditor.propTypes = {
  ...sectionEditorProps,
  httpClient: PropTypes.instanceOf(HttpClient).isRequired
};


module.exports = inject({
  httpClient: HttpClient
}, H5pPlayerEditor);
