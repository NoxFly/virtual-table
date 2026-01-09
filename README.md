# VirtualTable

`npm i @noxfly/virtual-table`

```ts
const table = document.createElement('div');

const columnsDef = [
    {
        title: '#',
        width: 50,
        type: 'number',
        cssClasses: ['row-index'],
        readonly: true,
        transform: (cell) => cell.rowIndex.toString(),
    },
    {
        title: '',
        width: 30,
        readonly: true,
        cssClasses: ['expand'],
    },
    {
        field: 'id',
        title: 'ID',
        width: 300,
        readonly: true,
        cssClasses: ['indent'],
    },
    {
        title: '',
        transform: (cell) => this.createTooltipButton(cell),
        cssClasses: ['tooltip'],
        readonly: true,
        width: 29,
    },
    {
        field: 'num',
        title: 'num',
        width: 300,
        editTransformedValue: true,
        transform: (cell) => `${cell.value}`.replace(/\s+/g, "").replace(/\b0+(\d)/g, "$1"),
    },
    {
        field: 'name',
        title: 'Name',
        width: 100,
    },
    {
        field: 'email',
        title: 'Email',
        width: 200,
    },
];

const vt = new VirtualTable(table, columnsDef, {
    stickyHeader: true,
    rowHeight: 28,
    allowRowSelection: true,
    allowCellEditing: true,
});

vt.setData(data);
vt.makeDroppable();

vt.onDrop = onDrop.bind(this);

vt.refreshView();

vt.setLevel(2);
```
