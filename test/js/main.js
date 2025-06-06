import tests from './tests.js';

/* ----- */

let layout;
let testCount = 0;

/* ----- */

function main(queries, testId) {
    layout = createLayout();

    for(const test of tests) {
        generateTest(test);
    }

    if(testId > 0) {
        executeTest(testId);
    }
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
 * @param {any} test 
 */
function generateTest(test) {
    const testContainer = document.createElement('div');
    testContainer.classList.add('test-case');

    const div = document.createElement('div');
    testContainer.appendChild(div);
    
    const testName = document.createElement('h2');
    testName.textContent = `Test ${test.id}`;
    div.appendChild(testName);

    const testDescription = document.createElement('p');
    testDescription.textContent = test.description;
    div.appendChild(testDescription);

    const testButton = document.createElement('button');
    testButton.type = 'button';
    testButton.textContent = 'Run';
    testContainer.appendChild(testButton);

    testContainer.addEventListener('click', executeTest.bind(null, test.id));

    layout.$testsListContainer.appendChild(testContainer);
}

function executeTest(testId) {
    if(isNaN(testId) || testId < 1 || testId > tests.length) {
        console.error("No test function provided.");
        return;
    }

    const test = tests.find(t => t.id === testId);

    // change the url #n where n is the test number
    const url = new URL(window.location.href);
    url.hash = `#${test.id}`;
    window.history.pushState({}, '', url);

    layout.$testContainer.innerHTML = '<p class="loading-msg">loading...</p>';

    setTimeout(() => {
        layout.$testContainer.innerHTML = '';
        const testInstance = new test(layout.$testContainer);
        document.documentElement.classList.toggle('dark-theme', testInstance.theme === 'dark');
        testInstance.execute();
    }, 50);
}




const url = new URL(window.location.href);
const testId = url.hash ? parseInt(url.hash.replace('#', '')) : 0;

const queries = new URLSearchParams(window.location.search);

main(queries, testId);