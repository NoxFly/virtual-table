/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 * 
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */

/**
 * 
 */
export type Any = string | number | boolean | null | undefined | Date | object;

/**
 * Représente un type de données générique utilisé dans la table virtuel.
 */
export type Type = {
    /**
     * Identifiant unique de l'élément.
     * Il peut s'agir d'une chaîne de caractères (par exemple UUIDv4),
     * ou d'un nombre (index).
     */
    id: string | number;
    /**
     * Liste des enfants de l'élément.
     * Si la liste est simple, et non arborescente,
     * alors cette propriété peut être omise.
     */
    children?: Type[];
    /**
     * N'importe quelle autre propriété pour cette ligne,
     * utilisé pour être affiché dans les colonnes de la table virtuel.
     */
    [key: string]: Any;
};

/**
 * Représente les données à mettre à jour pour une ligne dans la table virtuel.
 * L'identifiant est obligatoire et sert à identifier la ligne à mettre à jour.
 * Les enfants de la ligne ne sont pas à inclure dans cette mise à jour.
 */
export type UpdatedRow<T extends Type> = Partial<Omit<T, 'children'>> & Pick<T, 'id'>;

/**
 * Représente un noeud dans l'arbre de données.
 */
export interface TreeNode<T extends Type> {
    /**
     * Données brutes du noeud.
     */
    data: T;
    /**
     * Indique si les enfants sont affichés
     */
    expanded: boolean;
    /**
     * Profondeur du noeud dans l'arbre
     */
    depth: number;
    /**
     * Liste des enfants de ce noeud.
     */
    children: TreeNode<T>[];
    /**
     * Référence au parent, si le noeud est une racine, il n'a pas de parent
     */
    parent?: TreeNode<T>;
    /**
     * Frère gauche du même niveau circulaire (lui-même ne pouvant pas s'avoir comme frère gauche)
     */
    left?: TreeNode<T>;
    /**
     * Frère droit du même niveau circulaire (lui-même ne pouvant pas s'avoir comme frère droit)
     */
    right?: TreeNode<T>;
    /**
     * Index absolu dans l'arbre
     */
    flatIndex: number;
}

/**
 * Vecteur 2D représentant une position en pixels.
 */
export interface Position {
    /**
     * Position verticale en pixels.
     */
    top: number;
    /**
     * Position horizontale en pixels.
     */
    left: number;
}

/**
 * Représente une ligne dans la table virtuel.
 */
export interface TableRow<T extends Type> {
    /**
     * Référence à l'élément HTML de la ligne.
     */
    $: HTMLElement;
    /**
     * Référence au noeud de l'arbre auquel appartient la ligne.
     */
    ref?: TreeNode<T>;

    /**
     * Référence à la ligne précédente dans la table.
     */
    previousElement?: TableRow<T>;

    /**
     * Référence à la ligne suivante dans la table.
     */
    nextElement?: TableRow<T>;

    /**
     * Positionnement absolu en pixels de la ligne dans la table.
     */
    x: number;
    /**
     * Positionnement absolu en pixels de la ligne dans la table.
     */ 
    y: number;
}

/**
 * Représente une cellule dans la table virtuel.
 */
export interface Cell<T extends Type> {
    /**
     * Référence à l'élément HTML de la cellule.
     */
    $: HTMLElement;
    /**
     * La valeur de la cellule.
     */
    value: Any;
    /**
     * Référence au noeud de l'arbre auquel appartient la cellule.
     */
    row: TreeNode<T>;
    /**
     * Référence à la colonne de la cellule.
     */
    column: ColumnDef<T>;
    /**
     * Index de la ligne dans la table.
     */
    rowIndex: number;
    /**
     * Index de la colonne dans la table.
     */
    columnIndex: number;
}

/**
 * Représente la définition d'une colonne dans la table virtuel.
 */
