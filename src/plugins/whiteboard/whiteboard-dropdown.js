import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

export default function WhiteboardDropdown({ children, title }) {

  const node = useRef();
  const [isOpen, setIsOpen] = useState(false);

  const clickOutside = e => {
    if (node && !node.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', clickOutside);
    return () => {
      document.removeEventListener('mousedown', clickOutside);
    };
  }, []);

  return (
    <div className="dropdown" style={{ position: 'relative' }} ref={node}>
      <button type="button" onClick={() => { setIsOpen(!isOpen); }}>{title}</button>
      <div
        className="bg-white dropdown-content shadow br-7"
        style={{
          position: 'absolute',
          left: '105%',
          top: 0,
          zIndex: 9999,
          overflow: 'hidden',
          display: isOpen ? 'block' : 'none'
        }}
        >
        {children}
      </div>
    </div>
  );
}

WhiteboardDropdown.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired
};
