import React from 'react';
import MediaPlayer from '../../../src/components/media-player/media-player.js';
import DefaultHeaderLogo from '../../../src/components/default-header-logo.js';
import HomepageProjectPresentation from '../../../src/components/homepage/homepage-project-presentation.js';

function HomepagePresentation() {
  return (
    <div className="HomepagePresentation">
      <div className="HomepagePresentation-videoWrapper">
        <div className="HomepagePresentation-video">
          <MediaPlayer
            renderControls={() => null}
            renderProgressBar={() => null}
            sourceUrl="https://cdn.openmusic.academy/document-media/cTfhXcxtkgqYLE3k1P6JAR/oma-explainer-vs1-0-pDjYtJexVC91WfrtWnu6hh.mp4"
            posterImageUrl="https://cdn.openmusic.academy/document-media/cTfhXcxtkgqYLE3k1P6JAR/explainer-poster-4c1tzNXqJyFbSYwaBL5EDz.jpg"
            />
        </div>
      </div>
      <div className="HomepagePresentation-details">
        <div className="HomepagePresentation-logo">
          <DefaultHeaderLogo />
        </div>
        <HomepageProjectPresentation />
      </div>
    </div>
  );
}

export default HomepagePresentation;
