/* eslint-disable no-console, max-len */

import by from 'thenby';
import PropTypes from 'prop-types';
import Timeline from '../timeline.js';
import MediaPlayer from '../media-player.js';
import ImageEditor from '../image-editor.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import { removeItemAt } from '../../utils/array-utils.js';
import React, { useEffect, useRef, useState } from 'react';
import MediaRangeSelector from '../media-range-selector.js';
import ResourcePicker from '../resource-picker/resource-picker.js';
import { Button, Form, Input, InputNumber, Radio, Tabs } from 'antd';
import NeverScrollingTextArea from '../never-scrolling-text-area.js';
import ResourceSelector from '../resource-picker/resource-selector.js';
import MultitrackMediaInfo from '../../plugins/multitrack-media/multitrack-media-info.js';
import MultitrackMediaEditor from '../../plugins/multitrack-media/multitrack-media-editor.js';
import MultitrackMediaDisplay from '../../plugins/multitrack-media/multitrack-media-display.js';
import { createDefaultSecondaryTrack } from '../../plugins/multitrack-media/multitrack-media-utils.js';
import { HORIZONTAL_ALIGNMENT, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE, STORAGE_LOCATION_TYPE, VERTICAL_ALIGNMENT } from '../../domain/constants.js';

const { TabPane } = Tabs;

const IMAGE_URL_JPG = 'https://cdn.openmusic.academy/media/4WqqhJRDsogBFGVbZrfuaF/Banner_hGsJz5kf2pGsXygBX8ZJ97.jpg';
const IMAGE_URL_PNG = 'https://cdn.openmusic.academy/media/2Sss3iioh1dpoBnYPTq9Rn/Bossa%20Nova%20Groovetabelle_aWvhsm8RX9hXFRrF3hk4Pu.png';
const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch?v=H3hBitGg_NI';
const EXTERNAL_VIDEO_URL = 'https://cdn.openmusic.academy/media/fQugKEp8XCKJTVKVhiRdeJ/2022-04-05-5-te-sinfonie-v1-bLf7WqJAaf4y8AsPRnWG8R.mp4';

const createTimelinePart = (startPosition, key) => ({ key, title: `Part ${key}`, startPosition });

