const MarkdownIt = require('markdown-it');
const { encode } = require('he');
const gfm = new MarkdownIt();

function renderTest(test) {
  return `
    <div class="QuickTester-test">
      <div class="QuickTester-question">${gfm.render(test.question)}</div>
      <div class="QuickTester-answer">${gfm.render(test.answer)}</div>
    </div>`;
}

function renderSection(name, tests) {
  return `
    <div class="QuickTester">
      <a class="QuickTester-initLink" href="#">Wollen Sie Ihr Wissen testen?</a>
      <div class="QuickTester-testContainer">
        <h3 class="QuickTester-header">${encode(name)}</h3>
        <div class="QuickTester-tests">${tests.map(renderTest).join('')}</div>
        <div class="QuickTester-buttons">
          <button class="QuickTester-resultButton" >Lösung</button>
          <button class="QuickTester-nextButton" >Nächste Frage</button>
          <button class="QuickTester-resetButton" >Beenden</button>
        </div>
      </div>
    </div>`;
}

class QuickTester {
  render(section) {
    return { de: renderSection(section.content.de.name, section.content.de.tests) };
  }
}

module.exports = QuickTester;
