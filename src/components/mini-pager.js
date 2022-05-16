import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { BackwardOutlined, CaretLeftOutlined, CaretRightOutlined, ForwardOutlined } from '@ant-design/icons';

function MiniPager({ currentPage, totalPages, onNavigate }) {
  return (
    <div className="MiniPager">
      <Button
        type="link"
        className="MiniPager-item"
        disabled={currentPage <= 1}
        onClick={() => onNavigate(1)}
        >
        <BackwardOutlined />
      </Button>
      <Button
        type="link"
        className="MiniPager-item"
        disabled={currentPage <= 1}
        onClick={() => onNavigate(currentPage - 1)}
        >
        <CaretLeftOutlined />
      </Button>
      <span
        className="MiniPager-item"
        >
        {currentPage}&nbsp;/&nbsp;{totalPages}
      </span>
      <Button
        type="link"
        className="MiniPager-item"
        disabled={currentPage >= totalPages}
        onClick={() => onNavigate(currentPage + 1)}
        >
        <CaretRightOutlined />
      </Button>
      <Button
        type="link"
        className="MiniPager-item"
        disabled={currentPage >= totalPages}
        onClick={() => onNavigate(totalPages)}
        >
        <ForwardOutlined />
      </Button>
    </div>
  );
}

MiniPager.propTypes = {
  currentPage: PropTypes.number,
  onNavigate: PropTypes.func,
  totalPages: PropTypes.number
};

MiniPager.defaultProps = {
  currentPage: 1,
  onNavigate: () => {},
  totalPages: 0
};

export default MiniPager;
