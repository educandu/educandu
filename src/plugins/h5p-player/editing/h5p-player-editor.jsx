/* eslint react/jsx-max-depth: 0 */

const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const HttpClient = require('../../../services/http-client');
const { Form, Input, Upload, Button, Icon, message } = require('antd');
const { inject } = require('../../../components/container-context.jsx');

const FormItem = Form.Item;

class H5pPlayerEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = { section: props.section };
  }

  shouldComponentUpdate() {
    return true;
  }

  updateContentId(newValue) {
    const oldState = this.state;
    const newState = {
      section: {
        ...oldState.section,
        content: {
          ...oldState.section.content,
          de: {
            contentId: newValue
          }
        }
      }
    };
    this.setState(newState);
    this.props.onContentChanged(newState.section.content);
  }

  async onCustomUpload({ file, onProgress, onSuccess }) {
    const { httpClient } = this.props;

    const hide = message.loading('Datei-Upload', 0);

    const { contentId } = await httpClient
      .post('/plugins/h5p-player/upload')
      .accept('json')
      .attach('file', file, file.name)
      .on('progress', onProgress)
      .then(res => res.body);

    onSuccess();
    hide();

    this.updateContentId(contentId);
  }

  render() {
    const { section } = this.state;

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
                value={section.content.de.contentId}
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
        </Form>
      </div>
    );
  }
}

H5pPlayerEditor.propTypes = {
  onContentChanged: PropTypes.func.isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};


module.exports = inject({
  httpClient: HttpClient
}, H5pPlayerEditor);
