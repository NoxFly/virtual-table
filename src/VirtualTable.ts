/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 *
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */

import { Any, Cell, ColumnDef, ColumnsDefs, Position, TableRow, TreeNode, Type, UpdatedRow, VirtualTableOptions } from './types';

export class VirtualTable<T extends Type> {
    protected static readonly DEFAULT_OPTIONS: VirtualTableOptions = {
        id: '',
        rowHeight: 30,
        columnSizeInPercentage: false,
        defaultExpanded: true,
        treatZeroAsEmpty: false,
        // --
        stickyHeader: false,
        // -- allowed actions
        allowExpandCollapse: true,
        allowColumnSelection: false,
        allowRowSelection: false,
        allowCellSelection: false,
        allowCellEditing: false,
        allowColumnResize: false,
        allowColumnReorder: false,
        allowRowReorder: false,
    };


    private readonly columns: ColumnDef<T>[] = [];
    /** Les lignes de la vue, leur position et la référence vers leur données à afficher */
    private readonly rows: TableRow<T>[] = [];
    /** Un arbre multi-root de noeuds ayant des données fournies par `setData` */
    private tree: TreeNode<T>[] = [];
    /** Une liste plate des données filtrées provenant d'un arbre, préservant l'ordre des éléments */
    private readonly flatten: TreeNode<T>[] = [];
    /** Un hashmap sur les nodes de l'arbre afin d'accéder à n'importe quel noeud en O(1) à partir de son ID */
    private readonly nodeMap: Map<string, TreeNode<T>> = new Map<string, TreeNode<T>>();

    private readonly ROW_HEIGHT: number;
    private VISIBLE_ROWS_COUNT = 0;
    private TOTAL_VISIBLE_ROWS = 0;
    private TBODY_START_Y = 0;

    private readonly $table: HTMLElement;
    private readonly $tableHead: HTMLElement;
    private readonly $tableBody: HTMLElement;

    /** Indexes des noeuds sélectionnés dans `this.flatten` */
    private readonly selectedNodes = new Set<number>();
    /** Indexes des cellules sélectionnées et de leur node dans `this.flatten` */
    private readonly selectedCells = new Set<{ nodeIndex: number; fieldIndex: number; }>();
    /** Indexes des colonnes sélectionnées dans `this.columns` */
    private readonly selectedColumns = new Set<number>();

    private mostTopRow!: TableRow<T>;
    private $lastHighlightedRow: HTMLElement | null = null;

    public readonly options: VirtualTableOptions;


    private readonly $columns: HTMLElement[] = [];


    /**
     *
     */
    constructor(private readonly container: HTMLElement, columnsDef: ColumnsDefs<T>, options: Partial<VirtualTableOptions> = {}) {
        this.options = { ...VirtualTable.DEFAULT_OPTIONS, ...options };

        this.ROW_HEIGHT = this.options.rowHeight;

        this.columns = columnsDef.map(col => ({
            ...col,
            id: crypto.randomUUID(),
            type: col.type || 'string',
        }));

        this.$table = document.createElement('div');
        this.$table.classList.add('table');

        this.$tableHead = document.createElement('div');
        this.$tableHead.classList.add('thead');

        this.$tableBody = document.createElement('div');
        this.$tableBody.classList.add('tbody');

        this.$table.append(this.$tableHead, this.$tableBody);

        this.container.classList.add('virtual-table');

        this.container.appendChild(this.$table);

        if(this.options.id) {
            this.$table.id = this.options.id;
        }

        if(this.options.stickyHeader) {
            this.$table.classList.add('sticky-header');
        }

        this.DOM_createColumns();
        this.DOM_computeViewbox();

        this.container.addEventListener('scroll', (e) => this.DOM_EVENT_onScroll(e), { passive: true });
        this.container.addEventListener('click', (e) => this.DOM_EVENT_onClick(e), { passive: true });

        this.$table.style.setProperty('--row-height', this.ROW_HEIGHT + 'px');
    }


    // ------------------------------------------------------------------------------
    // Table DOM manager

    /**
     * Retourne la position actuelle du scroll dans le conteneur.
     */
    private get scrollTop(): number {
        return this.container.scrollTop;
    }

    /**
     *
     */
    private get totalVirtualHeight(): number {
        //                                                                          border-size v
        return this.$tableHead.clientHeight + (this.TOTAL_VISIBLE_ROWS - 1) * (this.ROW_HEIGHT - 1);
    }

    /**
     *
     */
    private get columnUnits(): string {
        return this.options.columnSizeInPercentage
            ? '%'
            : 'px';
    }

