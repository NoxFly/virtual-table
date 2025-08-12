/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 * 
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */

export type Any = string | number | boolean | null | undefined | Date | object;

export type Type = {
    id: string | number;
    children?: Type[];
    [key: string]: Any;
};

export type UpdatedRow<T extends Type> = Partial<Omit<T, 'children'>> & Pick<T, 'id'>;

export interface TreeNode<T extends Type> {
    data: T;
    expanded: boolean; // Indique si les enfants sont affichés
    depth: number; // Profondeur du noeud dans l'arbre
    children: TreeNode<T>[];
    parent?: TreeNode<T>; // Référence au parent, si le noeud est une racine, il n'a pas de parent
    left?: TreeNode<T>; // Frère gauche du même niveau circulaire (lui-même ne pouvant pas s'avoir comme frère gauche)
    right?: TreeNode<T>; // Frère droit du même niveau circulaire (lui-même ne pouvant pas s'avoir comme frère droit)
    flatIndex: number; // Index absolu dans l'arbre
}

export interface Position {
    top: number;
    left: number;
}

export interface TableRow<T extends Type> {
    $: HTMLElement; // Référence à la ligne html (dom)
    ref?: TreeNode<T>; // Contenu des cellules

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
    rowHeight: number;
    defaultExpanded: boolean;
    columnSizeInPercentage: boolean;
    // --
    stickyHeader: boolean;
    // -- allowed actions
    allowColumnSelection: boolean;
    allowRowSelection: boolean;
    allowCellSelection: boolean;
    allowCellEditing: boolean;
    allowColumnResize: boolean;
    allowColumnReorder: boolean;
    allowRowReorder: boolean;
    // --
}