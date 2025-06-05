import { VirtualTable } from "../../src/VirtualTable.ts";

export class Test {
    /** @type {'light'|'dark'} */
    theme = 'light';

    /** @type {HTMLElement} */
    container;

    /** @type {HTMLElement} */
    table;

    /** @type {object[]} */
    data;

    /** @type {import("../../src/types.ts").ColumnDef[]} */
    columns;

    /** @type {VirtualTable} */
    virtualTable;

    constructor(id, $parentElement) {
        this.createTestContainer(id, $parentElement);
    }

    execute() {
        throw new Error("Method 'execute' must be implemented.");
    }

    /**
     * 
     * @param {number} id
     * @param {HTMLElement} parentElement 
     * @returns {HTMLElement}
     */
    createTestContainer(id, parentElement) {
        console.log(this);
        this.container = document.createElement('section');
        this.container.classList.add('test-container');
        parentElement.appendChild(this.container);
        
        this.table = document.createElement('div');
        this.table.id = 'table-container-' + id;
        this.container.appendChild(this.table);
    }
}