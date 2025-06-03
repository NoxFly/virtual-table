import { VirtualTable, } from "../../../src/VirtualTable.ts";
import { createTestContainer } from "../utils";
import { generateRandomContacts } from "../faker.js";

export default function($container) {
    const container = createTestContainer($container);

    const data = generateRandomContacts(100, false);

    const tableContainer = document.createElement('div');
    tableContainer.id = 'table-container2';
    container.appendChild(tableContainer);

    /** @typedef {ColumnDef<Contact>[]} */
    const columnsDef = [
        {
            field: 'id',
            title: 'ID',
            width: 150,
            transform: (cell) => cell.rowIndex.toString(),
        },
        {
            field: 'name',
            title: 'Name',
            width: 300,
        },
        {
            field: 'email',
            title: 'Email',
            width: 300,
        },
    ];

    const virtualTable = new VirtualTable(tableContainer, columnsDef);

    virtualTable.setData(data);
}