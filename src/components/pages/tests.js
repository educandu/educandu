/* eslint-disable no-console, max-len */

import PropTypes from 'prop-types';
import MediaPlayer from '../media-player.js';
import React, { useRef, useState } from 'react';
import { Button, Form, Input, Tabs } from 'antd';
import ResourcePicker from '../resource-picker.js';
import { useRequest } from '../request-context.js';
import ResourceSelector from '../resource-selector.js';
import NeverScrollingTextArea from '../never-scrolling-text-area.js';
import { HORIZONTAL_ALIGNMENT, STORAGE_LOCATION_TYPE, VERTICAL_ALIGNMENT } from '../../domain/constants.js';

const { TabPane } = Tabs;

function Tests({ PageTemplate }) {
  // Page
  const req = useRequest();
  const initialTab = req.query.tab || null;
  const handleTabChange = newTab => {
    const url = new URL(window.document.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState(null, null, url.href);
  };

  // MediaPlayer
  const mpPlayerRef = useRef();
  const mpEventLogRef = useRef();
  const [mpSource, setMpSource] = useState(null);
  const [mpEventLog, setMpEventLog] = useState('');
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
          <TabPane tab="MediaPlayer" key="MediaPlayer">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div>
                <MediaPlayer
                  source={mpSource}
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
