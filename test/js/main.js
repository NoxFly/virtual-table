import * as tests from './test.js';

/* ----- */

let layout;
let testCount = 0;

/* ----- */

function main() {
    layout = createLayout();

    generateTest(tests.test1, "100 000 entries for first level, children, drag & drop, basic styling, some options.");
    generateTest(tests.test2, "No options, no children and no styling.");
}

function createLayout() {
    const $testsListContainer = document.createElement('div');
    $testsListContainer.id = 'tests-list-container';
    document.body.appendChild($testsListContainer);

    const $testContainer = document.createElement('div');
    $testContainer.id = 'test-container';
    document.body.appendChild($testContainer);

    return { $testsListContainer, $testContainer };
}

/**
 * Generates a test case.
 * @param {string} name 
 * @param {Function} fn 
 */
function generateTest(fn, description="") {
    const testContainer = document.createElement('div');
    testContainer.classList.add('test-case');

    const div = document.createElement('div');
    testContainer.appendChild(div);
    
    const testName = document.createElement('h2');
    testName.textContent = `Test ${++testCount}`;
    div.appendChild(testName);

    const testDescription = document.createElement('p');
    testDescription.textContent = description;
    div.appendChild(testDescription);

    const testButton = document.createElement('button');
    testButton.type = 'button';
    testButton.textContent = 'Run';
    testContainer.appendChild(testButton);

    testContainer.addEventListener('click', executeTest.bind(null, fn));

    layout.$testsListContainer.appendChild(testContainer);
}

function executeTest(fn) {
    layout.$testContainer.innerHTML = '<p class="loading-msg">loading...</p>';

    setTimeout(() => {
        layout.$testContainer.innerHTML = '';
        fn(layout.$testContainer);
    }, 50);
}


main();