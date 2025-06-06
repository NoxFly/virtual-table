export declare type Any = string | number | boolean | null | undefined | object;

export declare interface Cell<T extends Type> {
    $: HTMLElement;
    value: Any;
    row: TreeNode<T>;
    column: ColumnDef<T>;
    rowIndex: number;
    columnIndex: number;
}

export declare interface ColumnDef<T extends Type> {
    title: string;
    field?: keyof T;
    width: number;
    cssClasses?: string[];
    transform?: (cell: Cell<T>) => string;
}

export declare interface FlatNode<T extends Type> {
    node: TreeNode<T>;
    index: number;
}

export declare interface Position {
    top: number;
    left: number;
}

export declare interface TableRow<T extends Type> {
    $: HTMLElement;
    ref?: FlatNode<T>;
    previousElement?: TableRow<T>;
    nextElement?: TableRow<T>;
    x: number;
    y: number;
}

export declare interface TreeNode<T extends Type> {
    data: T;
    expanded: boolean;
    depth: number;
    children: TreeNode<T>[];
}

export declare type Type = {
    id: string | number;
    children?: Type[];
    [key: string]: Any;
};

export declare class VirtualTable<T extends Type> {
    private readonly container;
    protected static readonly DEFAULT_OPTIONS: VirtualTableOptions;
    private readonly table;
    private readonly tableHead;
    private readonly tableBody;
    private readonly columns;
    private rows;
    private data;
    private tree;
    private flatten;
    private readonly ROW_HEIGHT;
    private VISIBLE_ROWS_COUNT;
    private TOTAL_VISIBLE_ROWS;
    private tbodyStartY;
    private readonly selectedNodes;
    private readonly selectedCells;
    private readonly selectedColumns;
    private mostTopRow;
    readonly options: VirtualTableOptions;
    constructor(container: HTMLElement, columnsDef: ColumnDef<T>[], options?: Partial<VirtualTableOptions>);
    private get scrollTop();
    private get totalVirtualHeight();
    private get columnUnits();
    private createColumns;
    private computeViewbox;
    private computeInViewVisibleRows;
    private resetSelections;
    private getNodeFromRow;
    private updateViewBoxHeight;
    private updateRowsContent;
    private formatCellValue;
    private createEmptyRow;
    private createEmptyCells;
    private removeRow;
    private setRowPosition;
    private updateScroll;
    private onScroll;
    private onClick;
    private onRowClick;
    selectRow(event: MouseEvent, row: TableRow<T>): void;
    selectAllRows(): void;
    unselectAllRows(): void;
    selectCell(): void;
    unselectAllCells(): void;
    selectColumn(column: ColumnDef<T>): void;
    unselectAllColumns(): void;
    editCell(row: TableRow<T>, $cell: HTMLElement): void;
    cancelCellEdition(): void;
    private toggleRowExpand;
    private resetTableRows;
    private dataToTreeNode;
    scrollTo(index: number): void;
    setData(data: T[]): void;
    allowColumnResizing(allow: boolean): void;
    allowRowSelection(allow: boolean): void;
    allowCellSelection(allow: boolean): void;
    allowCellEditing(allow: boolean): void;
    private lastHighlightedRow;
    makeDroppable(): void;
    onDrop: (data: string | undefined, row: TableRow<T>) => void;
}

export declare interface VirtualTableOptions {
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
