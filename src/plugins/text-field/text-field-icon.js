import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function TextFieldIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M916.9 731.21H82.49c-33.3 0-60.29-26.11-60.29-58.32V327.1c0-32.21 26.99-58.32 60.29-58.32H916.9c33.3 0 60.29 26.11 60.29 58.32v345.8c0 32.21-26.99 58.31-60.29 58.31z" style={{ fill: '#f2f2f2' }} />
      <path d="M916.9 750.88H82.49c-44.09 0-79.96-34.98-79.96-77.98V327.1c0-43 35.87-77.98 79.96-77.98H916.9c44.09 0 79.96 34.98 79.96 77.98v345.8c0 43-35.87 77.98-79.96 77.98zM82.49 288.45c-22.4 0-40.63 17.34-40.63 38.65v345.8c0 21.31 18.23 38.65 40.63 38.65H916.9c22.4 0 40.63-17.34 40.63-38.65V327.1c0-21.31-18.22-38.65-40.63-38.65H82.49z" style={{ fill: '#666' }} />
      <path d="M195.86 654.4c-10.86 0-19.67-8.8-19.67-19.67V365.27c0-10.86 8.8-19.67 19.67-19.67s19.67 8.8 19.67 19.67v269.46c-.01 10.86-8.81 19.67-19.67 19.67z" style={{ fill: '#666' }} />
    </svg>
  );
}

function TextFieldIcon() {
  return (
    <Icon component={TextFieldIconComponent} />
  );
}

export default TextFieldIcon;