    /**
     * Définit le colonnes de la table et le formattage des cellules
     * des données appartenant à ces colonnes.
     */
    private DOM_createColumns(): void {
        const $tr = document.createElement('div');
        $tr.classList.add('tr');

        for(const columnDef of this.columns) {
            if(columnDef.hidden) {
                return;
            }

            const $th = document.createElement('div');

            $th.dataset.type = columnDef.type;
            $th.dataset.id = columnDef.id;
            $th.classList.add('th', ...(columnDef.cssClasses || []));
            $th.style.width = columnDef.width + this.columnUnits;

            if(columnDef.field) {
                $th.classList.add(columnDef.field.toString());
            }

            // TODO: ajouter une icone de tri si columnDef.sortable

            const $span = document.createElement('span');
            $span.classList.add('cell-value');
            $span.innerHTML = columnDef.title;

            $th.appendChild($span);
            $tr.appendChild($th);

            this.$columns.push($th);
        }

        this.$tableHead.innerHTML = ''; // vide le contenu précédent
        this.$tableHead.appendChild($tr);
    }

    /**
     * Sert à recalculer le nombre de lignes visibles dans le conteneur.
     * Utilisé à l'initialisation et lors d'un redimensionnement du conteneur.
     * Ajoute ou enlève les lignes nécessaires.
     * Ensuite, appelle computeInViewVisibleRows.
     */
    private DOM_computeViewbox(): void {
        const CONTAINER_HEIGHT = this.container.clientHeight;
        this.VISIBLE_ROWS_COUNT = Math.ceil(CONTAINER_HEIGHT / this.ROW_HEIGHT) + 4; // Ajouter un buffer pour éviter les sauts

        if(this.flatten.length > 0) {
            // adapte le nombre de lignes dans la liste (supprime les lignes inutiles si besoin, ou en ajoute de nouvelles)
            const rowsCount = this.flatten.length;
            const max = Math.min(rowsCount, this.VISIBLE_ROWS_COUNT);

            if(this.rows.length < max) {
                for(let i = this.rows.length; i < max; i++) {
                    this.DOM_createEmptyRow(); // TODO: il manque un truc ici : rattacher les nouveaux à previous/nextElement
                }
            }
            else if(this.rows.length > max) {
                for(let i = this.rows.length - 1; i >= max; i--) {
                    this.DOM_removeRow(this.rows[i]); // meme remarque
                }
            }
        }

        this.TBODY_START_Y = this.$tableHead.clientHeight - 1;
    }

    /**
     * Calcule les lignes visibles dans le conteneur.
     * Met à jour la hauteur du conteneur virtuel.
     * En amont, transforme l'arbre en liste plate.
     * La liste plate ne contient que les nœuds visibles.
     *
     * *Note : recalcule TOUT, pas intelligemment.*
     */
    private DOM_computeInViewVisibleRows(): void {
        // TODO : ajouter le système de filtrage ici
        this.DOM_resetSelections();

        for(const row of this.flatten) {
            row.flatIndex = -1;
        }

        this.flatten.length = 0;

        let i = 0;

        const rec = (node: TreeNode<T>): void => {
            this.flatten.push(node);
            node.flatIndex = i++;

            if(node.expanded) {
                for(const child of node.children) {
                    rec(child);
                }
            }
        };

        for(const node of this.tree) {
            rec(node);
        }

        this.DOM_computeViewbox();
        this.DOM_updateViewBoxHeight();
        this.DOM_resetTableRows();
        this.DOM_updateScroll(true);
    }

    /**
     *
     */
    private DOM_resetSelections(): void {
        this.unselectAllCells();
        this.unselectAllRows();
        this.unselectAllColumns();
    }

    /**
     * Retourne le nœud de l'arbre de la vue correspondant à l'élément `<tr>` donné.
     * en O(1)
     */
    private DOM_getRowFromHTMLRow($row: HTMLTableRowElement | null | undefined): TableRow<T> | null {
        if($row === null || $row === undefined || this.rows.length === 0) {
            return null;
        }

        const index = parseInt($row.dataset.index || '-1', 10);
        const firstIndex = +(this.rows[0].$.dataset.index ?? 0);

        return this.rows[index - firstIndex] || null;
    }

    /**
     *
     */
    private DOM_getRowIndex(row: TableRow<T>): number {
        return +(row.$.dataset.index ?? "-1");
    }

    /**
     * Appelé APRES avoir mis à jour this.flatten
     */
    private DOM_updateViewBoxHeight(): void {
        this.TOTAL_VISIBLE_ROWS = this.flatten.length;
        // console.debug("Total visible rows: ", this.TOTAL_VISIBLE_ROWS);

        const totalHeight = this.totalVirtualHeight + this.$tableHead.clientHeight - 1;
        this.$table.style.height = totalHeight + 'px';
    }

