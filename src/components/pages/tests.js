/* eslint-disable no-console */

import { Form, Input } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import ResourcePicker from '../resource-picker.js';
import NeverScrollingTextArea from '../never-scrolling-text-area.js';

function Tests({ PageTemplate }) {
  const [ta1, setTa1] = useState('Hello World');
  const [ta2, setTa2] = useState('Hello World');
  const [ta3, setTa3] = useState('Hello World');
  const [resourceUrl, setResourceUrl] = useState('');

  return (
    <PageTemplate>
      <div className="TestsPage">
        <h1>NeverScrollingTextArea (grid-aligned)</h1>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: '#f5f5f5', padding: '5px' }}>
          <NeverScrollingTextArea value={ta1} onChange={event => setTa1(event.target.value)} minRows={3} />
          <NeverScrollingTextArea value={ta2} onChange={event => setTa2(event.target.value)} minRows={4} />
          <NeverScrollingTextArea value={ta3} onChange={event => setTa3(event.target.value)} minRows={5} />
        </div>
        <h1>NeverScrollingTextArea (in Form)</h1>
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
        <h1>ResourcePicker</h1>
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
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;
