export type Any = string | number | boolean | null | undefined | object;

export type Type = {
    id: string | number;
    children?: Type[];
    [key: string]: Any;
};

export interface TreeNode<T extends Type> {
    data: T;
    expanded: boolean; // Indique si les enfants sont affichés
    depth: number; // Profondeur du noeud dans l'arbre
    children: TreeNode<T>[];
}

export interface FlatNode<T extends Type> {
    node: TreeNode<T>;
}

export interface Position {
    top: number;
    left: number;
}

export interface TableRow<T extends Type> {
    $: HTMLElement; // Référence à la ligne html (dom)
    node?: TreeNode<T>; // Contenu des cellules

    previousElement?: TableRow<T>;
    nextElement?: TableRow<T>;

    x: number;
    y: number;
}

export interface Cell<T extends Type> {
    $: HTMLElement;
    value: Any;
    row: TreeNode<T>;
    column: ColumnDef<T>;
    rowIndex: number;
    columnIndex: number;
}

export interface ColumnDef<T extends Type> {
    title: string;
    field?: keyof T;
    width: number;
    cssClasses?: string[];
    transform?: (cell: Cell<T>) => string;
}

export interface VirtualTableOptions {
    id: string;
    defaultExpanded: boolean;
    columnSizeInPercentage: boolean;
}