declare class EventManager {
    private readonly listeners;
    listenTo<K extends keyof DocumentEventMap>(target: EventTarget, type: K, callback: (this: Document, ev: DocumentEventMap[K]) => void, options?: boolean | AddEventListenerOptions): symbol;
    stopListenTo<K extends keyof DocumentEventMap>(target: EventTarget, type: K, symbolId: symbol | ((this: Document, ev: DocumentEventMap[K]) => void), options?: boolean | EventListenerOptions): void;
    removeAllListeners(target: EventTarget, type?: string): void;
}

type Any = string | number | boolean | null | undefined | Date | object;
type Type = {
    id: string | number;
    children?: Type[];
    [key: string]: Any;
};
type UpdatedRow<T extends Type> = Partial<Omit<T, 'children'>> & Pick<T, 'id'>;
interface TreeNode<T extends Type> {
    data: T;
    expanded: boolean;
    depth: number;
    children: TreeNode<T>[];
    parent?: TreeNode<T>;
    left?: TreeNode<T>;
    right?: TreeNode<T>;
    flatIndex: number;
}
interface Position {
    top: number;
    left: number;
}
interface TableRow<T extends Type> {
    $: HTMLElement;
    ref?: TreeNode<T>;
    previousElement?: TableRow<T>;
    nextElement?: TableRow<T>;
    x: number;
    y: number;
    cells: Cell<T>[];
}
interface Cell<T extends Type> {
    $: HTMLElement;
    value: Any;
    row: TableRow<T>;
    node: TreeNode<T>;
    column: ColumnDef<T>;
    rowIndex: number;
    columnIndex: number;
}
type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'html' | 'enum';
interface ColumnDef<T extends Type> {
    id: string;
    title: string;
    field?: keyof T;
    type: ColumnType;
    enumValues?: Set<string>;
    width: number;
    cssClasses?: string[];
    readonly?: boolean;
    required?: boolean;
    hidden?: boolean;
    sortable?: boolean;
    transform?: (cell: Cell<T>) => string | HTMLElement | undefined;
}
type ColumnsDefs<T extends Type> = (Omit<ColumnDef<T>, 'id' | 'type'> & Partial<Pick<ColumnDef<T>, 'type'>>)[];
interface VirtualTableOptions {
    id: string;
    rowHeight: number;
    defaultExpanded: boolean;
    columnSizeInPercentage: boolean;
    treatZeroAsEmpty: boolean;
    stickyHeader: boolean;
    allowExpandCollapse: boolean;
    allowColumnSelection: boolean;
    allowRowSelection: boolean;
    allowCellSelection: boolean;
    allowCellEditing: boolean;
    allowColumnResize: boolean;
    allowColumnReorder: boolean;
    allowRowReorder: boolean;
}

declare class VirtualTable<T extends Type> {
    private readonly container;
    protected static readonly DEFAULT_OPTIONS: VirtualTableOptions;
    private readonly columns;
    private readonly rows;
    private tree;
    private readonly flatten;
    private readonly nodeMap;
    private readonly ROW_HEIGHT;
    private VISIBLE_ROWS_COUNT;
    private TOTAL_VISIBLE_ROWS;
    private TBODY_START_Y;
    private readonly $table;
    private readonly $tableHead;
    private readonly $tableBody;
    private readonly selectedNodes;
    private readonly selectedCells;
    private readonly selectedColumns;
    private mostTopRow;
    private $lastHighlightedRow;
    readonly options: VirtualTableOptions;
    private readonly $columns;
    constructor(container: HTMLElement, columnsDef: ColumnsDefs<T>, options?: Partial<VirtualTableOptions>);
    private get scrollTop();
    private get totalVirtualHeight();
    private get columnUnits();
    private DOM_createColumns;
    private DOM_computeViewbox;
    private DOM_computeInViewVisibleRows;
    private DOM_resetSelections;
    getRowFromHTMLRow($row: HTMLElement | null | undefined): TableRow<T> | null;
    private DOM_getRowIndex;
    private DOM_updateViewBoxHeight;
    private DOM_updateRowsContent;
    private DOM_updateRowContent;
    private DOM_getTableRowFromNode;
    private formatCellValue;
    private DOM_resetTableRows;
    private DOM_createEmptyRow;
    private DOM_createEmptyCells;
    private DOM_removeRow;
    private DOM_removeCell;
    private DOM_setRowPosition;
    private DOM_updateScroll;
    private lastScrollTopIndex;
    private DOM_EVENT_onScroll;
    private DOM_EVENT_onClick;
    private DOM_EVENT_onContextMenu;
    private DOM_EVENT_onRowClick;
    private toggleRowExpand;
    private dataToTreeNodeRec;
    private computeTree;
    private recomputeDataTree;
    deleteNode(nodeId: string): typeof this;
    deleteNodes(nodeIds: string[]): typeof this;
    addNode(relativeTo: string, asChildren: boolean, element: T): typeof this;
    addNodes(relativeTo: string, asChildren: boolean, elements: T[]): typeof this;
    updateNode(node: UpdatedRow<T>): typeof this;
    updateNodes(nodes: UpdatedRow<T>[]): typeof this;
    private verifyDuplicateIds;
    setData(data: T[]): void;
    clear(): void;
    rowCssClassesCallback?: (row: TableRow<T>) => string;
    getNodes(): readonly TreeNode<T>[];
    scrollTo(index: number): typeof this;
    selectRow(event: MouseEvent, row: TableRow<T>): typeof this;
    selectAllRows(): typeof this;
    unselectAllRows(): typeof this;
    selectCell(): typeof this;
    unselectAllCells(): typeof this;
    selectColumn(column: ColumnDef<T>): typeof this;
    unselectAllColumns(): typeof this;
    editCell(row: TableRow<T>, cell: Cell<T>): typeof this;
    cancelCellEdition(): typeof this;
    allowColumnResizing(allow: boolean): typeof this;
    allowRowSelection(allow: boolean): typeof this;
    allowCellSelection(allow: boolean): typeof this;
    allowCellEditing(allow: boolean): typeof this;
    hideColumn(columnIndex: number): typeof this;
    hideColumn(columnId: string): typeof this;
    makeDroppable(): typeof this;
    onDrop: (data: string | undefined, row: TableRow<T>) => void;
    onCellClicked: (cell: Cell<T>, event: MouseEvent) => void;
    onRowClicked: (row: TableRow<T>, event: MouseEvent) => void;
    onColumnClicked: (column: ColumnDef<T>, event: MouseEvent, target: HTMLElement) => void;
    onCellRightClicked: (cell: Cell<T>, event: MouseEvent) => void;
    onRowRightClicked: (row: TableRow<T>, event: MouseEvent) => void;
    onColumnRightClicked: (column: ColumnDef<T>, event: MouseEvent, target: HTMLElement) => void;
    onEmptySpaceRightClicked: (event: MouseEvent) => void;
}

export { type Any, type Cell, type ColumnDef, type ColumnType, type ColumnsDefs, EventManager, type Position, type TableRow, type TreeNode, type Type, type UpdatedRow, VirtualTable, type VirtualTableOptions };
