/* eslint-disable no-console, max-len */

import { Collapse, Form, Input } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import ResourcePicker from '../resource-picker.js';
import NeverScrollingTextArea from '../never-scrolling-text-area.js';
import { HORIZONTAL_ALIGNMENT, STORAGE_LOCATION_TYPE, VERTICAL_ALIGNMENT } from '../../domain/constants.js';
import ResourceSelector from '../resource-selector.js';

const { Panel } = Collapse;

function Tests({ PageTemplate }) {
  const [ta1, setTa1] = useState('Hello World');
  const [ta2, setTa2] = useState('Hello World');
  const [ta3, setTa3] = useState('Hello World');
  const [ta4, setTa4] = useState('Hello World');
  const [ta5, setTa5] = useState('Hello World');
  const [ta6, setTa6] = useState('Hello World');
  const [resourceUrl, setResourceUrl] = useState('');

  return (
    <PageTemplate>
      <div className="TestsPage">
        <Collapse defaultActiveKey={['1']} accordion>
          <Panel header="ResourceSelector" key="1">
            <ResourceSelector
              allowedLocationTypes={Object.values(STORAGE_LOCATION_TYPE)}
              onSelect={ev => console.log('select', ev)}
              onCancel={ev => console.log('cancel', ev)}
              />
          </Panel>
          <Panel header="ResourcePicker" key="2">
            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr auto' }}>
              <Input
                value={resourceUrl}
                onChange={event => setResourceUrl(event.target.value)}
                />
              <ResourcePicker
                url={resourceUrl}
                onUrlChange={setResourceUrl}
                />
            </div>
          </Panel>
          <Panel header="NeverScrollingTextArea" key="3">
            <h4>Grid aligned</h4>
            <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px' }}>
              <NeverScrollingTextArea value={ta1} onChange={event => setTa1(event.target.value)} minRows={3} />
              <NeverScrollingTextArea value={ta2} onChange={event => setTa2(event.target.value)} minRows={4} />
              <NeverScrollingTextArea value={ta3} onChange={event => setTa3(event.target.value)} minRows={5} />
            </div>
            <br />
            <h4>Alignment</h4>
            <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px', minHeight: '100px' }}>
              <NeverScrollingTextArea value={ta4} onChange={event => setTa4(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.top} horizontalAlignment={HORIZONTAL_ALIGNMENT.left} />
              <NeverScrollingTextArea value={ta5} onChange={event => setTa5(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.middle} horizontalAlignment={HORIZONTAL_ALIGNMENT.center} />
              <NeverScrollingTextArea value={ta6} onChange={event => setTa6(event.target.value)} minRows={1} verticalAlignment={VERTICAL_ALIGNMENT.bottom} horizontalAlignment={HORIZONTAL_ALIGNMENT.right} />
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
          </Panel>
        </Collapse>
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
