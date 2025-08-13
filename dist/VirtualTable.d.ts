declare type Any = string | number | boolean | null | undefined | Date | object;

declare interface Cell<T extends Type> {
    $: HTMLElement;
    value: Any;
    row: TreeNode<T>;
    column: ColumnDef<T>;
    rowIndex: number;
    columnIndex: number;
}

declare interface ColumnDef<T extends Type> {
    title: string;
    field?: keyof T;
    width: number;
    cssClasses?: string[];
    transform?: (cell: Cell<T>) => string;
}

declare interface TableRow<T extends Type> {
    $: HTMLElement;
    ref?: TreeNode<T>;
    previousElement?: TableRow<T>;
    nextElement?: TableRow<T>;
    x: number;
    y: number;
}

declare interface TreeNode<T extends Type> {
    data: T;
    expanded: boolean;
    depth: number;
    children: TreeNode<T>[];
    parent?: TreeNode<T>;
    left?: TreeNode<T>;
    right?: TreeNode<T>;
    flatIndex: number;
}

declare type Type = {
    id: string | number;
    children?: Type[];
    [key: string]: Any;
};

declare type UpdatedRow<T extends Type> = Partial<Omit<T, 'children'>> & Pick<T, 'id'>;

export declare class VirtualTable<T extends Type> {
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
    constructor(container: HTMLElement, columnsDef: ColumnDef<T>[], options?: Partial<VirtualTableOptions>);
    private get scrollTop();
    private get totalVirtualHeight();
    private get columnUnits();
    private DOM_createColumns;
    private DOM_computeViewbox;
    private DOM_computeInViewVisibleRows;
    private DOM_resetSelections;
    private DOM_getRowFromHTMLRow;
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
    private DOM_setRowPosition;
    private DOM_updateScroll;
    private lastScrollTopIndex;
    private DOM_EVENT_onScroll;
    private DOM_EVENT_onClick;
    private DOM_EVENT_onRowClick;
    private toggleRowExpand;
    private dataToTreeNodeRec;
    private computeTree;
    private recomputeDataTree;
    deleteNode(nodeId: string): typeof VirtualTable;
    deleteNodes(nodeIds: string[]): typeof VirtualTable;
    addNode(relativeTo: string, asChildren: boolean, element: T): typeof VirtualTable;
    addNodes(relativeTo: string, asChildren: boolean, elements: T[]): typeof VirtualTable;
    updateNode(node: UpdatedRow<T>): typeof VirtualTable;
    updateNodes(nodes: UpdatedRow<T>[]): typeof VirtualTable;
    private verifyDuplicateIds;
    setData(data: T[]): void;
    clear(): void;
    getNodes(): readonly TreeNode<T>[];
    scrollTo(index: number): typeof VirtualTable;
    selectRow(event: MouseEvent, row: TableRow<T>): typeof VirtualTable;
    selectAllRows(): typeof VirtualTable;
    unselectAllRows(): typeof VirtualTable;
    selectCell(): typeof VirtualTable;
    unselectAllCells(): typeof VirtualTable;
    selectColumn(column: ColumnDef<T>): typeof VirtualTable;
    unselectAllColumns(): typeof VirtualTable;
    editCell(row: TableRow<T>, $cell: HTMLElement): typeof VirtualTable;
    cancelCellEdition(): typeof VirtualTable;
    allowColumnResizing(allow: boolean): typeof VirtualTable;
    allowRowSelection(allow: boolean): typeof VirtualTable;
    allowCellSelection(allow: boolean): typeof VirtualTable;
    allowCellEditing(allow: boolean): typeof VirtualTable;
    makeDroppable(): typeof VirtualTable;
    onDrop: (data: string | undefined, row: TableRow<T>) => void;
}

declare interface VirtualTableOptions {
    id: string;
    rowHeight: number;
    defaultExpanded: boolean;
    columnSizeInPercentage: boolean;
    stickyHeader: boolean;
    allowColumnSelection: boolean;
    allowRowSelection: boolean;
    allowCellSelection: boolean;
    allowCellEditing: boolean;
    allowColumnResize: boolean;
    allowColumnReorder: boolean;
    allowRowReorder: boolean;
}

export { }
