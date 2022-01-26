import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { PieChartOutlined } from '@ant-design/icons';

export default class DiagramNet {
  static get typeName() { return 'diagram-net'; }

  constructor() {
    this.type = 'diagram-net';
  }

  getName(t) {
    return t('diagramNet:name');
  }

  getIcon() {
    return <PieChartOutlined />;
  }

  getDefaultContent() {
    return {
      xml: null,
      image: null,
      maxWidth: 100
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}
