import React from 'react';
import { Progress } from 'antd';
import PropTypes from 'prop-types';

function convertBytesToHigherUnit(bytes) {
  const kilobytes = bytes / 1000;
  if (kilobytes < 1000) {
    return `${kilobytes} KB`;
  }
  const megabytes = kilobytes / 1000;
  if (megabytes < 1000) {
    return `${megabytes} MB`;
  }
  const gigabytes = megabytes / 1000;
  return `${gigabytes} GB`;
}

function UsedStorage({ usedBytes, maxBytes }) {
  const format = percent => `${percent} %`;
  const percent = usedBytes * 100 / maxBytes;
  const status = percent >= 95 ? 'exception' : 'normal';

  const maxSpace = convertBytesToHigherUnit(maxBytes);
  const usedSpace = convertBytesToHigherUnit(usedBytes);

  return (
    <div className="UsedStorage">
      <Progress
        className="UserStorage-progress"
        strokeLinecap="square"
        percent={percent}
        status={status}
        format={format}
        />
      <span className="UsedStorage-value">{`${usedSpace} / ${maxSpace}`}</span>
    </div>

  );
}

UsedStorage.propTypes = {
  maxBytes: PropTypes.number.isRequired,
  usedBytes: PropTypes.number.isRequired
};

export default UsedStorage;
