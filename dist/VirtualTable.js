/**
 * @copyright 2025 NoxFly
 * @license MIT
 * @author NoxFly
 */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  EventManager: () => EventManager,
  VirtualTable: () => VirtualTable
});
module.exports = __toCommonJS(src_exports);

// src/EventManager.ts
var _EventManager = class _EventManager {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Ajoute un écouteur en liant `this` une seule fois.
   * Retourne le symbol à utiliser pour le remove.
   */
  listenTo(target, type, callback, options) {
    const symbolId = Symbol.for(callback.name);
    const boundCallback = callback.bind(this);
    this.listeners.set(symbolId, boundCallback);
    target.addEventListener(type, boundCallback, options);
    return symbolId;
  }
  /**
   * Supprime un écouteur à partir de son symbol.
   */
  stopListenTo(target, type, symbolId, options) {
    if (typeof symbolId === "function") {
      symbolId = Symbol.for(symbolId.name);
    }
    const listener = this.listeners.get(symbolId);
    if (listener) {
      target.removeEventListener(type, listener, options);
      this.listeners.delete(symbolId);
    }
  }
  /**
   * Supprime tous les écouteurs gérés par cette instance.
   */
  removeAllListeners(target, type) {
    for (const [symbolId, listener] of this.listeners) {
      if (type) {
        target.removeEventListener(type, listener);
      } else {
        console.warn("Impossible de removeAll sans type stock\xE9, il faut \xE9tendre la structure.");
      }
    }
    this.listeners.clear();
  }
};
__name(_EventManager, "EventManager");
var EventManager = _EventManager;

