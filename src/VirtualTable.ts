import { /* Cell,  */Cell, ColumnDef, FlatNode, Position, TableRow, TreeNode, Type, VirtualTableOptions } from './types';

export class VirtualTable<T extends Type> {
    protected static readonly DEFAULT_OPTIONS: VirtualTableOptions = {
        id: '',
        columnSizeInPercentage: false,
        defaultExpanded: true,
        // -- allowed actions
        allowColumnSelection: false,
        allowRowSelection: false,
        allowCellSelection: false,
        allowCellEditing: false,
        allowColumnResize: false,
        allowColumnReorder: false,
        allowRowReorder: false,
    };


    private readonly table: HTMLElement;
    private readonly tableHead: HTMLElement;
    private readonly tableBody: HTMLElement;

    private readonly virtualScroller: HTMLDivElement;

    private readonly columns: ColumnDef<T>[] = [];
    private rows: TableRow<T>[] = [];
    private data: T[] = []; // a tree of data that has not 1 root but a list of roots
    private tree: TreeNode<T>[] = []; // a tree of data that has not 1 root but a list of roots
    private flatten: FlatNode<T>[] = []; // a flat list coming from data, preorder traversal, with invisible elements removed

    private readonly ROW_HEIGHT = 30;
    private VISIBLE_ROWS_COUNT = 0;

    private TOTAL_VISIBLE_ROWS = 0;
    private tbodyStartY = 0;

    private readonly selectedNodes = new Set<number>(); // indexes of the selected nodes in the flattened list
    private readonly selectedCells = new Set<{ nodeIndex: number; fieldIndex: number; }>(); // indexes of the selected cells in the flattened list
    private readonly selectedColumns = new Set<number>(); // indexes of the selected columns in the columns list

    private mostTopRow!: TableRow<T>;

    public readonly options: VirtualTableOptions;


    constructor(private readonly container: HTMLElement, columnsDef: ColumnDef<T>[], options: Partial<VirtualTableOptions> = {}) {
        this.options = { ...VirtualTable.DEFAULT_OPTIONS, ...options };

        this.columns = columnsDef;

        this.virtualScroller = document.createElement('div');
        this.virtualScroller.classList.add('virtual-scroller');

        this.table = document.createElement('div');
        this.table.classList.add('table');
        
        this.tableHead = document.createElement('div');
        this.tableHead.classList.add('thead');
        
        this.tableBody = document.createElement('div');
        this.tableBody.classList.add('tbody');

        this.table.append(this.tableHead, this.tableBody);

        this.container.appendChild(this.table);
        this.container.appendChild(this.virtualScroller);

        if(this.options.id) {
            this.table.id = this.options.id;
        }

        this.createColumns();
        this.computeViewbox();

        this.container.addEventListener('scroll', (e) => this.onScroll(e));
        this.container.addEventListener('click', (e) => this.onClick(e));

        this.table.style.setProperty('--row-height', this.ROW_HEIGHT + 'px');
    }

    /**
     * Retourne la position actuelle du scroll dans le conteneur.
     */
    private get scrollTop(): number {
        return this.container.scrollTop;
    }

    private get totalVirtualHeight(): number {
        //                                                                          border-size v
        return this.tableHead.clientHeight + (this.TOTAL_VISIBLE_ROWS - 1) * (this.ROW_HEIGHT - 1);
    }

    private get columnUnits(): string {
        return this.options.columnSizeInPercentage ? '%' : 'px';
    }

    /**
     * Définit le colonnes de la table et le formattage des cellules
     * des données appartenant à ces colonnes.
     */
    private createColumns(): void {
        const $tr = document.createElement('div');
        $tr.classList.add('tr');

        for(const columnDef of this.columns) {
            const $th = document.createElement('div');
            $th.classList.add('th');
            $th.style.width = columnDef.width + this.columnUnits;
            $th.textContent = columnDef.title;
            $tr.appendChild($th);
        }

        this.tableHead.appendChild($tr);
    }