    /**
     *
     */
    private DOM_updateRowsContent(): void {
        for(const row of this.rows) {
            this.DOM_updateRowContent(row);
        }
    }

    /**
     *
     */
    private DOM_updateRowContent(row: TableRow<T>): void {
        if(!row.ref) {
            return;
        }

        const hasChildren = row.ref.children.length > 0;

        let rowClasses = "tr ";

        if(this.rowCssClassesCallback !== undefined) {
            rowClasses += this.rowCssClassesCallback(row);
        }

        row.$.className = rowClasses;

        row.$.classList.toggle('has-children', hasChildren);
        row.$.classList.toggle('expanded', row.ref.expanded);
        row.$.classList.toggle('selected', this.selectedNodes.has(this.DOM_getRowIndex(row)));
        row.$.style.setProperty('--depth', `${row.ref.depth}`);

        const visibleColumns = this.columns.filter(c => !c.hidden);

        for(const i in visibleColumns) {
            const col = visibleColumns[i];

            if(col.hidden) {
                continue;
            }

            const $cell = row.$.children.item(+i) as HTMLElement | null;

            if(!$cell)
                continue;

            const hasField = col.field !== undefined;

            const value = hasField
                ? row.ref.data[col.field!]
                : undefined;

            const showRequired = this.options.allowCellEditing === true
                && col.readonly !== true
                && col.required === true
                && (
                    (value === undefined || value === null)
                    || ((col.type === "string" && value === "")
                    || (col.type === "number" && value === 0 && this.options.treatZeroAsEmpty === true))
                );

            const realValue = (value === 0 && this.options.treatZeroAsEmpty === true)
                ? undefined
                : value;

            const cell: Cell<T> = {
                $: row.$,
                value: realValue,
                row: row.ref,
                column: col,
                rowIndex: row.y,
                columnIndex: +i,
            };

            let transformedValue: string;

            if(col.transform !== undefined) {
                const v = col.transform?.(cell);

                if(v === undefined || v === null) {
                    transformedValue = "";
                }
                else if(v instanceof HTMLElement) {
                    transformedValue = v.outerHTML;
                }
                else {
                    transformedValue = v;
                }
            }
            else {
                transformedValue = this.formatCellValue(value);
            }

            let html = '';

            if(hasChildren && $cell.classList.contains('expand') && this.options.allowExpandCollapse) {
                const cls = row.ref.expanded
                    ? 'expanded'
                    : 'collapsed';

                html += `<button class="btn-expand"><span class="expand-icon ${cls}"></span></button>`;
            }

            html += `<div class="cell-value">${transformedValue}</div>`;

            $cell.innerHTML = html;

            $cell.classList.toggle('validator-required', showRequired);
        }
    }

    /**
     *
     */
    private DOM_getTableRowFromNode(node: TreeNode<T>): TableRow<T> | undefined {
        if(node.flatIndex < 0 || node.flatIndex >= this.flatten.length) {
            return undefined;
        }

        return this.rows.find(r => r.ref?.data.id === node.data.id);
    }

    /**
     *
     */
    private formatCellValue(value: Any): string {
        return value?.toString() || '';
    }

    /**
     * Réinitialise les lignes du tableau.
     * Supprime toutes les lignes existantes,
     * puis en recrée un nombre fixe
     * défini par VISIBLE_ROWS_COUNT.
     */
    private DOM_resetTableRows(): void {
        for(const row of this.rows) {
            row.$.remove();
        }

        this.rows.length = 0;

        const max = Math.min(this.flatten.length, this.VISIBLE_ROWS_COUNT);

        const $fragment = document.createDocumentFragment();

        for(let i=0; i < max; i++) {
            const row = this.DOM_createEmptyRow(false);
            $fragment.appendChild(row.$);
            this.DOM_setRowPosition(row, { top: i, left: 0 });
        }

        this.$tableBody.appendChild($fragment);

        if(this.rows.length > 0) {
            this.mostTopRow = this.rows[0].nextElement!;
        }
    }

    /**
     * Créé une <tr> vide et l'ajoute à la fin du <tbody>.
     * Créé les <td> correspondants aux colonnes.
     *
     * @returns La ligne vide créée.
     */
    private DOM_createEmptyRow(shouldAddDirectly: boolean = true): TableRow<T> {
        const row: TableRow<T> = {
            $: document.createElement('div'),
            x: 0,
            y: 0,
        };

        row.$.classList.add('tr');

        row.nextElement = row;
        row.previousElement = row;

        if(this.rows.length > 0) {
            row.previousElement = this.rows[this.rows.length - 1];
            row.previousElement.nextElement = row;
            row.nextElement = this.rows[0];
            row.nextElement.previousElement = row;
        }

        this.rows.push(row);

        this.DOM_createEmptyCells(row);

        if(shouldAddDirectly) {
            this.$tableBody.appendChild(row.$);
        }

        return row;
    }

