const arrayShuffle = require('array-shuffle');

function startTester(element) {
  let currentIndex;

  const initLink = element.querySelector('.QuickTester-initLink');
  const resultButton = element.querySelector('.QuickTester-resultButton');
  const nextButton = element.querySelector('.QuickTester-nextButton');
  const resetButton = element.querySelector('.QuickTester-resetButton');
  const testContainer = element.querySelector('.QuickTester-testContainer');

  let tests = [].slice.call(testContainer.querySelectorAll('.QuickTester-test'));

  const showTestWithCurrentIndex = () => {
    tests.forEach((test, index) => {
      if (index === currentIndex) {
        test.classList.remove('is-inactive');
        const currentAnswer = test.querySelector('.QuickTester-answer');
        currentAnswer.classList.remove('is-active');
      } else {
        test.classList.add('is-inactive');
      }
    });

    if (currentIndex === tests.length - 1) {
      nextButton.classList.add('is-inactive');
    } else {
      nextButton.classList.remove('is-inactive');
    }

    resultButton.classList.remove('is-inactive');
  };

  initLink.addEventListener('click', event => {
    currentIndex = 0;
    tests = arrayShuffle(tests);
    showTestWithCurrentIndex();
    initLink.classList.add('is-inactive');
    testContainer.classList.add('is-active');
    event.preventDefault();
  });

  resultButton.addEventListener('click', () => {
    const currentAnswer = tests[currentIndex].querySelector('.QuickTester-answer');
    currentAnswer.classList.add('is-active');
    resultButton.classList.add('is-inactive');
  });

  nextButton.addEventListener('click', () => {
    currentIndex += 1;
    showTestWithCurrentIndex();
  });

  resetButton.addEventListener('click', () => {
    initLink.classList.remove('is-inactive');
    testContainer.classList.remove('is-active');
  });
}

class QuickTester {
  init(parentElement) {
    startTester(parentElement);
  }
}

module.exports = QuickTester;
