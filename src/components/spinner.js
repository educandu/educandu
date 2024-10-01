import React from 'react';
import { Spin } from 'antd';
import PropTypes from 'prop-types';

function Spinner({ tip }) {
  return (
    <Spin size="large" tip={tip} className="Spinner">&nbsp;</Spin>
  );
}

Spinner.propTypes = {
  tip: PropTypes.string
};

Spinner.defaultProps = {
  tip: null
};

export default Spinner;
