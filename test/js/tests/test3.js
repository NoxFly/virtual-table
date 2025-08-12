import { VirtualTable, } from "../../../src/VirtualTable.ts";
import { generateRandomContacts } from "../faker.js";
import { Test } from "../Test.js";

export class Test3 extends Test {
    static id = 3;
    static description = "6 entries, dark theme, large row, percentage column width.";

    theme = 'dark';

    columnsDef = [
        {
            field: 'name',
            title: 'Name',
            width: 18,
        },
        {
            field: 'email',
            title: 'Email',
            width: 24,
        },
        {
            field: 'phone',
            title: 'Phone',
            width: 18,
        },
        {
            field: 'address',
            title: 'Address',
            width: 23,
        },
        {
            field: 'company',
            title: 'Company',
            width: 17,
        },
    ];

    constructor(parentElement) {
        super(Test3.id, parentElement);
    }

    execute() {
        this.data = generateRandomContacts(6, false);

        const virtualTable = new VirtualTable(this.table, this.columnsDef, {
            rowHeight: 60,
            stickyHeader: true,
            columnSizeInPercentage: true,
        });

        virtualTable.setData(this.data);
    }
}
