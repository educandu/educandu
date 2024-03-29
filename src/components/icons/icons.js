import React from 'react';
import iconNs from '@ant-design/icons';
import LineIconComponent from './svgs/line-icon-component.js';
import {
  IconArrowBackUp,
  IconArrowRight,
  IconBallpen,
  IconBrandSpeedtest,
  IconBrush,
  IconBucketDroplet,
  IconCircle,
  IconCircleSquare,
  IconClick,
  IconDownload,
  IconEraser,
  IconLoader2,
  IconRepeat,
  IconRepeatOff,
  IconRuler3,
  IconSquare,
  IconSquareFilled,
  IconTextCaption,
  IconTextResize,
  IconTriangle,
  IconTypography,
  IconMaximize,
  IconMinimize,
  IconChevronLeft,
  IconChevronRight,
  IconChevronLeftPipe,
  IconZoomScan
} from '@tabler/icons-react';

const Icon = iconNs.default || iconNs;

function createIconFromSvgComponent(SvgComponent) {
  function AntdIconWrapper(props) {
    return <Icon component={SvgComponent} {...props} />;
  }
  return AntdIconWrapper;
}

function createIconFromTablerIconComponent(TablerIconComponent) {
  function TablerIconWrapper() {
    return <TablerIconComponent size="1em" stroke={1.5} />;
  }
  return createIconFromSvgComponent(TablerIconWrapper);
}

export const LineIcon = createIconFromSvgComponent(LineIconComponent);
export const SpinIcon = createIconFromTablerIconComponent(IconLoader2);
export const SelectIcon = createIconFromTablerIconComponent(IconClick);
export const CircleIcon = createIconFromTablerIconComponent(IconCircle);
export const EraserIcon = createIconFromTablerIconComponent(IconEraser);
export const RepeatIcon = createIconFromTablerIconComponent(IconRepeat);
export const SquareIcon = createIconFromTablerIconComponent(IconSquare);
export const TextIcon = createIconFromTablerIconComponent(IconTypography);
export const ArrowIcon = createIconFromTablerIconComponent(IconArrowRight);
export const FreeDrawIcon = createIconFromTablerIconComponent(IconBallpen);
export const RectangleIcon = createIconFromTablerIconComponent(IconSquare);
export const DownloadIcon = createIconFromTablerIconComponent(IconDownload);
export const ResetIcon = createIconFromTablerIconComponent(IconArrowBackUp);
export const StopIcon = createIconFromTablerIconComponent(IconSquareFilled);
export const StrokeColorIcon = createIconFromTablerIconComponent(IconBrush);
export const TriangleIcon = createIconFromTablerIconComponent(IconTriangle);
export const InputsIcon = createIconFromTablerIconComponent(IconTextCaption);
export const ShapeIcon = createIconFromTablerIconComponent(IconCircleSquare);
export const StrokeWidthIcon = createIconFromTablerIconComponent(IconRuler3);
export const FontSizeIcon = createIconFromTablerIconComponent(IconTextResize);
export const RepeatOffIcon = createIconFromTablerIconComponent(IconRepeatOff);
export const MaintenanceIcon = createIconFromTablerIconComponent(IconZoomScan);
export const ExitFullscreenIcon = createIconFromTablerIconComponent(IconMinimize);
export const FillColorIcon = createIconFromTablerIconComponent(IconBucketDroplet);
export const ChevronLeftIcon = createIconFromTablerIconComponent(IconChevronLeft);
export const EnterFullscreenIcon = createIconFromTablerIconComponent(IconMaximize);
export const ChevronRightIcon = createIconFromTablerIconComponent(IconChevronRight);
export const PlaybackRateIcon = createIconFromTablerIconComponent(IconBrandSpeedtest);
export const ChevronLeftPipeIcon = createIconFromTablerIconComponent(IconChevronLeftPipe);
