import { ColumnDef, FlatNode, Position, TableRow, TreeNode, Type, VirtualTableOptions } from './types';

export class VirtualTable<T extends Type> {
    protected static readonly DEFAULT_OPTIONS: VirtualTableOptions = {
        id: '',
        columnSizeInPercentage: false,
        defaultExpanded: true,
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
        this.flatten = [];

        const rec = (node: TreeNode<T>): void => {
            this.flatten.push({ node });

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
            if(!row.node) {
                continue;
            }

            const hasChildren = row.node.children.length > 0;

            row.$.classList.toggle('has-children', hasChildren);
            row.$.style.setProperty('--depth', `${row.node.depth}`);

            for(const i in this.columns) {
                const col = this.columns[i];

                const $cell = row.$.children.item(+i);

                if($cell) {
                    const value = col.field ? row.node.data[col.field] : undefined;
                    const cell = {
                        $: row.$,
                        value,
                        row: row.node,
                        column: col,
                        rowIndex: row.y,
                        columnIndex: +i,
                    };
                    const transformedValue = col.transform?.(cell) || this.formatCellValue(value);

                    let html = '';

                    if(hasChildren && i === '0') {
                        const cls = row.node.expanded ? 'expanded' : 'collapsed';
                        html += `<button class="btn-expand"><span class="expand-icon ${cls}"></span></button>`;
                    }

                    html += `<span class="cell-value">${transformedValue}</span>`;

                    $cell.innerHTML = html;
                }
            }
        }
    }

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
        row.node = this.flatten[row.y].node;
        row.$.dataset.index = `${row.y}`;
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

        if($target.closest('.btn-expand')) {
            this.toggleRowExpand($closestRow);
        }

    }



    /**
     * Gère l'événement de clic sur une ligne.
     * Développe ou réduit la ligne si elle a des enfants.
     * 
     * @param row La ligne sur laquelle on a cliqué.
     * @param expandBtn Le bouton d'expansion/réduction.
     */
    private toggleRowExpand($row: HTMLElement): void {
        const row = this.rows.find(r => r.$ === $row)!;
        const node = row.node!;

        node.expanded = !node.expanded;

        $row.classList.toggle('expanded', node.expanded);

        // recompute the flattened list just in that area
        // remove all the recursive children of the node
        // and either add or remove these to or from the flattened list
        const startIndex = this.flatten.findIndex(f => f.node === node);
        
        if(node.expanded) {
            const children = node.children.map(c => this.dataToTreeNode(c.data, node.depth + 1));
            this.flatten.splice(startIndex + 1, 0, ...children.map(c => ({ node: c })));

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

    public allowColumnResizing(): void {
        // TODO
    }

    public disallowColumnResizing(): void {
        // TODO
    }

    public allowSelection(): void {
        // TODO
    }

    public disallowSelection(): void {
        // TODO
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
