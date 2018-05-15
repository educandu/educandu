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

function renderSection(teaser, name, tests) {
  return `
    <div class="QuickTester">
      <a class="QuickTester-initLink" href="#">${encode(teaser)}</a>
      <div class="QuickTester-testContainer">
        <h3 class="QuickTester-header">${encode(name)}</h3>
        <div class="QuickTester-tests">${tests.map(renderTest).join('')}</div>
        <div class="QuickTester-buttons">
          <button class="QuickTester-resultButton">Lösung</button>
          <button class="QuickTester-nextButton">Nächste Frage</button>
          <button class="QuickTester-resetButton">Beenden</button>
        </div>
      </div>
    </div>`;
}

class QuickTester {
  static get typeName() { return 'quick-tester'; }

  constructor(section) {
    this.section = section;
  }

  render() {
    return Object.keys(this.section.content).reduce((result, key) => {
      result[key] = renderSection(this.section.content[key].teaser, this.section.content[key].name, this.section.content[key].tests);
      return result;
    }, {});
  }
}

module.exports = QuickTester;