function Tests({ PageTemplate }) {
  // Page
  const req = useRequest();
  const initialTab = req.query.tab || null;
  const handleTabChange = newTab => {
    const url = new URL(window.document.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState(null, null, url.href);
  };

  // ImageEditor
  const ieEditorRef = useRef(null);
  const [ieFile, setIeFile] = useState(null);
  const [ieIsDirty, setIeIsDirty] = useState(false);
  const [ieFileUrl, setIeFileUrl] = useState(IMAGE_URL_JPG);
  useEffect(() => {
    const type = ieFileUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const extension = type === 'image/png' ? 'png' : 'jpg';
    fetch(ieFileUrl)
      .then(res => res.blob())
      .then(blob => setIeFile(new File([blob], `my-image.${extension}`, { type })));
  }, [ieFileUrl]);
  const handleIeCrop = data => {
    setIeIsDirty(data.isCropped);
  };
  const handleIeDownloadClick = async () => {
    const newFile = await ieEditorRef.current.getCroppedFile();
    const newUrl = URL.createObjectURL(newFile);
    window.open(newUrl, '_blank');
  };

  // Timeline
  const [timelineDuration, setTimelineDuration] = useState(5 * 60 * 1000);
  const [timelineParts, setTimelineParts] = useState([createTimelinePart(0, '1'), createTimelinePart(0.25, '2'), createTimelinePart(0.5, '3')]);
  const handleTimelinePartAdd = startPosition => {
    setTimelineParts(oldParts => [
      ...oldParts,
      createTimelinePart(startPosition, `${Math.max(...oldParts.map(p => Number(p.key))) + 1}`)
    ].sort(by(p => p.startPosition)));
  };
  const handleTimelinePartDelete = key => {
    const partIndex = timelineParts.findIndex(p => p.key === key);
    const deletedPartTimeCode = timelineParts[partIndex].startPosition;
    const newParts = removeItemAt(timelineParts, partIndex);
    const followingPart = newParts[partIndex];
    if (followingPart) {
      followingPart.startPosition = deletedPartTimeCode;
    }
    setTimelineParts(newParts.sort(by(p => p.startPosition)));
  };
  const handleTimelineStartPositionChange = (key, newValue) => {
    setTimelineParts(oldParts => oldParts.map(p => p.key === key ? { ...p, startPosition: newValue } : p).sort(by(p => p.startTimecode)));
  };

  // MediaRangeSelector
  const [mrsSource, setMrsSource] = useState('');
  const [mrsRange, setMrsRange] = useState([0, 1]);

  // MediaPlayer
  const mpPlayerRef = useRef();
  const mpEventLogRef = useRef();
  const [mpRange, setMpRange] = useState([0, 1]);
  const [mpEventLog, setMpEventLog] = useState('');
  const [mpSource, setMpSource] = useState(EXTERNAL_VIDEO_URL);
  const [mpScreenMode, setMpScreenMode] = useState(MEDIA_SCREEN_MODE.video);
  const handleMpEvent = (eventName, ...args) => {
    setMpEventLog(currentLog => args.length
      ? `${currentLog}${eventName}: ${JSON.stringify(args.length > 1 ? args : args[0])}\n`
      : `${currentLog}${eventName}\n`);
    setTimeout(() => {
      const textarea = mpEventLogRef.current;
      textarea.scrollTop = textarea.scrollHeight;
    }, 0);
  };
  const handleRandomPlaybackRangeClick = () => {
    let newRange = [0, 0];
    while (newRange[1] - newRange[0] < 0.1) {
      newRange = [Math.random(), Math.random()].sort();
    }
    setMpRange(newRange);
  };

  // ResourcePicker
  const [rsResourceUrl, setRsResourceUrl] = useState('');

  // NeverScrollingTextArea
  const [nstaValue1, setNstaValue1] = useState('Hello World');
  const [nstaValue2, setNstaValue2] = useState('Hello World');
  const [nstaValue3, setNstaValue3] = useState('Hello World');
  const [nstaValue4, setNstaValue4] = useState('Hello World');
  const [nstaValue5, setNstaValue5] = useState('Hello World');
  const [nstaValue6, setNstaValue6] = useState('Hello World');

  // MultitrackMediaPlugin
  const multitrackMediaInfo = useService(MultitrackMediaInfo);
  const { t: multitrackTranslation } = useTranslation('multitrackMedia');
  const multitrackContent = multitrackMediaInfo.getDefaultContent(multitrackTranslation);
  // ------ Setup option 1 -----
  // multitrackContent.mainTrack.name = 'Generalbass';
  // multitrackContent.mainTrack.sourceType = MEDIA_SOURCE_TYPE.external;
  // multitrackContent.mainTrack.sourceUrl = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-generalbass-hq8W2YhjhmGKkr44kNrPUE.mp3';
  // multitrackContent.secondaryTracks = [
  //   {
  //     ...createDefaultSecondaryTrack(0, multitrackTranslation),
  //     name: 'Violine 1',
  //     sourceType: MEDIA_SOURCE_TYPE.external,
  //     sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-violine-1-dcFUAwCCA5TGjNoTUjrpPQ.mp3'
  //   }, {
  //     ...createDefaultSecondaryTrack(1, multitrackTranslation),
  //     name: 'Violine 2',
  //     sourceType: MEDIA_SOURCE_TYPE.external,
  //     sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-violine-2-d918ZmitwuCjKCAYaJvWtS.mp3'
  //   }, {
  //     ...createDefaultSecondaryTrack(2, multitrackTranslation),
  //     name: 'Violoncello',
  //     sourceType: MEDIA_SOURCE_TYPE.external,
  //     sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/corelli-violoncello-ek8KcohkALHpF8QP2uH1No.mp3'
  //   }
  // ];
  // ------ Setup option 2 -----
  multitrackContent.mainTrack.name = 'Dubstep';
  multitrackContent.mainTrack.sourceType = MEDIA_SOURCE_TYPE.external;
  multitrackContent.mainTrack.sourceUrl = 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-9hqADKZtPHV7F7GVfye3DF.mp3';
  multitrackContent.secondaryTracks = [
    {
      ...createDefaultSecondaryTrack(0, multitrackTranslation),
      name: 'Bass growls',
      sourceType: MEDIA_SOURCE_TYPE.external,
      sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-bass-growls-c9Z4K6PSm7k7onNHh4eFLv.mp3'
    }, {
      ...createDefaultSecondaryTrack(1, multitrackTranslation),
      name: 'Bass sub',
      sourceType: MEDIA_SOURCE_TYPE.external,
      sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-bass-sub-xseNKq1gTc3sMrvYhp4Ryk.mp3'
    }, {
      ...createDefaultSecondaryTrack(2, multitrackTranslation),
      name: 'Chords',
      sourceType: MEDIA_SOURCE_TYPE.external,
      sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-chords-p1z7vpBgGLQ75okxsd9ZiQ.mp3'
    }, {
      ...createDefaultSecondaryTrack(3, multitrackTranslation),
      name: 'Drums',
      sourceType: MEDIA_SOURCE_TYPE.external,
      sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-drums-bTRHpx9cta63Q3MQP52VG5.mp3'
    }, {
      ...createDefaultSecondaryTrack(4, multitrackTranslation),
      name: 'FX',
      sourceType: MEDIA_SOURCE_TYPE.external,
      sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-fx-2AEEYbQBiRXmRvNWCGhkzZ.mp3'
    }, {
      ...createDefaultSecondaryTrack(5, multitrackTranslation),
      name: 'Lead bell',
      sourceType: MEDIA_SOURCE_TYPE.external,
      sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-lead-bell-rxF9rWsV5cwxzDwiM6CH5W.mp3'
    }, {
      ...createDefaultSecondaryTrack(6, multitrackTranslation),
      name: 'Lead synth',
      sourceType: MEDIA_SOURCE_TYPE.external,
      sourceUrl: 'https://cdn.staging.openmusic.academy/media/toEHvnaG67zkNJEp9Ev9tu/groove-lexikon-dubstep-lead-synth-ghymhFnZ8fc3VVW65PHmB5.mp3'
    }
  ];
  const [multitrackMediaContent, setMultitrackMediaContent] = useState(multitrackContent);
  const handleMultitrackMediaEditorContentChange = content => setMultitrackMediaContent(content);

  return (
    <PageTemplate>
      <div className="TestsPage">
        <Tabs defaultActiveKey={initialTab} onChange={handleTabChange} destroyInactiveTabPane>
          <TabPane tab="ImageEditor" key="ImageEditor">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Button onClick={() => setIeFileUrl(IMAGE_URL_PNG)}>Set to PNG</Button>
              <Button onClick={() => setIeFileUrl(IMAGE_URL_JPG)}>Set to JPG</Button>
              <Button onClick={handleIeDownloadClick}>Download</Button>
              <div>DIRTY: {ieIsDirty.toString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              URL: {ieFileUrl}
            </div>
            {ieFile && (
              <div style={{ height: '50vh' }}>
                <ImageEditor file={ieFile} editorRef={ieEditorRef} onCrop={handleIeCrop} />
              </div>
            )}
          </TabPane>
          <TabPane tab="Timeline" key="Timeline">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              Duration in milliseconds:
              <InputNumber min={0} max={Number.MAX_SAFE_INTEGER} step={1} value={timelineDuration} onChange={setTimelineDuration} />
              <Button onClick={() => setTimelineDuration(0)}>Set to unknown</Button>
              <Button onClick={() => setTimelineDuration(5 * 60 * 1000)}>Set to 5 minutes</Button>
              <Button onClick={() => setTimelineDuration(10 * 60 * 1000)}>Set to 10 minutes</Button>
            </div>
            <Timeline
              durationInMilliseconds={timelineDuration}
              parts={timelineParts}
              selectedPartIndex={-1}
              onPartAdd={handleTimelinePartAdd}
              onPartDelete={handleTimelinePartDelete}
              onStartPositionChange={handleTimelineStartPositionChange}
              />
          </TabPane>
          <TabPane tab="MediaRangeSelector" key="MediaRangeSelector">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              Source:
              <Input value={mrsSource} readOnly />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Button onClick={() => setMrsSource('')}>Reset</Button>
              <Button onClick={() => setMrsSource(YOUTUBE_VIDEO_URL)}>Set to YouTube</Button>
              <Button onClick={() => setMrsSource(EXTERNAL_VIDEO_URL)}>Set to External</Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              Range: {JSON.stringify(mrsRange)}
            </div>
            <MediaRangeSelector
              sourceUrl={mrsSource}
              range={mrsRange}
              onRangeChange={setMrsRange}
              />
          </TabPane>
          <TabPane tab="MediaPlayer" key="MediaPlayer">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div>
                <MediaPlayer
                  source={mpSource}
                  playbackRange={mpRange}
                  screenMode={mpScreenMode}
                  mediaPlayerRef={mpPlayerRef}
                  onPartEndReached={(...args) => handleMpEvent('onPartEndReached', ...args)}
                  onEndReached={(...args) => handleMpEvent('onEndReached', ...args)}
                  onPlayStateChange={(...args) => handleMpEvent('onPlayStateChange', ...args)}
                  onPlayingPartIndexChange={(...args) => handleMpEvent('onPlayingPartIndexChange', ...args)}
                  onReady={(...args) => handleMpEvent('onReady', ...args)}
                  onSeek={(...args) => handleMpEvent('onSeek', ...args)}
                  />
              </div>
              <div>
                <h6>Source</h6>
                <div>
                  <Button onClick={() => setMpSource(YOUTUBE_VIDEO_URL)}>Set to YouTube</Button>
                  <Button onClick={() => setMpSource(EXTERNAL_VIDEO_URL)}>Set to External</Button>
                </div>
                <div>{typeof mpSource === 'function' ? '<FUNC>' : String(mpSource)}</div>
                <h6 style={{ marginTop: '15px' }}>Media Range</h6>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto) 1fr', gap: '25px', alignItems: 'center' }}>
                  <Button onClick={handleRandomPlaybackRangeClick}>Set to random value</Button>
                  <MediaRangeSelector
                    range={mpRange}
                    sourceUrl={mpSource}
                    onRangeChange={setMpRange}
                    />
                  <div>{mpRange[0].toFixed(2)} &ndash; {mpRange[1].toFixed(2)}</div>
                </div>
                <h6 style={{ marginTop: '15px' }}>Screen mode</h6>
                <Radio.Group value={mpScreenMode} onChange={event => setMpScreenMode(event.target.value)}>
                  {Object.values(MEDIA_SCREEN_MODE).map(sm => <Radio.Button key={sm} value={sm}>{sm}</Radio.Button>)}
                </Radio.Group>
                <h6 style={{ marginTop: '15px' }}>Programmatic control</h6>
                <div>
                  <Button onClick={() => mpPlayerRef.current.play()}>play</Button>
                  <Button onClick={() => mpPlayerRef.current.pause()}>pause</Button>
                  <Button onClick={() => mpPlayerRef.current.togglePlay()}>togglePlay</Button>
                  <Button onClick={() => mpPlayerRef.current.reset()}>reset</Button>
                </div>
                <h6 style={{ marginTop: '15px' }}>Event Log</h6>
                <div ref={mpEventLogRef} style={{ height: '140px', overflow: 'auto', border: '1px solid #ddd', backgroundColor: '#fbfbfb', fontSize: '10px' }}>
                  <pre>{mpEventLog}</pre>
                </div>
              </div>
            </div>
          </TabPane>
          <TabPane tab="ResourceSelector" key="ResourceSelector">
            <ResourceSelector
              allowedLocationTypes={Object.values(STORAGE_LOCATION_TYPE)}
              onSelect={ev => console.log('select', ev)}
              onCancel={ev => console.log('cancel', ev)}
              />
          </TabPane>
          <TabPane tab="ResourcePicker" key="ResourcePicker">
            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr auto' }}>
              <Input
                value={rsResourceUrl}
                onChange={event => setRsResourceUrl(event.target.value)}
                />
              <ResourcePicker
                url={rsResourceUrl}
                onUrlChange={setRsResourceUrl}
                />
            </div>
          </TabPane>
          <TabPane tab="NeverScrollingTextArea" key="NeverScrollingTextArea">
            <h4>Grid aligned</h4>
            <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px' }}>
              <NeverScrollingTextArea value={nstaValue1} onChange={event => setNstaValue1(event.target.value)} minRows={3} />
              <NeverScrollingTextArea value={nstaValue2} onChange={event => setNstaValue2(event.target.value)} minRows={4} />
              <NeverScrollingTextArea value={nstaValue3} onChange={event => setNstaValue3(event.target.value)} minRows={5} />
            </div>
            <br />
            <h4>Alignment</h4>
            <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px', minHeight: '100px' }}>
              <NeverScrollingTextArea value={nstaValue4} onChange={event => setNstaValue4(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.top} horizontalAlignment={HORIZONTAL_ALIGNMENT.left} />
              <NeverScrollingTextArea value={nstaValue5} onChange={event => setNstaValue5(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.middle} horizontalAlignment={HORIZONTAL_ALIGNMENT.center} />
              <NeverScrollingTextArea value={nstaValue6} onChange={event => setNstaValue6(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.bottom} horizontalAlignment={HORIZONTAL_ALIGNMENT.right} />
            </div>
            <br />
            <h4>Within Form</h4>
            <Form initialValues={{ ta1: 'Hello World', ta2: 'Hello World', ta3: 'Hello World', ta4: 'Hello World', ta5: 'Hello World', ta6: 'Hello World' }}>
              <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px' }}>
                <Form.Item name="ta1" validateStatus="success" hasFeedback>
                  <NeverScrollingTextArea minRows={3} />
                </Form.Item>
                <Form.Item name="ta2" validateStatus="warning" hasFeedback>
                  <NeverScrollingTextArea minRows={4} />
                </Form.Item>
                <Form.Item name="ta3" validateStatus="error" hasFeedback>
                  <NeverScrollingTextArea minRows={5} />
                </Form.Item>
                <Form.Item name="ta4" validateStatus="validating" hasFeedback>
                  <NeverScrollingTextArea minRows={3} />
                </Form.Item>
                <Form.Item name="ta5">
                  <NeverScrollingTextArea minRows={4} disabled />
                </Form.Item>
                <Form.Item name="ta6" validateStatus="error" hasFeedback>
                  <NeverScrollingTextArea minRows={5} disabled />
                </Form.Item>
              </div>
            </Form>
          </TabPane>
          <TabPane tab="MultitrackMediaPlugin" key="MultitrackMediaPlugin">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '25px' }}>
              <div>
                <h4>Display</h4>
                <MultitrackMediaDisplay content={multitrackMediaContent} />
              </div>
              <div>
                <h4>Editor</h4>
                <MultitrackMediaEditor content={multitrackMediaContent} onContentChanged={handleMultitrackMediaEditorContentChange} />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
