/* eslint-disable no-console, max-len */

import by from 'thenby';
import PropTypes from 'prop-types';
import Timeline from '../timeline.js';
import MediaPlayer from '../media-player.js';
import React, { useRef, useState } from 'react';
import ResourcePicker from '../resource-picker.js';
import { useRequest } from '../request-context.js';
import ResourceSelector from '../resource-selector.js';
import { removeItemAt } from '../../utils/array-utils.js';
import { Button, Form, Input, InputNumber, Radio, Tabs } from 'antd';
import NeverScrollingTextArea from '../never-scrolling-text-area.js';
import { HORIZONTAL_ALIGNMENT, MEDIA_SCREEN_MODE, STORAGE_LOCATION_TYPE, VERTICAL_ALIGNMENT } from '../../domain/constants.js';
import MediaRangeSelector from '../media-range-selector.js';

const { TabPane } = Tabs;

let timelineCounter = 0;
const createTimelinePart = (startPosition = 0) => {
  timelineCounter += 1;
  const key = `Part ${timelineCounter}`;
  return { key, title: key, startPosition };
};

function Tests({ PageTemplate }) {
  // Page
  const req = useRequest();
  const initialTab = req.query.tab || null;
  const handleTabChange = newTab => {
    const url = new URL(window.document.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState(null, null, url.href);
  };

  // Timeline
  const [timelineDuration, setTimelineDuration] = useState(5 * 60 * 1000);
  const [timelineParts, setTimelineParts] = useState([createTimelinePart(0), createTimelinePart(0.25), createTimelinePart(0.5)]);
  const handleTimelinePartAdd = startPosition => {
    setTimelineParts(oldParts => [...oldParts, createTimelinePart(startPosition)].sort(by(p => p.startTimecode)));
  };
  const handleTimelinePartDelete = key => {
    const partIndex = timelineParts.findIndex(p => p.key === key);
    const deletedPartTimeCode = timelineParts[partIndex].startTimecode;
    const newParts = removeItemAt(timelineParts, partIndex);
    const followingPart = newParts[partIndex];
    if (followingPart) {
      followingPart.startTimecode = deletedPartTimeCode;
    }
    setTimelineParts(newParts.sort(by(p => p.startTimecode)));
  };
  const handleTimelineStartTimecodeChange = (key, newValue) => {
    setTimelineParts(oldParts => oldParts.map(p => p.key === key ? { ...p, startTimecode: newValue } : p).sort(by(p => p.startTimecode)));
  };

  // MediaRangeSelector
  const [mrsSource, setMrsSource] = useState('');
  const [mrsRange, setMrsRange] = useState([0, 1]);

  // MediaPlayer
  const mpPlayerRef = useRef();
  const mpEventLogRef = useRef();
  const [mpSource, setMpSource] = useState('');
  const [mpEventLog, setMpEventLog] = useState('');
  const [mpScreenMode, setMpScreenMode] = useState(MEDIA_SCREEN_MODE.none);
  const handleMpEvent = (eventName, ...args) => {
    setMpEventLog(currentLog => `${currentLog}${eventName}: ${JSON.stringify(args.length > 1 ? args : args[0])}\n`);
    setTimeout(() => {
      const textarea = mpEventLogRef.current;
      textarea.scrollTop = textarea.scrollHeight;
    }, 0);
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

  return (
    <PageTemplate>
      <div className="TestsPage">
        <Tabs defaultActiveKey={initialTab} onChange={handleTabChange} destroyInactiveTabPane>
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
              onStartTimecodeChange={handleTimelineStartTimecodeChange}
              />
          </TabPane>
          <TabPane tab="MediaRangeSelector" key="MediaRangeSelector">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              Source:
              <Input value={mrsSource} readOnly />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Button onClick={() => setMrsSource('')}>Reset</Button>
              <Button onClick={() => setMrsSource('https://www.youtube.com/watch?v=H3hBitGg_NI')}>Set to YouTube</Button>
              <Button onClick={() => setMrsSource('https://cdn.openmusic.academy/media/fQugKEp8XCKJTVKVhiRdeJ/2022-04-05-5-te-sinfonie-v1-bLf7WqJAaf4y8AsPRnWG8R.mp4')}>Set to External</Button>
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
                  <Button onClick={() => setMpSource('https://www.youtube.com/watch?v=H3hBitGg_NI')}>Set to YouTube</Button>
                  <Button onClick={() => setMpSource('https://cdn.openmusic.academy/media/fQugKEp8XCKJTVKVhiRdeJ/2022-04-05-5-te-sinfonie-v1-bLf7WqJAaf4y8AsPRnWG8R.mp4')}>Set to External</Button>
                </div>
                <div>{typeof mpSource === 'function' ? '<FUNC>' : String(mpSource)}</div>
                <h6>Screen mode</h6>
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
        </Tabs>
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
