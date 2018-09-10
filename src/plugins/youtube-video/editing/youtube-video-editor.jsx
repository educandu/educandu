const url = require('url');
const React = require('react');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

function parseVideoIdFromYouTubeUrl(urlString) {
  const videoId = urlString && url.parse(urlString, true).query.v;
  return videoId || null;
}

function isYouTubeUrl(value) {
  return value && (/^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=\w+$/i).test(value);
}

function sanitizeVideoIdValue(value) {
  return isYouTubeUrl(value) ? parseVideoIdFromYouTubeUrl(value) : value;
}

class YoutubeVideoEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleVideoIdValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ videoId: value });
  }

  handleVideoIdBlur() {
    const { content } = this.props;
    const { videoId } = content;
    this.changeContent({ videoId: sanitizeVideoIdValue(videoId) || null });
  }

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content } = this.props;
    const { videoId, maxWidth } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label="Video-ID" {...formItemLayout}>
            <Input placeholder="Video-ID oder URL" value={videoId} onChange={this.handleVideoIdValueChanged} onBlur={this.handleVideoIdBlur} />
          </Form.Item>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

YoutubeVideoEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = YoutubeVideoEditor;
