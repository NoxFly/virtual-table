import { VirtualTable, } from "../../../src/VirtualTable.ts";
import { generateRandomContacts } from "../faker.js";
import { Test } from "../Test.js";

export class Test2 extends Test {
    static id = 2;
    static description = "100 entries, no options, no children and no styling.";

    columnsDef = [
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

    constructor(parentElement) {
        super(Test2.id, parentElement);
    }

    execute() {
        this.data = generateRandomContacts(100, false);

        const virtualTable = new VirtualTable(this.table, this.columnsDef);
        virtualTable.setData(this.data);
    }
}