export interface ColumnDef<T extends Type> {
    /**
     * Le texte à afficher comme nom de colonne
     */
    title: string;
    /**
     * La propriété à afficher dans cette colonne pour chaque donnée dans T
     */
    field?: keyof T;
    /**
     * La largeur de la colonne. Peut être exprimé en pixel (défaut),
     * ou en pourcentage si {@link VirtualTableOptions.columnSizeInPercentage} vaut `true`.
     */
    width: number;
    /**
     * Les classes CSS à appliquer à la colonne.
     * Si {@link ColumnDef.field} est défini,
     * alors une classe CSS avec la valeur de ce champ sera ajoutée,
     * donc inutile de le spécifier ici.
     */
    cssClasses?: string[];
    /**
     * Indique si la colonne n'est pas modifiable par l'utilisateur.
     * Cette propriété ne s'applique que si {@link VirtualTableOptions.allowCellEditing} vaut `true`.
     * @default false
     * @todo Pas implémenté pour le moment.
    */
    readonly?: boolean;
    /**
     * Indique si une valeur est obligatoire dans la cellule de cette colonne, lors de la saisie.
     * Cette propriété ne s'applique que si {@link VirtualTableOptions.allowCellEditing} vaut `true`.
     * @default false
     * @todo Pas implémenté pour le moment.
    */
    required?: boolean;
    /**
     * Indique si la colonne doit être cachée.
     * @default false
    */
    hidden?: boolean;
    /**
     * Indique si un tri sur les lignes peut être effectué grâce
     * à cette colonne.
     * @default false
     * @todo Pas implémenté pour le moment.
     */
    sortable?: boolean;
    /**
     * Permet de transformer la valeur de la cellule avant de l'afficher.
     * Si cette fonction n'est pas définie, la valeur brute de la cellule sera affichée.
     * @param cell La cellule à afficher
     * @returns La valeur transformée à afficher
     */
    transform?: (cell: Cell<T>) => string;
}

/**
 * Représente les options de configuration d'une table virtuelle.
 */
export interface VirtualTableOptions {
    /**
     * Identifiant unique de la table.
     * Permet de distinguer plusieurs tables dans une même page.
     */
    id: string;
    /**
     * La hauteur d'une ligne en pixels.
     * @default 30
     */
    rowHeight: number;
    /**
     * Indique, pour une table arborescente, si les enfants d'un noeud sont affichés par défaut.
     * @default true
     */
    defaultExpanded: boolean;
    /**
     * Indique si la largeur des colonnes est exprimée en pourcentage à travers {@link ColumnDef.width}.
     * @default false
     */
    columnSizeInPercentage: boolean;
    
    // --
    
    /**
     * Indique si les en-têtes de colonnes doivent suivre au scroll de la page.
     * @default false
     */
    stickyHeader: boolean;
    
    // -- allowed actions --
    
    /**
     * Indique si la sélection de colonnes est autorisée.
     * @default false
     */
    allowColumnSelection: boolean;
    /**
     * Indique si la sélection de lignes est autorisée.
     * @default false
     */
    allowRowSelection: boolean;
    /**
     * Indique si la sélection de cellules est autorisée.
     * Note :
     * - Si {@link allowRowSelection} vaut `true`, alors cette option sera ignorée.
     * - Si {@link allowCellEditing} vaut `true`, alors cette option sera ignorée.
     * @default false
     */
    allowCellSelection: boolean;
    /**
     * Indique si l'édition de cellules est autorisée.
     * Si cette option est `true`, elle écrase l'option {@link allowRowSelection}.
     * @default false
     * @todo Pas implémenté pour le moment.
     */
    allowCellEditing: boolean;
    /**
     * Indique si le redimensionnement des colonnes est autorisé.
     * @default false
     * @todo Pas implémenté pour le moment.
    */
    allowColumnResize: boolean;
    /**
     * Indique si le réordonnancement des colonnes est autorisé
     * (via du drag & drop).
     * @default false
     * @todo Pas implémenté pour le moment.
    */
    allowColumnReorder: boolean;
    /**
     * Indique si le réordonnancement des lignes est autorisé
     * (via du drag & drop).
     * @default false
     * @todo Pas implémenté pour le moment.
    */
    allowRowReorder: boolean;
    
    // --
}