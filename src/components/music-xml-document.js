import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import OpenSheetMusicDisplayExport from 'opensheetmusicdisplay';

const { OpenSheetMusicDisplay } = OpenSheetMusicDisplayExport;

const osmdOptions = {
  autoResize: true,
  drawTitle: true
};

function MusicXmlDocument({ url, zoom }) {
  const osmd = useRef(null);
  const divRef = useRef(null);
  const isMounted = useRef(false);
  const lastLoadedUrl = useRef(null);
  const hasRenderedAtLeastOnce = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      let currentOsmd = osmd.current;
      if (!currentOsmd) {
        currentOsmd = new OpenSheetMusicDisplay(divRef.current, osmdOptions);
        osmd.current = currentOsmd;
      }

      if (url) {
        if (url !== lastLoadedUrl.current) {
          lastLoadedUrl.current = url;
          await currentOsmd.load(url);
        }
        if (isMounted.current) {
          currentOsmd.zoom = zoom;
          currentOsmd.render();
          hasRenderedAtLeastOnce.current = true;
        }
      } else if (hasRenderedAtLeastOnce.current && isMounted.current) {
        currentOsmd.clear();
      }
    })();
  }, [url, zoom, osmd]);

  return (
    <div ref={divRef} />
  );
}

MusicXmlDocument.propTypes = {
  url: PropTypes.string,
  zoom: PropTypes.number
};

MusicXmlDocument.defaultProps = {
  url: null,
  zoom: 1
};

export default MusicXmlDocument;