    /**
     * Créé les <td> vides correspondant aux colonnes.
     *
     * @param row La ligne à laquelle ajouter les cellules vides.
     */
    private DOM_createEmptyCells(row: TableRow<T>): void {
        const $fragment = document.createDocumentFragment();

        for(const columnDef of this.columns) {
            if(columnDef.hidden) {
                continue;
            }

            const $td = document.createElement('div');
            $td.classList.add('td', ...(columnDef.cssClasses || []));

            if(columnDef.field) {
                $td.classList.add('field', `field-${columnDef.field.toString()}`);
            }

            $td.style.setProperty('--width', columnDef.width + this.columnUnits);

            $td.dataset.type = columnDef.type;

            $fragment.appendChild($td);
        }

        row.$.appendChild($fragment);
    }

    /**
     * Supprime la ligne donnée du <tbody> et de la liste des lignes.
     *
     * @param row La ligne à supprimer.
     */
    private DOM_removeRow(rowIndex: number): void;
    private DOM_removeRow(row: TableRow<T>): void;
    private DOM_removeRow(row: number | TableRow<T>): void {
        let rowIndex: number = -1;

        if(typeof row === 'number') {
            rowIndex = row;
            row = this.rows[row];
        }
        else {
            rowIndex = this.rows.findIndex(r => r === row);
        }

        if(!row || rowIndex === -1)
            return;

        if(row.$.parentNode) {
            row.$.remove();
        }

        this.rows.splice(rowIndex, 1);

        if(row.previousElement) {
            row.previousElement.nextElement = row.nextElement;
        }

        if(row.nextElement) {
            row.nextElement.previousElement = row.previousElement;
        }
    }

    /**
     * Supprime la cellule à l'index donné de chaque ligne.
     * L'élément HTML de l'entête de la colonne est également enlevé
     */
    private DOM_removeCell(columnIndex: number): void {
        if(columnIndex < 0 || columnIndex >= this.columns.length || this.columns[columnIndex].hidden) {
            return;
        }

        this.columns[columnIndex].hidden = true;

        this.$columns[columnIndex].remove();

        // calcule l'index des cellules à supprimer.
        // Ce doit être columnIndex - X, où X est le nombre de colonnes cachées avant celle-ci.
        const hiddenCount = this.columns
            .slice(0, columnIndex)
            .filter(c => c.hidden)
            .length;

        const cellIndex = columnIndex - hiddenCount;

        for(const row of this.rows) {
            const $cell = row.$.children.item(cellIndex) as HTMLElement | null;
            $cell?.remove();
        }

        this.DOM_updateRowsContent();
    }

    /**
     * Met à jour la position de la ligne donnée.
     * Appelé lors d'un scroll.
     *
     * @param row La ligne à mettre à jour.
     * @param position La nouvelle position de la ligne.
     */
    private DOM_setRowPosition(row: TableRow<T>, position: Position): void {
        const top = this.TBODY_START_Y + position.top * (this.ROW_HEIGHT - 1);

        row.y = position.top;
        row.ref = this.flatten[row.y];
        row.$.dataset.index = `${row.y}`;
        row.$.dataset.treeIndex = `${row.ref?.flatIndex}`;
        row.$.dataset.id = row.ref?.data.id?.toString() || '';
        row.$.style.setProperty('--y', top + 'px');
    }

    /**
     * Met à jour la position des lignes visibles.
     * Appelé lors d'un scroll.
     */
    private DOM_updateScroll(force?: boolean): void {
        if(this.rows.length === 0) {
            return;
        }

        const y = this.mostTopRow?.y ?? 0;
        const scrollTopIndex = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2);
        const topMin = this.TBODY_START_Y + y * (this.ROW_HEIGHT - 1);
        const topMax = topMin + this.ROW_HEIGHT;

        const isOverflow = this.totalVirtualHeight > this.container.clientHeight;

        if(this.scrollTop >= topMin && this.scrollTop <= topMax) {
            return;
        }

        if(isOverflow && scrollTopIndex + this.VISIBLE_ROWS_COUNT - 1 >= this.flatten.length) {
            return;
        }

        if(!force && scrollTopIndex === this.lastScrollTopIndex) {
            return;
        }

        this.lastScrollTopIndex = scrollTopIndex;

        for(let i=0; i < this.rows.length; i++) {
            const row = this.rows[i];
            this.DOM_setRowPosition(row, { top: scrollTopIndex + i, left: row.x });
        }