    /**
     * Sert à recalculer le nombre de lignes visibles dans le conteneur.
     * Utilisé à l'initialisation et lors d'un redimensionnement du conteneur.
     * Ajoute ou enlève les lignes nécessaires.
     * Ensuite, appelle computeInViewVisibleRows.
     */
    private computeViewbox(): void {
        const CONTAINER_HEIGHT = this.container.clientHeight;
        this.VISIBLE_ROWS_COUNT = Math.ceil(CONTAINER_HEIGHT / this.ROW_HEIGHT) + 4; // Ajouter un buffer pour éviter les sauts

        if(this.flatten.length > 0) {
            // adapt the number of rows in the list (remove unnecessary rows if needed, or add new ones)
            const rowsCount = this.flatten.length;
            const max = Math.min(rowsCount, this.VISIBLE_ROWS_COUNT);

            if(this.rows.length < max) {
                for(let i = this.rows.length; i < max; i++) {
                    this.createEmptyRow(); // il manque un truc ici : rattacher les nouveaux à previous/nextElement
                }
            }
            else if(this.rows.length > max) {
                for(let i = this.rows.length - 1; i >= max; i--) {
                    this.removeRow(this.rows[i]); // meme remarque
                }
            }
        }

        this.tbodyStartY = this.tableHead.clientHeight - 1;
    }

    /**
     * Calcule les lignes visibles dans le conteneur.
     * Met à jour la hauteur du conteneur virtuel.
     * En amont, transforme l'arbre en liste plate.
     * La liste plate ne contient que les nœuds visibles.
     * 
     * Note : recalcule TOUT, pas intelligemment. A n'appeler
     *        que si on souhaite tout remettre à jour, pas
     *        seulement une partie.
     */
    private computeInViewVisibleRows(): void {
        // TODO : ajouter le système de filtrage ici
        this.flatten = [];
        this.resetSelections();

        let index = -1;

        const rec = (node: TreeNode<T>): void => {
            index++;
            this.flatten.push({ node, index });

            if(node.expanded) {
                for(const child of node.children) {
                    rec(child);
                }
            }
        };

        for(const node of this.tree) {
            rec(node);
        }

        this.computeViewbox();
        this.updateViewBoxHeight();
    }

    private resetSelections(): void {
        this.unselectAllCells();
        this.unselectAllRows();
        this.unselectAllColumns();
    }

    /**
     * Retourne le nœud de l'arbre correspondant à la ligne donnée.
     * en O(1)
     */
    private getNodeFromRow($row: HTMLElement | null | undefined): TableRow<T> | null {
        if($row === null || $row === undefined || this.rows.length === 0) {
            return null;
        }

        const index = parseInt($row.dataset.index || '-1', 10);
        const firstIndex = +(this.rows[0].$.dataset.index ?? 0);

        return this.rows[index - firstIndex] || null;
    }

    /**
     * Appelé APRES avoir mis à jour this.flatten
     */
    private updateViewBoxHeight(): void {
        this.TOTAL_VISIBLE_ROWS = this.flatten.length;
        console.log(this.TOTAL_VISIBLE_ROWS);
        this.virtualScroller.style.height = this.totalVirtualHeight + 'px';
    }