// src/VirtualTable.ts
var _VirtualTable = class _VirtualTable {
  /**
   *
   */
  constructor(container, columnsDef, options = {}) {
    this.container = container;
    this.columns = [];
    /** Les lignes de la vue, leur position et la référence vers leur données à afficher */
    this.rows = [];
    /** Un arbre multi-root de noeuds ayant des données fournies par `setData` */
    this.tree = [];
    /** Une liste plate des données filtrées provenant d'un arbre, préservant l'ordre des éléments */
    this.flatten = [];
    /** Un hashmap sur les nodes de l'arbre afin d'accéder à n'importe quel noeud en O(1) à partir de son ID */
    this.nodeMap = /* @__PURE__ */ new Map();
    this.VISIBLE_ROWS_COUNT = 0;
    this.TOTAL_VISIBLE_ROWS = 0;
    this.TBODY_START_Y = 0;
    /** Indexes des noeuds sélectionnés dans `this.flatten` */
    this.selectedNodes = /* @__PURE__ */ new Set();
    /** Indexes des cellules sélectionnées et de leur node dans `this.flatten` */
    this.selectedCells = /* @__PURE__ */ new Set();
    /** Indexes des colonnes sélectionnées dans `this.columns` */
    this.selectedColumns = /* @__PURE__ */ new Set();
    this.$lastHighlightedRow = null;
    this.$columns = [];
    this.lastScrollTopIndex = -1;
    /**
     * Si makeDroppable a été appelé, cette fonction sera appelée
     * en callback de l'évènement drop sur le conteneur de la table.
     */
    this.onDrop = /* @__PURE__ */ __name(() => {
    }, "onDrop");
    /**
     *
     */
    this.onCellClicked = /* @__PURE__ */ __name(() => {
    }, "onCellClicked");
    /**
     *
     */
    this.onRowClicked = /* @__PURE__ */ __name(() => {
    }, "onRowClicked");
    /**
     *
     */
    this.onColumnClicked = /* @__PURE__ */ __name(() => {
    }, "onColumnClicked");
    /**
     *
     */
    this.onCellRightClicked = /* @__PURE__ */ __name(() => {
    }, "onCellRightClicked");
    /**
     *
     */
    this.onRowRightClicked = /* @__PURE__ */ __name(() => {
    }, "onRowRightClicked");
    /**
     *
     */
    this.onColumnRightClicked = /* @__PURE__ */ __name(() => {
    }, "onColumnRightClicked");
    /**
     *
     */
    this.onEmptySpaceRightClicked = /* @__PURE__ */ __name(() => {
    }, "onEmptySpaceRightClicked");
    /**
     *
     */
    this.onCellEdited = /* @__PURE__ */ __name(() => {
    }, "onCellEdited");
    this.options = { ..._VirtualTable.DEFAULT_OPTIONS, ...options };
    this.ROW_HEIGHT = this.options.rowHeight;
    this.columns = columnsDef.map((col) => ({
      ...col,
      id: crypto.randomUUID(),
      type: col.type || "string"
    }));
    this.$table = document.createElement("div");
    this.$table.classList.add("table");
    this.$tableHead = document.createElement("div");
    this.$tableHead.classList.add("thead");
    this.$tableBody = document.createElement("div");
    this.$tableBody.classList.add("tbody");
    this.$table.append(this.$tableHead, this.$tableBody);
    this.container.classList.add("virtual-table");
    this.container.appendChild(this.$table);
    if (this.options.id) {
      this.$table.id = this.options.id;
    }
    if (this.options.stickyHeader) {
      this.$table.classList.add("sticky-header");
    }
    this.DOM_createColumns();
    this.DOM_computeViewbox();
    this.container.addEventListener("scroll", (e) => this.DOM_EVENT_onScroll(e), { passive: true });
    this.container.addEventListener("click", (e) => this.DOM_EVENT_onClick(e), { passive: true });
    this.container.addEventListener("contextmenu", (e) => this.DOM_EVENT_onContextMenu(e));
    this.$table.style.setProperty("--row-height", this.ROW_HEIGHT + "px");
  }
  // ------------------------------------------------------------------------------
  // Table DOM manager
  /**
   * Retourne la position actuelle du scroll dans le conteneur.
   */
  get scrollTop() {
    return this.container.scrollTop;
  }
  /**
   *
   */
  get totalVirtualHeight() {
    return this.$tableHead.clientHeight + (this.TOTAL_VISIBLE_ROWS - 1) * (this.ROW_HEIGHT - 1);
  }
  /**
   *
   */
  get columnUnits() {
    return this.options.columnSizeInPercentage ? "%" : "px";
  }
  /**
   * Définit le colonnes de la table et le formattage des cellules
   * des données appartenant à ces colonnes.
   */
  DOM_createColumns() {
    const $tr = document.createElement("div");
    $tr.classList.add("tr");
    for (const columnDef of this.columns) {
      if (columnDef.hidden) {
        return;
      }
      const $th = document.createElement("div");
      $th.dataset.type = columnDef.type;
      $th.dataset.id = columnDef.id;
      $th.classList.add("th", ...columnDef.cssClasses || []);
      $th.style.width = columnDef.width + this.columnUnits;
      if (columnDef.field) {
        $th.classList.add(columnDef.field.toString());
      }
      const $span = document.createElement("span");
      $span.classList.add("cell-value");
      $span.innerHTML = columnDef.title;
      $th.appendChild($span);
      $tr.appendChild($th);
      this.$columns.push($th);
    }
    this.$tableHead.innerHTML = "";
    this.$tableHead.appendChild($tr);
  }
  /**
   * Sert à recalculer le nombre de lignes visibles dans le conteneur.
   * Utilisé à l'initialisation et lors d'un redimensionnement du conteneur.
   * Ajoute ou enlève les lignes nécessaires.
   * Ensuite, appelle computeInViewVisibleRows.
   */
  DOM_computeViewbox() {
    const CONTAINER_HEIGHT = this.container.clientHeight;
    this.VISIBLE_ROWS_COUNT = Math.ceil(CONTAINER_HEIGHT / this.ROW_HEIGHT) + 4;
    if (this.flatten.length > 0) {
      const rowsCount = this.flatten.length;
      const max = Math.min(rowsCount, this.VISIBLE_ROWS_COUNT);
      if (this.rows.length < max) {
        for (let i = this.rows.length; i < max; i++) {
          this.DOM_createEmptyRow();
        }
      } else if (this.rows.length > max) {
        for (let i = this.rows.length - 1; i >= max; i--) {
          this.DOM_removeRow(this.rows[i]);
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
  DOM_computeInViewVisibleRows() {
    this.DOM_resetSelections();
    for (const row of this.flatten) {
      row.flatIndex = -1;
    }
    this.flatten.length = 0;
    let i = 0;
    const rec = /* @__PURE__ */ __name((node) => {
      this.flatten.push(node);
      node.flatIndex = i++;
      if (node.expanded) {
        for (const child of node.children) {
          rec(child);
        }
      }
    }, "rec");
    for (const node of this.tree) {
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
  DOM_resetSelections() {
    this.unselectAllCells();
    this.unselectAllRows();
    this.unselectAllColumns();
  }
  /**
   * Retourne le nœud de l'arbre de la vue correspondant à l'élément `<tr>` donné.
   * en O(1)
   */
  getRowFromHTMLRow($row) {
    if ($row === null || $row === void 0 || this.rows.length === 0) {
      return null;
    }
    const index = parseInt($row.dataset.index || "-1", 10);
    const firstIndex = +(this.rows[0].$.dataset.index ?? 0);
    return this.rows[index - firstIndex] || null;
  }
  /**
   *
   */
  DOM_getRowIndex(row) {
    return +(row.$.dataset.index ?? "-1");
  }
  /**
   * Appelé APRES avoir mis à jour this.flatten
   */
  DOM_updateViewBoxHeight() {
    this.TOTAL_VISIBLE_ROWS = this.flatten.length;
    const totalHeight = this.totalVirtualHeight + this.$tableHead.clientHeight - 1;
    this.$table.style.height = totalHeight + "px";
  }
  /**
   *
   */
  DOM_updateRowsContent() {
    for (const row of this.rows) {
      this.DOM_updateRowContent(row);
    }
  }
  /**
   *
   */
  DOM_updateRowContent(row) {
    if (!row.ref) {
      return;
    }
    const hasChildren = row.ref.children.length > 0;
    let rowClasses = "tr ";
    if (this.rowCssClassesCallback !== void 0) {
      rowClasses += this.rowCssClassesCallback(row);
    }
    row.$.className = rowClasses;
    row.$.classList.toggle("has-children", hasChildren);
    row.$.classList.toggle("expanded", row.ref.expanded);
    row.$.classList.toggle("selected", this.selectedNodes.has(this.DOM_getRowIndex(row)));
    row.$.style.setProperty("--depth", `${row.ref.depth}`);
    const visibleColumns = this.columns.filter((c) => !c.hidden);
    for (const i in visibleColumns) {
      const col = visibleColumns[i];
      if (col.hidden) {
        continue;
      }
      const cell = row.cells[+i];
      const $cell = cell.$;
      if (!$cell)
        continue;
      const hasField = col.field !== void 0;
      const value = hasField ? row.ref.data[col.field] : void 0;
      const showRequired = this.options.allowCellEditing === true && col.readonly !== true && col.required === true && (value === void 0 || value === null || (col.type === "string" && value === "" || col.type === "number" && value === 0 && this.options.treatZeroAsEmpty === true));
      const realValue = value === 0 && this.options.treatZeroAsEmpty === true ? void 0 : value;
      cell.value = realValue;
      cell.node = row.ref;
      cell.column = col;
      cell.rowIndex = row.y;
      cell.columnIndex = +i;
      let transformedValue;
      if (col.transform !== void 0) {
        const v = col.transform?.(cell);
        if (v === void 0 || v === null) {
          transformedValue = "";
        } else if (v instanceof HTMLElement) {
          transformedValue = v.outerHTML;
        } else {
          transformedValue = v;
        }
      } else {
        transformedValue = this.formatCellValue(value);
      }
      let html = "";
      if (hasChildren && $cell.classList.contains("expand") && this.options.allowExpandCollapse) {
        const cls = row.ref.expanded ? "expanded" : "collapsed";
        html += `<button class="btn-expand"><span class="expand-icon ${cls}"></span></button>`;
      }
      html += `<div class="cell-value">${transformedValue}</div>`;
      $cell.innerHTML = html;
      $cell.classList.toggle("validator-required", showRequired);
    }
  }
  /**
   *
   */
  DOM_getTableRowFromNode(node) {
    if (node.flatIndex < 0 || node.flatIndex >= this.flatten.length) {
      return void 0;
    }
    return this.rows.find((r) => r.ref?.data.id === node.data.id);
  }
  /**
   *
   */
  formatCellValue(value) {
    return value?.toString() || "";
  }
  /**
   * Réinitialise les lignes du tableau.
   * Supprime toutes les lignes existantes,
   * puis en recrée un nombre fixe
   * défini par VISIBLE_ROWS_COUNT.
   */
  DOM_resetTableRows() {
    for (const row of this.rows) {
      row.$.remove();
    }
    this.rows.length = 0;
    const max = Math.min(this.flatten.length, this.VISIBLE_ROWS_COUNT);
    const $fragment = document.createDocumentFragment();
    for (let i = 0; i < max; i++) {
      const row = this.DOM_createEmptyRow(false);
      $fragment.appendChild(row.$);
      this.DOM_setRowPosition(row, { top: i, left: 0 });
    }
    this.$tableBody.appendChild($fragment);
    if (this.rows.length > 0) {
      this.mostTopRow = this.rows[0];
    }
  }
  /**
   * Créé une <tr> vide et l'ajoute à la fin du <tbody>.
   * Créé les <td> correspondants aux colonnes.
   *
   * @returns La ligne vide créée.
   */
  DOM_createEmptyRow(shouldAddDirectly = true) {
    const row = {
      $: document.createElement("div"),
      x: 0,
      y: 0,
      cells: []
    };
    row.$.classList.add("tr");
    row.nextElement = row;
    row.previousElement = row;
    if (this.rows.length > 0) {
      row.previousElement = this.rows[this.rows.length - 1];
      row.previousElement.nextElement = row;
      row.nextElement = this.rows[0];
      row.nextElement.previousElement = row;
    }
    this.rows.push(row);
    this.DOM_createEmptyCells(row);
    if (shouldAddDirectly) {
      this.$tableBody.appendChild(row.$);
    }
    return row;
  }
  /**
   * Créé les <td> vides correspondant aux colonnes.
   *
   * @param row La ligne à laquelle ajouter les cellules vides.
   */
  DOM_createEmptyCells(row) {
    const $fragment = document.createDocumentFragment();
    for (const columnDef of this.columns) {
      if (columnDef.hidden) {
        continue;
      }
      const $td = document.createElement("div");
      $td.classList.add("td", ...columnDef.cssClasses || []);
      if (columnDef.field) {
        $td.classList.add("field", `field-${columnDef.field.toString()}`);
      }
      $td.style.setProperty("--width", columnDef.width + this.columnUnits);
      $td.dataset.type = columnDef.type;
      $fragment.appendChild($td);
      const cell = {
        $: $td,
        value: "",
        row,
        node: row.ref,
        column: columnDef,
        rowIndex: row.y,
        columnIndex: this.columns.indexOf(columnDef)
      };
      row.cells.push(cell);
    }
    row.$.appendChild($fragment);
  }
  DOM_removeRow(row) {
    let rowIndex = -1;
    if (typeof row === "number") {
      rowIndex = row;
      row = this.rows[row];
    } else {
      rowIndex = this.rows.findIndex((r) => r === row);
    }
    if (!row || rowIndex === -1)
      return;
    if (row.$.parentNode) {
      row.$.remove();
    }
    this.rows.splice(rowIndex, 1);
    if (row.previousElement) {
      row.previousElement.nextElement = row.nextElement;
    }
    if (row.nextElement) {
      row.nextElement.previousElement = row.previousElement;
    }
  }
  /**
   * Supprime la cellule à l'index donné de chaque ligne.
   * L'élément HTML de l'entête de la colonne est également enlevé
   */
  DOM_removeCell(columnIndex) {
    if (columnIndex < 0 || columnIndex >= this.columns.length || this.columns[columnIndex].hidden) {
      return;
    }
    this.columns[columnIndex].hidden = true;
    this.$columns[columnIndex].remove();
    const hiddenCount = this.columns.slice(0, columnIndex).filter((c) => c.hidden).length;
    const cellIndex = columnIndex - hiddenCount;
    for (const row of this.rows) {
      const $cell = row.$.children.item(cellIndex);
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
  DOM_setRowPosition(row, position) {
    const top = this.TBODY_START_Y + position.top * (this.ROW_HEIGHT - 1);
    row.y = position.top;
    row.ref = this.flatten[row.y];
    row.$.dataset.index = `${row.y}`;
    row.$.dataset.treeIndex = `${row.ref?.flatIndex}`;
    row.$.dataset.id = row.ref?.data.id?.toString() || "";
    row.$.style.setProperty("--y", top + "px");
  }
  /**
   * Met à jour la position des lignes visibles.
   * Appelé lors d'un scroll.
   */
  DOM_updateScroll(force) {
    if (this.rows.length === 0) {
      return;
    }
    const y = this.mostTopRow?.y ?? 0;
    const topMin = this.TBODY_START_Y + y * (this.ROW_HEIGHT - 1);
    const topMax = topMin + this.ROW_HEIGHT;
    if (this.scrollTop >= topMin && this.scrollTop <= topMax) {
      return;
    }
    let scrollTopIndex = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2);
    const maxScrollableIndex = Math.max(0, this.flatten.length - this.rows.length);
    if (scrollTopIndex > maxScrollableIndex) {
      scrollTopIndex = maxScrollableIndex;
    }
    if (!force && scrollTopIndex === this.lastScrollTopIndex) {
      return;
    }
    this.lastScrollTopIndex = scrollTopIndex;
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      this.DOM_setRowPosition(row, { top: scrollTopIndex + i, left: row.x });
    }
    this.DOM_updateRowsContent();
    this.mostTopRow = this.rows[0];
  }
  /**
   * Gère l'événement de scroll du conteneur.
   * Met à jour les positions des lignes visibles.
   */
  DOM_EVENT_onScroll(e) {
    this.DOM_updateScroll();
    this.container.querySelectorAll(".td.editing").forEach(($cell) => {
      $cell.classList.remove("editing");
    });
  }
  /**
   *
   */
  DOM_EVENT_onClick(e) {
    if (!e.shiftKey && !e.ctrlKey) {
      this.DOM_resetSelections();
    }
    this.cancelCellEdition();
    const $target = e.target;
    if ($target.closest(".th")) {
      const target = $target.closest(".th");
      const targetIndex = this.$columns.indexOf(target);
      const column = this.columns[targetIndex];
      if (column) {
        this.onColumnClicked(column, e, target);
      }
    } else {
      const $closestRow = $target.closest(".tr");
      const closestRow = this.getRowFromHTMLRow($closestRow);
      if (closestRow) {
        this.DOM_EVENT_onRowClick(e, closestRow, $target);
      }
    }
  }
  /**
   *
   */
  DOM_EVENT_onContextMenu(e) {
    const $target = e.target;
    if ($target.closest(".th")) {
      const target = $target.closest(".th");
      const targetIndex = this.$columns.indexOf(target);
      const column = this.columns[targetIndex];
      if (column) {
        this.onColumnRightClicked(column, e, target);
      }
    } else if ($target.closest(".tr")) {
      const $closestRow = $target.closest(".tr");
      const closestRow = this.getRowFromHTMLRow($closestRow);
      if (closestRow) {
        const $cell = $target.closest(".td");
        if ($cell) {
          const cellIndex = Array.from(closestRow.$.children).indexOf($cell);
          const cell = closestRow.cells[cellIndex];
          this.onCellRightClicked(cell, e);
        }
        this.onRowRightClicked(closestRow, e);
      }
    } else {
      this.onEmptySpaceRightClicked(e);
    }
  }
  /**
   *
   */
  DOM_EVENT_onRowClick(e, row, $target) {
    if ($target.closest(".btn-expand")) {
      this.toggleRowExpand(row);
      return;
    }
    const $cell = $target.closest(".td");
    if ($cell) {
      const cellIndex = Array.from(row.$.children).indexOf($cell);
      const cell = row.cells[cellIndex];
      if (this.options.allowCellEditing) {
        this.editCell(cell);
      }
      if (this.options.allowCellSelection) {
      }
      if (this.options.allowRowSelection) {
        this.selectRow(e, row);
      }
      this.onCellClicked(cell, e);
    }
    this.onRowClicked(row, e);
  }
  /**
   * Gère l'événement de clic sur une ligne.
   * Développe ou réduit la ligne si elle a des enfants.
   *
   * @param row La ligne sur laquelle on a cliqué.
   * @param expandBtn Le bouton d'expansion/réduction.
   */
  toggleRowExpand(row) {
    if (!this.options.allowExpandCollapse) {
      return;
    }
    if (!row.ref) {
      console.warn("Cannot toggle expand on a row without a reference to the data node.");
      return;
    }
    const node = row.ref;
    node.expanded = !node.expanded;
    row.$.classList.toggle("expanded", node.expanded);
    this.DOM_computeInViewVisibleRows();
  }
  // ------------------------------------------------------------------------------
  /**
   * Convertit les données d'un nœud en un nœud de l'arbre,
   * utilisable en interne.
   */
  dataToTreeNodeRec(data, parent = void 0) {
    const node = {
      data,
      expanded: this.options.defaultExpanded,
      depth: parent ? parent.depth + 1 : 0,
      parent,
      flatIndex: -1,
      children: []
    };
    if (Array.isArray(data.children)) {
      node.children = this.computeTree(data.children, node);
    }
    return node;
  }
  /**
   *
   */
  computeTree(data, parent = void 0) {
    const root = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const node = this.dataToTreeNodeRec(d, parent);
      root[i] = node;
      this.nodeMap.set(d.id.toString(), node);
      if (i > 0 && root.length > 1) {
        node.left = root[i - 1];
        root[i - 1].right = node;
      }
    }
    if (root.length > 1) {
      root[0].left = root[root.length - 1];
      root[root.length - 1].right = root[0];
    }
    return root;
  }
  /**
   *
   */
  recomputeDataTree(data) {
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
  deleteNode(nodeId) {
    return this.deleteNodes([nodeId]);
  }
  /**
   *
   */
  deleteNodes(nodeIds) {
    if (nodeIds.length === 0) {
      return this;
    }
    for (const id of nodeIds) {
      const node = this.nodeMap.get(id);
      if (!node) {
        continue;
      }
      if (node.left)
        node.left.right = node.right;
      if (node.right)
        node.right.left = node.left;
      if (node.parent) {
        const idx = node.parent.children.indexOf(node);
        if (idx !== -1) {
          node.parent.children.splice(idx, 1);
        }
      } else {
        const idx = this.tree.indexOf(node);
        if (idx !== -1) {
          this.tree.splice(idx, 1);
        }
      }
      const stack = [node];
      while (stack.length > 0) {
        const currentNode = stack.pop();
        this.nodeMap.delete(currentNode.data.id.toString());
        for (const child of currentNode.children) {
          stack.push(child);
        }
      }
      node.parent = void 0;
      node.left = void 0;
      node.right = void 0;
      node.children.length = 0;
    }
    this.DOM_computeInViewVisibleRows();
    return this;
  }
  /**
   *
   */
  addNode(relativeTo, asChildren, element) {
    return this.addNodes(relativeTo, asChildren, [element]);
  }
  /**
   *
   */
  addNodes(relativeTo, asChildren, elements) {
    if (elements.length === 0) {
      return this;
    }
    const referenceNode = this.nodeMap.get(relativeTo);
    if (!referenceNode && asChildren) {
      console.warn(`Reference node with ID "${relativeTo}" not found.`);
      return this;
    }
    const duplicateIds = this.verifyDuplicateIds(elements);
    if (duplicateIds.size > 0) {
      console.warn("Duplicate IDs found in the elements to add:", Array.from(duplicateIds).join(", "));
      return this;
    }
    const parentNode = asChildren ? referenceNode : referenceNode?.parent;
    const newNodes = this.computeTree(elements, parentNode);
    let nodes;
    let childCount = 0;
    if (asChildren) {
      if (!Array.isArray(referenceNode.children)) {
        referenceNode.children = [];
      }
      nodes = referenceNode.children;
      childCount = nodes.length;
      nodes.push(...newNodes);
    } else {
      nodes = parentNode?.children ?? this.tree;
      const index = referenceNode ? nodes.indexOf(referenceNode) : -1;
      if (index === -1 && referenceNode !== void 0) {
        console.warn(`Reference node with ID "${relativeTo}" not found in the parent.`);
        return this;
      }
      childCount = nodes.length;
      nodes.splice(index + 1, 0, ...newNodes);
    }
    const newChildCount = childCount + newNodes.length;
    if (childCount > 0) {
      nodes[childCount - 1].right = nodes[childCount];
      nodes[childCount].left = nodes[childCount - 1];
      nodes[newChildCount - 1].right = nodes[0];
      nodes[0].left = nodes[newChildCount - 1];
    }
    this.DOM_computeInViewVisibleRows();
    return this;
  }
  /**
   *
   */
  updateNode(node) {
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
  updateNodes(nodes) {
    if (nodes.length === 0) {
      return this;
    }
    for (const nodeData of nodes) {
      const existingNode = this.nodeMap.get(nodeData.id.toString());
      if (!existingNode) {
        console.warn(`Node with ID "${nodeData.id}" not found.`);
        continue;
      }
      existingNode.data = { ...existingNode.data, ...nodeData };
      const tableRow = this.DOM_getTableRowFromNode(existingNode);
      if (tableRow) {
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
  verifyDuplicateIds(elements) {
    const duplicateIds = /* @__PURE__ */ new Set();
    const recursiveCheck = /* @__PURE__ */ __name((elements2) => {
      for (const element of elements2) {
        const id = element.id.toString();
        if (this.nodeMap.has(id) || duplicateIds.has(id)) {
          duplicateIds.add(id);
        }
        if (Array.isArray(element.children)) {
          recursiveCheck(element.children);
        }
      }
    }, "recursiveCheck");
    recursiveCheck(elements);
    return duplicateIds;
  }
  /**
   * Reset et redéfini les données de la table.
   * Recalcule tout, excepté les colonnes.
   */
  setData(data) {
    data = structuredClone(data);
    const dups = this.verifyDuplicateIds(data);
    if (dups.size > 0) {
      console.warn("Duplicate IDs found in the data:", Array.from(dups).join(", "));
      return;
    }
    this.recomputeDataTree(data);
    this.DOM_computeInViewVisibleRows();
  }
  /**
   *
   */
  clear() {
    this.tree.length = 0;
    this.flatten.length = 0;
    this.rows.length = 0;
    this.nodeMap.clear();
    this.$tableBody.innerHTML = "";
    this.DOM_computeInViewVisibleRows();
  }
  /**
   *
   */
  getNodes() {
    return this.tree;
  }
  // ---- scroll ----
  /**
   * Déplace le scroll jusqu'à l'index de la ligne spécifié.
   */
  scrollTo(index) {
    this.container.scrollTo({
      top: this.TBODY_START_Y + index * (this.ROW_HEIGHT - 1),
      behavior: "smooth"
    });
    return this;
  }
  // ---- selection ----
  /**
   *
   */
  selectRow(event, row) {
    if (!row.ref) {
      console.warn("Cannot select a row without a reference to the data node.");
      return this;
    }
    const rowIndex = this.DOM_getRowIndex(row);
    if (event.shiftKey) {
      const nearestSelectedIndex = Array.from(this.selectedNodes).reduce((nearest, current) => {
        if (rowIndex === -1) {
          return nearest;
        }
        return Math.abs(current - rowIndex) < Math.abs(nearest - rowIndex) ? current : nearest;
      }, -1);
      if (nearestSelectedIndex === -1) {
        return this;
      }
      const from = Math.min(nearestSelectedIndex, rowIndex);
      const to = Math.max(nearestSelectedIndex, rowIndex);
      const firstElIndex = this.DOM_getRowIndex(this.rows[0]);
      const lastElIndex = this.DOM_getRowIndex(this.rows[this.rows.length - 1]);
      for (let i = from; i <= to; i++) {
        const rowToSelect = this.flatten[i];
        this.selectedNodes.add(rowToSelect.flatIndex);
        if (i >= firstElIndex && i <= lastElIndex) {
          const $row = this.rows[i - firstElIndex]?.$;
          $row?.classList.add("selected");
        }
      }
      return this;
    }
    if (this.selectedNodes.has(rowIndex)) {
      row.$.classList.remove("selected");
      this.selectedNodes.delete(rowIndex);
    } else {
      row.$.classList.add("selected");
      this.selectedNodes.add(rowIndex);
    }
    return this;
  }
  /**
   *
   */
  selectAllRows() {
    this.$tableBody.querySelectorAll(".tr").forEach(($row) => {
      $row.classList.add("selected");
    });
    this.selectedNodes.clear();
    for (let i = 0; i < this.rows.length; i++) {
      this.selectedNodes.add(i);
    }
    return this;
  }
  /**
   *
   */
  unselectAllRows() {
    this.$tableBody.querySelectorAll(".tr.selected").forEach(($row) => {
      $row.classList.remove("selected");
    });
    this.selectedNodes.clear();
    return this;
  }
  /**
   *
   */
  selectCell() {
    return this;
  }
  /**
   *
   */
  unselectAllCells() {
    this.$tableBody.querySelectorAll(".td.selected").forEach(($cell) => {
      $cell.classList.remove("selected");
    });
    this.selectedCells.clear();
    return this;
  }
  /**
   *
   */
  selectColumn(column) {
    const columnIndex = this.columns.findIndex((c) => c.title === column.title);
    if (columnIndex === -1) {
      console.warn(`Column "${column.title}" not found.`);
      return this;
    }
    if (this.selectedColumns.has(columnIndex)) {
      this.$tableHead.querySelectorAll(".th.selected").forEach(($th) => {
        $th.classList.remove("selected");
      });
      this.selectedColumns.delete(columnIndex);
    } else {
      this.$tableHead.querySelectorAll(".th").forEach(($th) => {
        if ($th.textContent === column.title) {
          $th.classList.add("selected");
        }
      });
      this.selectedColumns.add(columnIndex);
    }
    return this;
  }
  /**
   *
   */
  unselectAllColumns() {
    this.$tableHead.querySelectorAll(".th.selected").forEach(($th) => {
      $th.classList.remove("selected");
    });
    this.selectedColumns.clear();
    return this;
  }
  /**
   *
   */
  editCell(cell) {
    if (!this.options.allowCellEditing || cell.column.readonly || cell.$.classList.contains("editing")) {
      return this;
    }
    let $input;
    const value = cell.node.data[cell.column.field];
    if (cell.column.type === "string" || cell.column.type === "number") {
      $input = document.createElement("input");
      $input.type = "text";
      $input.value = value?.toString().trim() || "";
      if (cell.column.type === "number") {
        $input.oninput = () => {
          $input.value = $input.value.replace(/[^0-9.-]/g, "");
        };
      }
    } else if (cell.column.type === "boolean") {
      $input = document.createElement("input");
      $input.type = "checkbox";
      $input.checked = !!value;
    } else if (cell.column.type === "date") {
      $input = document.createElement("input");
      $input.type = "date";
      $input.value = value && (value instanceof Date || typeof value === "string" || typeof value === "number") ? new Date(value).toISOString().split("T")[0] : "";
    } else if (cell.column.type === "enum" && cell.column.enumValues !== void 0) {
      $input = document.createElement("select");
      for (const option of cell.column.enumValues) {
        const $option = document.createElement("option");
        $option.value = option.toString();
        $option.textContent = option.toString();
        if (option.toString() === value?.toString()) {
          $option.selected = true;
        }
        $input.appendChild($option);
      }
    } else {
      console.warn(`Unsupported column type: ${cell.column.type}`);
      return this;
    }
    if (cell.column.type !== "enum" && cell.column.editTransformedValue === true && cell.column.transform !== void 0) {
      const transformedValue = cell.column.transform(cell);
      if (!(transformedValue instanceof HTMLElement)) {
        $input.value = transformedValue?.toString().trim() || "";
      }
    }
    $input.classList.add("cell-editor");
    cell.$.classList.add("editing");
    const cancelEdition = /* @__PURE__ */ __name(() => {
      if ($input instanceof HTMLInputElement) {
        $input.removeEventListener("keydown", keydownHandler);
      } else {
        $input.removeEventListener("change", confirmEdition);
      }
      $input.removeEventListener("blur", confirmEdition);
      try {
        cell.$?.classList.remove("editing");
        $input?.remove();
      } catch (e) {
      }
    }, "cancelEdition");
    const confirmEdition = /* @__PURE__ */ __name(() => {
      cancelEdition();
      const newValue = $input instanceof HTMLInputElement ? $input.value.trim() : $input.value;
      if (newValue === value?.toString().trim())
        return;
      let castedValue = newValue;
      switch (cell.column.type) {
        case "number":
          castedValue = parseFloat(newValue);
          if (isNaN(castedValue)) {
            castedValue = null;
          }
          break;
        case "boolean":
          castedValue = $input.checked;
          break;
        case "date":
          castedValue = new Date(newValue);
          if (isNaN(castedValue.getTime())) {
            castedValue = null;
          }
          break;
      }
      this.onCellEdited(cell, castedValue);
    }, "confirmEdition");
    const navigateToPreviousOrNextCell = /* @__PURE__ */ __name((vec) => {
      confirmEdition();
      const currentCellIndex = cell.row.cells.indexOf(cell);
      let nextCellIndex = currentCellIndex + vec;
      while (nextCellIndex >= 0 && nextCellIndex < cell.row.cells.length) {
        const nextCell = cell.row.cells[nextCellIndex];
        const colType = nextCell.column.type;
        const isReadonly = nextCell.column.readonly === true;
        if (colType === "html" || isReadonly) {
          nextCellIndex += vec;
          continue;
        }
        this.editCell(nextCell);
        break;
      }
    }, "navigateToPreviousOrNextCell");
    const navigateToPreviousOrNextRow = /* @__PURE__ */ __name((vec) => {
      confirmEdition();
      const rowIndex = this.DOM_getRowIndex(cell.row);
      const nextRowIndex = rowIndex + vec;
      if (nextRowIndex >= 0 && nextRowIndex < this.rows.length) {
        const nextRow = this.rows[nextRowIndex];
        const nextCell = nextRow.cells[cell.columnIndex];
        this.editCell(nextCell);
      }
    }, "navigateToPreviousOrNextRow");
    const keydownHandler = /* @__PURE__ */ __name((event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        confirmEdition();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelEdition();
      } else if (event.key === "Tab") {
        event.preventDefault();
        navigateToPreviousOrNextCell(event.shiftKey ? -1 : 1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        navigateToPreviousOrNextCell(event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        navigateToPreviousOrNextRow(event.key === "ArrowUp" ? -1 : 1);
      }
    }, "keydownHandler");
    if ($input instanceof HTMLInputElement) {
      $input.addEventListener("keydown", keydownHandler);
    } else if ($input instanceof HTMLSelectElement) {
      $input.addEventListener("change", confirmEdition, { once: true, passive: true });
    }
    $input.addEventListener("blur", confirmEdition, { once: true, passive: true });
    const $cell = cell.$;
    $cell.appendChild($input);
    $input.focus();
    if ($input instanceof HTMLInputElement && (cell.column.type === "string" || cell.column.type === "number")) {
      $input.select();
    }
    return this;
  }
  /**
   *
   */
  cancelCellEdition() {
    return this;
  }
  // ---- resizing ----
  /**
   *
   */
  allowColumnResizing(allow) {
    this.options.allowColumnResize = allow;
    return this;
  }
  /**
   *
   */
  allowRowSelection(allow) {
    this.options.allowRowSelection = allow;
    return this;
  }
  /**
   *
   */
  allowCellSelection(allow) {
    this.options.allowCellSelection = allow;
    return this;
  }
  /**
   *
   */
  allowCellEditing(allow) {
    this.options.allowCellEditing = allow;
    return this;
  }
  hideColumn(columnIndexOrId) {
    let columnIndex;
    if (typeof columnIndexOrId === "number") {
      columnIndex = columnIndexOrId;
    } else {
      columnIndex = this.columns.findIndex((c) => c.id === columnIndexOrId);
    }
    if (columnIndex < 0 || columnIndex >= this.columns.length) {
      console.warn(`Column index ${columnIndex} is out of bounds.`);
      return this;
    }
    const column = this.columns[columnIndex];
    if (column.hidden) {
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
  makeDroppable() {
    this.container.setAttribute("dropzone", "move");
    this.container.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const target = event.target;
      const closestRow = target.closest(".tr");
      const isNotHead = !target.closest(".thead");
      if (closestRow && isNotHead && closestRow !== this.$lastHighlightedRow) {
        if (this.$lastHighlightedRow) {
          this.$lastHighlightedRow.classList.remove("dragging-hover");
        }
        closestRow.classList.add("dragging-hover");
        this.$lastHighlightedRow = closestRow;
      } else if (!closestRow || !isNotHead) {
        if (this.$lastHighlightedRow) {
          this.$lastHighlightedRow.classList.remove("dragging-hover");
          this.$lastHighlightedRow = null;
        }
      }
    }, { capture: true });
    this.container.addEventListener("drop", (event) => {
      event.preventDefault();
      const target = event.target;
      const closestRow = target.closest(".tr");
      const data = event.dataTransfer?.getData("text/plain");
      this.$lastHighlightedRow?.classList.remove("dragging-hover");
      this.$lastHighlightedRow = null;
      const row = this.rows.find((r) => r.$ === closestRow);
      this.onDrop(data, row);
    });
    return this;
  }
};
__name(_VirtualTable, "VirtualTable");
_VirtualTable.DEFAULT_OPTIONS = {
  id: "",
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
  allowRowReorder: false
};
var VirtualTable = _VirtualTable;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EventManager,
  VirtualTable
});
/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 * 
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */
/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 *
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */
//# sourceMappingURL=virtualTable.js.map