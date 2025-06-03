export function createTestContainer($container) {
    const container = document.createElement('section');
    container.classList.add('test-container');
    $container.appendChild(container);
    return container;
}