    private updateRowsContent(): void {
        for(const row of this.rows) {
            if(!row.ref) {
                continue;
            }

            const hasChildren = row.ref.node.children.length > 0;

            row.$.classList.toggle('has-children', hasChildren);
            row.$.style.setProperty('--depth', `${row.ref.node.depth}`);

            for(const i in this.columns) {
                const col = this.columns[i];

                const $cell = row.$.children.item(+i);

                if($cell) {
                    const value = col.field
                        ? row.ref.node.data[col.field]
                        : undefined;

                    const cell: Cell<T> = {
                        $: row.$,
                        value,
                        row: row.ref.node,
                        column: col,
                        rowIndex: row.y,
                        columnIndex: +i,
                    };
                    const transformedValue = col.transform?.(cell) || this.formatCellValue(value);

                    let html = '';

                    if(hasChildren && i === '0') {
                        const cls = row.ref.node.expanded ? 'expanded' : 'collapsed';
                        html += `<button class="btn-expand"><span class="expand-icon ${cls}"></span></button>`;
                    }

                    html += `<span class="cell-value">${transformedValue}</span>`;

                    $cell.innerHTML = html;
                }
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private formatCellValue(value: any): string {
        return value?.toString() || '';
    }


    // ------------------------------------------------------------------------------
    // Table DOM manager

    /**
     * Créé une <tr> vide et l'ajoute à la fin du <tbody>.
     * Créé les <td> correspondants aux colonnes.
     * 
     * @returns La ligne vide créée.
     */
    private createEmptyRow(shouldAddDirectly: boolean = true): TableRow<T> {
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

        this.createEmptyCells(row);

        if(shouldAddDirectly) {
            this.tableBody.appendChild(row.$);
        }

        return row;
    }

    /**
     * Créé les <td> vides correspondant aux colonnes.
     * 
     * @param row La ligne à laquelle ajouter les cellules vides.
     */
    private createEmptyCells(row: TableRow<T>): void {
        const $fragment = document.createDocumentFragment();

        for(const i in this.columns) {
            const $td = document.createElement('div');
            $td.classList.add('td');
            $td.style.setProperty('--width', this.columns[i].width + this.columnUnits);

            $fragment.appendChild($td);
        }

        row.$.appendChild($fragment);
    }

    /**
     * Supprime la ligne donnée du <tbody> et de la liste des lignes.
     * 
     * @param row La ligne à supprimer.
     */
    private removeRow(row: TableRow<T>): void {
        if(row.$.parentNode) {
            row.$.remove();
        }

        const rowIndex = this.rows.findIndex(r => r === row);

        if(rowIndex !== -1) {
            this.rows.splice(rowIndex, 1);

            if(row.previousElement) {
                row.previousElement.nextElement = row.nextElement;
            }

            if(row.nextElement) {
                row.nextElement.previousElement = row.previousElement;
            }
        }
    }

    /**
     * Met à jour la position de la ligne donnée.
     * Appelé lors d'un scroll.
     * 
     * @param row La ligne à mettre à jour.
     * @param position La nouvelle position de la ligne.
     */
    private setRowPosition(row: TableRow<T>, position: Position): void {
        const top = this.tbodyStartY + position.top * (this.ROW_HEIGHT - 1);

        row.y = position.top;
        row.ref = this.flatten[row.y];
        row.$.dataset.index = `${row.y}`;
        row.$.dataset.id = row.ref.node.data.id?.toString() || '';
        row.$.style.setProperty('--y', top + 'px');
    }

    /**
     * Met à jour la position des lignes visibles.
     * Appelé lors d'un scroll.
     */
    private updateScroll(): void {
        if(this.rows.length === 0) {
            return;
        }

        const topMin = this.tbodyStartY + this.mostTopRow.y * (this.ROW_HEIGHT - 1);
        const topMax = topMin + this.ROW_HEIGHT;

        if(this.scrollTop >= topMin && this.scrollTop <= topMax) {
            return;
        }

        const scrollTopIndex = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2);

        if(scrollTopIndex + this.VISIBLE_ROWS_COUNT - 1 >= this.flatten.length) {
            return;
        }

        for(let i=0; i < this.rows.length; i++) {
            const row = this.rows[i];
            this.setRowPosition(row, { top: scrollTopIndex + i, left: row.x });
        }

        this.updateRowsContent();
    }

    /**
     * Gère l'événement de scroll du conteneur.
     * Met à jour les positions des lignes visibles.
     */
    private onScroll(e: Event): void {
        this.updateScroll();
    }

    private onClick(e: MouseEvent): void {
        const $target = e.target as HTMLElement;
        const $closestRow = $target.closest('.tr') as HTMLElement;

        const closestRow = this.getNodeFromRow($closestRow);

        console.log(closestRow, $target);

        this.cancelCellEdition();

        if(!e.shiftKey && !e.ctrlKey) {
            this.resetSelections();
        }

        if(closestRow) {
            this.onRowClick(e, closestRow, $target);
        }
    }

    private onRowClick(e: MouseEvent, row: TableRow<T>, $target: HTMLElement): void {
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
        }

        if(this.options.allowRowSelection) {
            this.selectRow(e, row);
        }
    }

    public selectRow(event: MouseEvent, row: TableRow<T>): void {
        if(!row.ref) {
            console.warn('Cannot select a row without a reference to the data node.');
            return;
        }

        // range selection
        if(event.shiftKey) {
            const node = row.ref;
            
            // get the index the nearest from the clicked node from the selected nodes (compare nodes indexes)
            const nearestSelectedIndex = Array.from(this.selectedNodes).reduce((nearest, current) => {
                return Math.abs(current - node.index) < Math.abs(nearest - node.index)
                    ? current
                    : nearest;
            }, -1);

            if(nearestSelectedIndex === -1) {
                console.warn('No nearest selected index found.');
                return;
            }

            const from = Math.min(nearestSelectedIndex, node.index);
            const to = Math.max(nearestSelectedIndex, node.index);

            const firstElIndex = this.rows[0]?.ref?.index || -1;
            const lastElIndex = this.rows[this.rows.length - 1]?.ref?.index || -1;

            console.log(`Selecting range from ${from} to ${to} (nearest: ${nearestSelectedIndex})`);
            console.log(`First element index: ${firstElIndex}, Last element index: ${lastElIndex}`);

            for(let i=from; i <= to; i++) {
                const rowToSelect = this.flatten[i];
                this.selectedNodes.add(rowToSelect.index);
                
                if(i >= firstElIndex && i <= lastElIndex) {
                    const $row = this.rows[i - firstElIndex]?.$;
                    console.log(`Selecting row ${i - firstElIndex} (${rowToSelect.index})`, $row);
                    $row?.classList.add('selected');
                }
            }
        }
        
        // unit selection
        if(this.selectedNodes.has(row.ref.index)) {
            row.$.classList.remove('selected');
            this.selectedNodes.delete(row.ref.index);
        }
        else {
            row.$.classList.add('selected');
            this.selectedNodes.add(row.ref.index);
        }
    }

    public selectAllRows(): void {
        this.tableBody.querySelectorAll('.tr').forEach($row => {
            $row.classList.add('selected');
        });

        this.selectedNodes.clear();

        for(let i=0; i < this.rows.length; i++) {
            this.selectedNodes.add(i);
        }
    }

    public unselectAllRows(): void {
        this.tableBody.querySelectorAll('.tr.selected').forEach($row => {
            $row.classList.remove('selected');
        });

        this.selectedNodes.clear();
    }

    public selectCell(): void {
        // TODO
    }

    public unselectAllCells(): void {
        this.tableBody.querySelectorAll('.td.selected').forEach($cell => {
            $cell.classList.remove('selected');
        });

        this.selectedCells.clear();
    }

    public selectColumn(column: ColumnDef<T>): void {
        const columnIndex = this.columns.findIndex(c => c.title === column.title);

        if(columnIndex === -1) {
            console.warn(`Column "${column.title}" not found.`);
            return;
        }

        if(this.selectedColumns.has(columnIndex)) {
            this.tableHead.querySelectorAll('.th.selected').forEach($th => {
                $th.classList.remove('selected');
            });
            this.selectedColumns.delete(columnIndex);
        }
        else {
            this.tableHead.querySelectorAll('.th').forEach($th => {
                if($th.textContent === column.title) {
                    $th.classList.add('selected');
                }
            });
            this.selectedColumns.add(columnIndex);
        }
    }

    public unselectAllColumns(): void {
        this.tableHead.querySelectorAll('.th.selected').forEach($th => {
            $th.classList.remove('selected');
        });

        this.selectedColumns.clear();
    }

    public editCell(row: TableRow<T>, $cell: HTMLElement): void {
        // TODO: créer input
    }

    public cancelCellEdition(): void {
        // this.states.$editedCellInput?.remove();
        // this.states.$editedCellInput = null;
    }



    /**
     * Gère l'événement de clic sur une ligne.
     * Développe ou réduit la ligne si elle a des enfants.
     * 
     * @param row La ligne sur laquelle on a cliqué.
     * @param expandBtn Le bouton d'expansion/réduction.
     */
    private toggleRowExpand(row: TableRow<T>): void {
        // TODO : marche pas bien, et doit mettre à jour les indexes des lignes suivantes
        if(!row.ref) {
            console.warn('Cannot toggle expand on a row without a reference to the data node.');
            return;
        }

        const node = row.ref.node;

        node.expanded = !node.expanded;

        row.$.classList.toggle('expanded', node.expanded);

        // recompute the flattened list just in that area
        // remove all the recursive children of the node
        // and either add or remove these to or from the flattened list
        const startIndex = row.ref.index;
        
        if(node.expanded) {
            const children: FlatNode<T>[] = node.children.map((c, i) => ({
                node: this.dataToTreeNode(c.data, node.depth + 1),
                index: startIndex + 1 + i
            }));
            
            this.flatten.splice(startIndex + 1, 0, ...children);

            for(let i = startIndex + 1; i < startIndex + 1 + children.length; i++) {
                this.createEmptyRow(false);
            }
        }

        else {
            const childrenCount = node.children.length;
            this.flatten.splice(startIndex + 1, childrenCount);

            for(let i = 0; i < childrenCount; i++) {
                this.removeRow(this.rows[startIndex + 1]);
            }
        }

        this.updateViewBoxHeight();
        this.updateScroll();
        this.updateRowsContent();
    }

    /**
     * Réinitialise les lignes du tableau.
     * Supprime toutes les lignes existantes,
     * puis en recrée un nombre fixe
     * défini par VISIBLE_ROWS_COUNT.
     */
    private resetTableRows(): void {
        for(const row of this.rows) {
            row.$.remove();
        }

        this.rows = [];

        const max = Math.min(this.flatten.length, this.VISIBLE_ROWS_COUNT);

        const $fragment = document.createDocumentFragment();

        for(let i=0; i < max; i++) {
            const row = this.createEmptyRow(false);
            $fragment.appendChild(row.$);
            this.setRowPosition(row, { top: i, left: 0 });
        }

        this.tableBody.appendChild($fragment);

        if(this.rows.length > 0) {
            this.mostTopRow = this.rows[0].nextElement!;
        }
    }

    /**
     * Convertit les données d'un nœud en un nœud de l'arbre,
     * utilisable en interne.
     */
    private dataToTreeNode(data: T, depth: number): TreeNode<T> {
        return {
            data,
            expanded: this.options.defaultExpanded,
            depth,
            children: data.children
                ? data.children.map(d => this.dataToTreeNode(d as T, depth + 1))
                : [],
        };
    }


    // --------

    /**
     * Déplace le scroll jusqu'à l'index de la ligne spécifié.
     */
    public scrollTo(index: number): void {
        this.container.scrollTo({
            top: this.tbodyStartY + index * (this.ROW_HEIGHT - 1),
            behavior: 'smooth',
        });
    }

    /**
     * Reset et redéfini les données de la table.
     * Recalcule tout, excepté les colonnes.
     */
    public setData(data: T[]): void {
        this.data = data;
        this.tree = this.data.map(d => this.dataToTreeNode(d, 0));

        this.computeInViewVisibleRows();
        this.resetTableRows();
        this.updateScroll();
    }



    /* --- ADDITIONAL FEATURES --- */

    public allowColumnResizing(allow: boolean): void {
        this.options.allowColumnResize = allow;
    }

    public allowRowSelection(allow: boolean): void {
        this.options.allowRowSelection = allow;
    }

    public allowCellSelection(allow: boolean): void {
        this.options.allowCellSelection = allow;
    }

    public allowCellEditing(allow: boolean): void {
        this.options.allowCellEditing = allow;
    }

    /* --- DRAG & DROP FEATURE --- */

    private lastHighlightedRow: HTMLElement | null = null;

    /**
     * Accepts the drop event on the container.
     * Manages the css classes to update drag over state.
     * Manages to tell which row has received the drop.
     */
    public makeDroppable(): void {
        this.container.setAttribute('dropzone', 'move');

        this.container.addEventListener('dragover', (event) => {
            event.preventDefault();

            event.dataTransfer!.dropEffect = "move";

            const target = event.target as HTMLElement;
            const closestRow = target.closest('.tr') as HTMLElement;
            const isNotHead = !target.closest('.thead');

            if(closestRow && isNotHead && closestRow !== this.lastHighlightedRow) {
                if(this.lastHighlightedRow) {
                    this.lastHighlightedRow.classList.remove('dragging-hover');
                }

                closestRow.classList.add('dragging-hover');
                this.lastHighlightedRow = closestRow;
            }
            else if(!closestRow || !isNotHead) {
                if(this.lastHighlightedRow) {
                    this.lastHighlightedRow.classList.remove('dragging-hover');
                    this.lastHighlightedRow = null;
                }
            }
        }, { capture: true });
        
        this.container.addEventListener('drop', (event) => {
            event.preventDefault();

            const target = event.target as HTMLElement;
            const closestRow = target.closest('.tr');

            console.log(event);
            
            const data = event.dataTransfer?.getData('text/plain');

            this.lastHighlightedRow?.classList.remove('dragging-hover');
            this.lastHighlightedRow = null;

            const row: TableRow<T> = this.rows.find(r => r.$ === closestRow)!;

            this.onDrop(data, row);
        });
    }

    /**
     * Si makeDroppable a été appelé, cette fonction sera appelée
     * en callback de l'évènement drop sur le conteneur de la table.
     */
    public onDrop: (data: string | undefined, row: TableRow<T>) => void = () => {};
}
