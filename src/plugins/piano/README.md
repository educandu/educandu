Hi Adriana and Andreas,

this is my solution for the piano plugin. It has been renamed 'piano' since the midi functionality does not make up the major part.
The functionality consists of two parts:

## 1. MIDI support
  - play the piano with connected midi devices
  - input notes in ear training modes via midi device
  - play midi files


## 2. Ear training modes
  - interval
  - chord
  - note sequence (both random and predefined with abc notation)

  In interval and chord mode, answer and solution are shown by styling the piano keys in different colors, in note sequence mode there is an AbcNotation for answer and
  solution.
  Note input is provided via click on keys or via midi device.


## General Notes:
  - I'm using ref variables when the render of the component is not affected by the value changing. For example, changing the noteDuration while an exercise
    is playing would not work with a state variable.

  - ESLint: piano-display.js and piano-editor.js surpass 500 lines. I switched off the rule for these files.
    A few times I also disabled the rule react-hooks/exhaustive-deps when a hook only needs to run once or when a ref will not have changed in the meantime.
    Please check if this is done correctly.


## Notes on MIDI support:
  - When there are multiple pianos on the page, only one at a time shall be allowed to play via midi input. To achieve this, each piano saves a disableMidiInput function
    along with its piano id on the browser document object. This way each piano can disable sibling pianos when its midi input switch is activated.
    I recorded a short demonstration video: https://www.dropbox.com/s/z0taxhl8rwmx6h9/midi-input.mp4?dl=0

  - The midi input switch (also used as note input switch) is a custom component I styled the way the antd switch looks (mostly). First I used the antd one, but it wouldn't
    let me style it via DOM manipulation
    the way I needed. The switch only renders when a midi input device is connected.

  - For your convenience, I included two midi files in piano/custom/ for testing purposes.


## Notes on ear training modes:
  - The modes interval, chord and random note sequence randomly generate an infinite number of exercises based on their settings. To make it possible to have multiple
    predefined custom note sequences combined in one test as well, you can add as many custom note sequences as you like. For this, custom note sequence ItemPanels will be inserted within
    the test ItemPanel.
    The custom note sequences compensate for the fact that random note sequences are without tonality (you can choose white keys only however). That way you can write note sequences
    in any tonality via abc notation.
  - Custom note sequence has a limit of 10 notes. With 11+ notes AbcNotation element would render with too large width.


## Things left to be done/consider:
- Catch error when file of type other than midi is defined in editor
- The piano samples used in custom hook useToneJsSampler are loaded from the web. I could not find the licenses for download and use. If needed I can make own samples.
- Please check if I used the logger correctly in custom hook useMidiDevice
- The piano works without any ear training test. However, when you have added one or more tests, you can not remove all of them, there will always be one left.
  Maybe allow deleting the last remaining test also?


Thank you very much for your effort!

Best regards
Benni