        this.DOM_updateRowsContent();
    }

    private lastScrollTopIndex: number = -1;

    /**
     * Gère l'événement de scroll du conteneur.
     * Met à jour les positions des lignes visibles.
     */
    private DOM_EVENT_onScroll(e: Event): void {
        this.DOM_updateScroll();
    }

    /**
     *
     */
    private DOM_EVENT_onClick(e: MouseEvent): void {
        if(!e.shiftKey && !e.ctrlKey) {
            this.DOM_resetSelections();
        }

        this.cancelCellEdition();

        const $target = e.target as HTMLElement;

        if($target.closest('.th')) {
            const target = $target.closest('.th') as HTMLElement;
            const targetIndex = this.$columns.indexOf(target);
        }
        // body
        else {
            const $closestRow = $target.closest('.tr') as HTMLTableRowElement;

            const closestRow = this.DOM_getRowFromHTMLRow($closestRow);

            if(closestRow) {
                this.DOM_EVENT_onRowClick(e, closestRow, $target);
            }
        }
    }

    /**
     *
     */
    private DOM_EVENT_onRowClick(e: MouseEvent, row: TableRow<T>, $target: HTMLElement): void {
        if($target.closest('.btn-expand')) {
            this.toggleRowExpand(row);
            return;
        }

        if($target.closest('.td')) {
            const $cell = $target.closest('.td') as HTMLElement;

            if(this.options.allowCellEditing) {
                this.editCell(row, $cell);
            }

            if(this.options.allowCellSelection) {
                // this.selectCell(row, $cell);
            }

            if(this.options.allowRowSelection) {
                this.selectRow(e, row);
            }

            return;
        }
    }


    /**
     * Gère l'événement de clic sur une ligne.
     * Développe ou réduit la ligne si elle a des enfants.
     *
     * @param row La ligne sur laquelle on a cliqué.
     * @param expandBtn Le bouton d'expansion/réduction.
     */
    private toggleRowExpand(row: TableRow<T>): void {
        if(!this.options.allowExpandCollapse) {
            return;
        }

        if(!row.ref) {
            console.warn('Cannot toggle expand on a row without a reference to the data node.');
            return;
        }

        const node = row.ref;

        node.expanded = !node.expanded;

        row.$.classList.toggle('expanded', node.expanded);

        this.DOM_computeInViewVisibleRows();
    }


    // ------------------------------------------------------------------------------

    /**
     * Convertit les données d'un nœud en un nœud de l'arbre,
     * utilisable en interne.
     */
    private dataToTreeNodeRec(data: T, parent: TreeNode<T> | undefined = undefined): TreeNode<T> {
        const node: TreeNode<T> = {
            data,
            expanded: this.options.defaultExpanded,
            depth: parent
                ? parent.depth + 1
                : 0,
            parent,
            flatIndex: -1,
            children: [],
        };

        if(Array.isArray(data.children)) {
            node.children = this.computeTree(data.children as T[], node);
        }

        return node;
    }

    /**
     *
     */
    private computeTree(data: T[], parent: TreeNode<T> | undefined = undefined): TreeNode<T>[] {
        const root = new Array(data.length);

        for(let i = 0; i < data.length; i++) {
            const d = data[i];

            const node = this.dataToTreeNodeRec(d, parent);

            root[i] = node;

            this.nodeMap.set(d.id.toString(), node);

            if(i > 0 && root.length > 1) {
                node.left = root[i - 1];
                root[i - 1].right = node;
            }
        }

        if(root.length > 1) {
            root[0].left = root[root.length - 1];
            root[root.length - 1].right = root[0];
        }

        return root;
    }

    /**
     *
     */
    private recomputeDataTree(data: T[]): void {
        this.tree = this.computeTree(data);
        console.debug("Recomputed data tree:", this.tree);
    }






    // ----------------------------------------------------------------------
    // PUBLIC API


    // ------------------------------------------------------------------------------
    // CRUD

    /**
     *
     */
    public deleteNode(nodeId: string): typeof this {
        return this.deleteNodes([nodeId]);
    }

    /**
     *
     */
    public deleteNodes(nodeIds: string[]): typeof this {
        if(nodeIds.length === 0) {
            return this;
        }

        // 1. modifie l'arbre (this.tree)
        for(const id of nodeIds) {
            const node = this.nodeMap.get(id);

            if(!node) {
                continue;
            }

            // a. déconnexion des voisins horizontaux
            if(node.left)
                node.left.right = node.right;

            if(node.right)
                node.right.left = node.left;

            // b. Suppression dans le parent
            if(node.parent) {
                const idx = node.parent.children.indexOf(node);

                if(idx !== -1) {
                    node.parent.children.splice(idx, 1);
                }
            }
            // root tree
            else {
                const idx = this.tree.indexOf(node);

                if(idx !== -1) {
                    this.tree.splice(idx, 1);
                }
            }

            // c. Suppression récursive de ce noeud et ses enfants dans le hashmap
            const stack = [node];

            while(stack.length > 0) {
                const currentNode = stack.pop()!;

                this.nodeMap.delete(currentNode.data.id.toString());

                for(const child of currentNode.children) {
                    stack.push(child);
                }
            }

            // d. Nettoyage des références pour GC (garbage collector)
            node.parent = undefined;
            node.left = undefined;
            node.right = undefined;
            node.children.length = 0;
        }

        // 2. Reconstruction de `this.flatten`
        this.DOM_computeInViewVisibleRows();

        return this;
    }

    /**
     *
     */
    public addNode(relativeTo: string, asChildren: boolean, element: T): typeof this {
        return this.addNodes(relativeTo, asChildren, [element]);
    }

    /**
     *
     */
    public addNodes(relativeTo: string, asChildren: boolean, elements: T[]): typeof this {
        if(elements.length === 0) {
            return this;
        }

        const referenceNode = this.nodeMap.get(relativeTo);

        if(!referenceNode && asChildren) {
            console.warn(`Reference node with ID "${relativeTo}" not found.`);
            return this;
        }

        const duplicateIds = this.verifyDuplicateIds(elements);

        if(duplicateIds.size > 0) {
            console.warn('Duplicate IDs found in the elements to add:', Array.from(duplicateIds).join(', '));
            return this;
        }

        const parentNode = asChildren
            ? referenceNode
            : referenceNode?.parent;

        const newNodes: TreeNode<T>[] = this.computeTree(elements, parentNode);

        let nodes: TreeNode<T>[];
        let childCount = 0;

        // insère la liste des nouveaux noeuds à la fin de la liste des enfants de référence
        if(asChildren) {
            if(!Array.isArray(referenceNode!.children)) {
                referenceNode!.children = [];
            }

            nodes = referenceNode!.children;
            childCount = nodes.length;
            nodes.push(...newNodes);
        }
        // insère la liste des nouveaux noeuds juste après le relativeTo
        else {
            nodes = parentNode?.children ?? this.tree;

            const index = referenceNode
                ? nodes.indexOf(referenceNode)
                : -1;

            if(index === -1 && referenceNode !== undefined) {
                console.warn(`Reference node with ID "${relativeTo}" not found in the parent.`);
                return this;
            }

            childCount = nodes.length;
            nodes.splice(index + 1, 0, ...newNodes);
        }

        const newChildCount = childCount + newNodes.length;

        if(childCount > 0) {
            // jointure interne
            nodes[childCount - 1].right = nodes[childCount];
            nodes[childCount].left = nodes[childCount - 1];

            // jointure externe
            nodes[newChildCount - 1].right = nodes[0];
            nodes[0].left = nodes[newChildCount - 1];
        }

        this.DOM_computeInViewVisibleRows();

        return this;
    }

    /**
     *
     */
    public updateNode(node: UpdatedRow<T>): typeof this {
        return this.updateNodes([node]);
    }

    /**
     * Met à jour les données d'un ou plusieurs nœuds.
     * L'identifiant (`id`) est forcément présent dans les données.
     * La propriété `children` n'a pas à être renseignée et sera ignorée.
     * Met à jour les données "pûres" du noeud, pas ses enfants.
     * Utiliser `addNodes` ou `deleteNodes` pour gérer les enfants.
     * Si un nœud n'existe pas, il sera ignoré.
     * Si un nœud est renseigné plusieurs fois, tout sera pris en compte,
     * à chaque itération le nœud sera mis à jour.
     */
    public updateNodes(nodes: UpdatedRow<T>[]): typeof this {
        if(nodes.length === 0) {
            return this;
        }

        for(const nodeData of nodes) {
            const existingNode = this.nodeMap.get(nodeData.id.toString());

            if(!existingNode) {
                console.warn(`Node with ID "${nodeData.id}" not found.`);
                continue;
            }

            // Met à jour les données du noeud
            existingNode.data = { ...existingNode.data, ...nodeData };

            const tableRow = this.DOM_getTableRowFromNode(existingNode);

            if(tableRow) {
                this.DOM_updateRowContent(tableRow);
            }
        }

        return this;
    }


    /**
     * Vérifie si les éléments à ajouter ont des IDs dupliqués,
     * entre eux, et avec les IDs déjà présents dans le hashmap.
     * @returns Un Set contenant les IDs dupliqués.
     */
    private verifyDuplicateIds(elements: Type[]): Set<string> {
        const duplicateIds = new Set<string>();

        const recursiveCheck = (elements: Type[]): void => {
            for(const element of elements) {
                const id = element.id.toString();

                if(this.nodeMap.has(id) || duplicateIds.has(id)) {
                    duplicateIds.add(id);
                }

                if(Array.isArray(element.children)) {
                    recursiveCheck(element.children);
                }
            }
        };

        recursiveCheck(elements);

        return duplicateIds;
    }


    /**
     * Reset et redéfini les données de la table.
     * Recalcule tout, excepté les colonnes.
     */
    public setData(data: T[]): void {
        data = structuredClone(data);

        const dups = this.verifyDuplicateIds(data);

        if(dups.size > 0) {
            console.warn('Duplicate IDs found in the data:', Array.from(dups).join(', '));
            return;
        }

        this.recomputeDataTree(data);

        this.DOM_computeInViewVisibleRows();
    }

    /**
     *
     */
    public clear(): void {
        this.tree.length = 0;
        this.flatten.length = 0;
        this.rows.length = 0;
        this.nodeMap.clear();

        this.$tableBody.innerHTML = '';

        this.DOM_computeInViewVisibleRows();
    }

    public rowCssClassesCallback?: (row: TableRow<T>) => string;


    /**
     *
     */
    public getNodes(): readonly TreeNode<T>[] {
        return this.tree;
    }


    // ---- scroll ----

    /**
     * Déplace le scroll jusqu'à l'index de la ligne spécifié.
     */
    public scrollTo(index: number): typeof this {
        this.container.scrollTo({
            top: this.TBODY_START_Y + index * (this.ROW_HEIGHT - 1),
            behavior: 'smooth',
        });

        return this;
    }





    // ---- selection ----

    /**
     *
     */
    public selectRow(event: MouseEvent, row: TableRow<T>): typeof this {
        if(!row.ref) {
            console.warn('Cannot select a row without a reference to the data node.');
            return this;
        }

        const rowIndex = this.DOM_getRowIndex(row);

        // range selection
        if(event.shiftKey) {
            // get the index the nearest from the clicked node from the selected nodes (compare nodes indexes)
            const nearestSelectedIndex = Array.from(this.selectedNodes).reduce((nearest, current) => {
                if(rowIndex === -1) {
                    return nearest;
                }

                return Math.abs(current - rowIndex) < Math.abs(nearest - rowIndex)
                    ? current
                    : nearest;
            }, -1);

            if(nearestSelectedIndex === -1) {
                return this;
            }

            const from = Math.min(nearestSelectedIndex, rowIndex);
            const to = Math.max(nearestSelectedIndex, rowIndex);

            const firstElIndex = this.DOM_getRowIndex(this.rows[0]);
            const lastElIndex = this.DOM_getRowIndex(this.rows[this.rows.length - 1]);

            for(let i=from; i <= to; i++) {
                const rowToSelect = this.flatten[i];
                this.selectedNodes.add(rowToSelect.flatIndex);

                if(i >= firstElIndex && i <= lastElIndex) {
                    const $row = this.rows[i - firstElIndex]?.$;
                    $row?.classList.add('selected');
                }
            }

            return this;
        }

        // unit selection
        if(this.selectedNodes.has(rowIndex)) {
            row.$.classList.remove('selected');
            this.selectedNodes.delete(rowIndex);
        }
        else {
            row.$.classList.add('selected');
            this.selectedNodes.add(rowIndex);
        }

        return this;
    }

    /**
     *
     */
    public selectAllRows(): typeof this {
        this.$tableBody.querySelectorAll('.tr').forEach($row => {
            $row.classList.add('selected');
        });

        this.selectedNodes.clear();

        for(let i=0; i < this.rows.length; i++) {
            this.selectedNodes.add(i);
        }

        return this;
    }

    /**
     *
     */
    public unselectAllRows(): typeof this {
        this.$tableBody.querySelectorAll('.tr.selected').forEach($row => {
            $row.classList.remove('selected');
        });

        this.selectedNodes.clear();

        return this;
    }

    /**
     *
     */
    public selectCell(): typeof this {
        // TODO
        return this;
    }

    /**
     *
     */
    public unselectAllCells(): typeof this {
        this.$tableBody.querySelectorAll('.td.selected').forEach($cell => {
            $cell.classList.remove('selected');
        });

        this.selectedCells.clear();

        return this;
    }

    /**
     *
     */
    public selectColumn(column: ColumnDef<T>): typeof this {
        const columnIndex = this.columns.findIndex(c => c.title === column.title);

        if(columnIndex === -1) {
            console.warn(`Column "${column.title}" not found.`);
            return this;
        }

        if(this.selectedColumns.has(columnIndex)) {
            this.$tableHead.querySelectorAll('.th.selected').forEach($th => {
                $th.classList.remove('selected');
            });
            this.selectedColumns.delete(columnIndex);
        }
        else {
            this.$tableHead.querySelectorAll('.th').forEach($th => {
                if($th.textContent === column.title) {
                    $th.classList.add('selected');
                }
            });
            this.selectedColumns.add(columnIndex);
        }

        return this;
    }

    /**
     *
     */
    public unselectAllColumns(): typeof this {
        this.$tableHead.querySelectorAll('.th.selected').forEach($th => {
            $th.classList.remove('selected');
        });

        this.selectedColumns.clear();

        return this;
    }

    /**
     *
     */
    public editCell(row: TableRow<T>, $cell: HTMLElement): typeof this {
        // TODO: créer input
        return this;
    }

    /**
     *
     */
    public cancelCellEdition(): typeof this {
        // this.states.$editedCellInput?.remove();
        // this.states.$editedCellInput = null;
        return this;
    }




    // ---- resizing ----

    /**
     *
     */
    public allowColumnResizing(allow: boolean): typeof this {
        this.options.allowColumnResize = allow;
        return this;
    }

    /**
     *
     */
    public allowRowSelection(allow: boolean): typeof this {
        this.options.allowRowSelection = allow;
        return this;
    }

    /**
     *
     */
    public allowCellSelection(allow: boolean): typeof this {
        this.options.allowCellSelection = allow;
        return this;
    }

    /**
     *
     */
    public allowCellEditing(allow: boolean): typeof this {
        this.options.allowCellEditing = allow;
        return this;
    }

    /**
     * Masque une colonne de la table.
     * Cette fonction ne supprime pas la colonne,
     * mais la rend invisible dans l'affichage.
     * @param column L'index de la colonne à masquer. Attention, il faut que ce soit l'index "absolu" (par rapport à toutes les colonnes, même celles cachées).
     */
    public hideColumn(columnIndex: number): typeof this;
    public hideColumn(columnId: string): typeof this;
    public hideColumn(columnIndexOrId: number | string): typeof this {
        let columnIndex: number;

        if(typeof columnIndexOrId === 'number') {
            columnIndex = columnIndexOrId;
        }
        else {
            columnIndex = this.columns.findIndex(c => c.id === columnIndexOrId);
        }

        if(columnIndex < 0 || columnIndex >= this.columns.length) {
            console.warn(`Column index ${columnIndex} is out of bounds.`);
            return this;
        }

        const column = this.columns[columnIndex];

        if(column.hidden) {
            console.warn(`Column "${column.title}" is already hidden.`);
            return this;
        }

        this.DOM_removeCell(columnIndex);

        return this;
    }



    // ---- drag & drop ----

    /**
     * Accepte l'événement de drop sur le conteneur.
     * Gère les classes CSS pour mettre à jour l'état de survol lors du drag.
     * Permet d'identifier quelle ligne a reçu le drop.
     */
    public makeDroppable(): typeof this {
        this.container.setAttribute('dropzone', 'move');

        this.container.addEventListener('dragover', (event) => {
            event.preventDefault();

            event.dataTransfer!.dropEffect = "move";

            const target = event.target as HTMLElement;
            const closestRow = target.closest('.tr') as HTMLElement;
            const isNotHead = !target.closest('.thead');

            if(closestRow && isNotHead && closestRow !== this.$lastHighlightedRow) {
                if(this.$lastHighlightedRow) {
                    this.$lastHighlightedRow.classList.remove('dragging-hover');
                }

                closestRow.classList.add('dragging-hover');
                this.$lastHighlightedRow = closestRow;
            }
            else if(!closestRow || !isNotHead) {
                if(this.$lastHighlightedRow) {
                    this.$lastHighlightedRow.classList.remove('dragging-hover');
                    this.$lastHighlightedRow = null;
                }
            }
        }, { capture: true });

        this.container.addEventListener('drop', (event) => {
            event.preventDefault();

            const target = event.target as HTMLElement;
            const closestRow = target.closest('.tr');

            const data = event.dataTransfer?.getData('text/plain');

            this.$lastHighlightedRow?.classList.remove('dragging-hover');
            this.$lastHighlightedRow = null;

            const row: TableRow<T> = this.rows.find(r => r.$ === closestRow)!;

            this.onDrop(data, row);
        });

        return this;
    }

    /**
     * Si makeDroppable a été appelé, cette fonction sera appelée
     * en callback de l'évènement drop sur le conteneur de la table.
     */
    public onDrop: (data: string | undefined, row: TableRow<T>) => void = () => {};
}
