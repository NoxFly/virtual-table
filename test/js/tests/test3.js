import { VirtualTable, } from "../../../src/VirtualTable.ts";
import { generateRandomContacts } from "../faker.js";
import { Test } from "../Test.js";

export class Test3 extends Test {
    static id = 3;
    static description = "10 entries, styling, large row.";

    theme = 'dark';

    columnsDef = [
        {
            field: 'name',
            title: 'Name',
            width: 150,
        },
        {
            field: 'email',
            title: 'Email',
            width: 200,
        },
        {
            field: 'phone',
            title: 'Phone',
            width: 150,
        },
        {
            field: 'address',
            title: 'Address',
            width: 200,
        },
        {
            field: 'company',
            title: 'Company',
            width: 150,
        },
    ];

    constructor(parentElement) {
        super(Test3.id, parentElement);
    }

    execute() {
        const data = generateRandomContacts(10, false);
        console.log(data);

        const virtualTable = new VirtualTable(this.table, this.columnsDef, {
            rowHeight: 60,
            stickyHeader: true,
        });

        virtualTable.setData(data);
    }
}
