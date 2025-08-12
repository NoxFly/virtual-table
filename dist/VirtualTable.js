/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 * 
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */
const d = class d {
  /**
   * 
   */
  constructor(t, e, s = {}) {
    this.container = t, this.columns = [], this.rows = [], this.data = [], this.tree = [], this.flatten = [], this.nodeMap = /* @__PURE__ */ new Map(), this.VISIBLE_ROWS_COUNT = 0, this.TOTAL_VISIBLE_ROWS = 0, this.TBODY_START_Y = 0, this.selectedNodes = /* @__PURE__ */ new Set(), this.selectedCells = /* @__PURE__ */ new Set(), this.selectedColumns = /* @__PURE__ */ new Set(), this.$lastHighlightedRow = null, this.onDrop = () => {
    }, this.options = { ...d.DEFAULT_OPTIONS, ...s }, this.ROW_HEIGHT = this.options.rowHeight, this.columns = e, this.$table = document.createElement("div"), this.$table.classList.add("table"), this.$tableHead = document.createElement("div"), this.$tableHead.classList.add("thead"), this.$tableBody = document.createElement("div"), this.$tableBody.classList.add("tbody"), this.$table.append(this.$tableHead, this.$tableBody), this.container.classList.add("virtual-table"), this.container.appendChild(this.$table), this.options.id && (this.$table.id = this.options.id), this.options.stickyHeader && this.$table.classList.add("sticky-header"), this.DOM_createColumns(), this.DOM_computeViewbox(), this.container.addEventListener("scroll", (i) => this.DOM_EVENT_onScroll(i)), this.container.addEventListener("click", (i) => this.DOM_EVENT_onClick(i)), this.$table.style.setProperty("--row-height", this.ROW_HEIGHT + "px");
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
    const t = document.createElement("div");
    t.classList.add("tr");
    for (const e of this.columns) {
      const s = document.createElement("div");
      s.classList.add("th"), s.style.width = e.width + this.columnUnits;
      const i = document.createElement("span");
      i.classList.add("cell-value"), i.textContent = e.title, s.appendChild(i), t.appendChild(s);
    }
    this.$tableHead.appendChild(t);
  }
  /**
   * Sert à recalculer le nombre de lignes visibles dans le conteneur.
   * Utilisé à l'initialisation et lors d'un redimensionnement du conteneur.
   * Ajoute ou enlève les lignes nécessaires.
   * Ensuite, appelle computeInViewVisibleRows.
   */
  DOM_computeViewbox() {
    const t = this.container.clientHeight;
    if (this.VISIBLE_ROWS_COUNT = Math.ceil(t / this.ROW_HEIGHT) + 4, this.flatten.length > 0) {
      const e = this.flatten.length, s = Math.min(e, this.VISIBLE_ROWS_COUNT);
      if (this.rows.length < s)
        for (let i = this.rows.length; i < s; i++)
          this.DOM_createEmptyRow();
      else if (this.rows.length > s)
        for (let i = this.rows.length - 1; i >= s; i--)
          this.DOM_removeRow(this.rows[i]);
    }
    this.TBODY_START_Y = this.$tableHead.clientHeight - 1;
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
  DOM_computeInViewVisibleRows() {
    this.DOM_resetSelections();
    const t = performance.now();
    for (const n of this.flatten)
      n.treeIndex = -1;
    const e = performance.now();
    this.flatten = [];
    let s = 0;
    const i = (n) => {
      if (this.flatten.push(n), n.treeIndex = s++, n.expanded)
        for (const h of n.children)
          i(h);
    };
    for (const n of this.tree)
      i(n);
    const l = performance.now();
    this.DOM_computeViewbox(), this.DOM_updateViewBoxHeight(), this.DOM_resetTableRows(), this.DOM_updateScroll();
    const o = performance.now();
    console.table([
      { step: "reset tree indexes", time: e - t },
      { step: "flatten tree", time: l - e },
      { step: "compute viewbox", time: o - l },
      { step: "total", time: o - t }
    ]);
  }
  /**
   * 
   */
  DOM_resetSelections() {
    this.unselectAllCells(), this.unselectAllRows(), this.unselectAllColumns();
  }
  /**
   * Retourne le nœud de l'arbre de la vue correspondant à l'élément `<tr>` donné.
   * en O(1)
   */
  DOM_getRowFromHTMLRow(t) {
    if (t == null || this.rows.length === 0)
      return null;
    const e = parseInt(t.dataset.index || "-1", 10), s = +(this.rows[0].$.dataset.index ?? 0);
    return this.rows[e - s] || null;
  }
  /**
   * 
   */
  DOM_getRowIndex(t) {
    return +(t.$.dataset.index ?? "-1");
  }
  /**
   * Appelé APRES avoir mis à jour this.flatten
   */
  DOM_updateViewBoxHeight() {
    this.TOTAL_VISIBLE_ROWS = this.flatten.length, console.debug("Total visible rows: ", this.TOTAL_VISIBLE_ROWS);
    const t = this.totalVirtualHeight + this.$tableHead.clientHeight - 1;
    this.$table.style.height = t + "px";
  }
  /**
   * 
   */
  DOM_updateRowsContent() {
    var t;
    for (const e of this.rows) {
      if (!e.ref)
        continue;
      const s = e.ref.children.length > 0;
      e.$.classList.toggle("has-children", s), e.$.classList.toggle("expanded", e.ref.expanded), e.$.classList.toggle("selected", this.selectedNodes.has(this.DOM_getRowIndex(e))), e.$.style.setProperty("--depth", `${e.ref.depth}`);
      for (const i in this.columns) {
        const l = this.columns[i], o = e.$.children.item(+i);
        if (o) {
          const n = l.field ? e.ref.data[l.field] : void 0, h = {
            $: e.$,
            value: n,
            row: e.ref,
            column: l,
            rowIndex: e.y,
            columnIndex: +i
          }, c = ((t = l.transform) == null ? void 0 : t.call(l, h)) || this.formatCellValue(n);
          let r = "";
          if (s && i === "0") {
            const a = e.ref.expanded ? "expanded" : "collapsed";
            r += `<button class="btn-expand"><span class="expand-icon ${a}"></span></button>`;
          }
          r += `<span class="cell-value">${c}</span>`, o.innerHTML = r;
        }
      }
    }
  }
  /**
   * 
   */
  formatCellValue(t) {
    return (t == null ? void 0 : t.toString()) || "";
  }
  /**
   * Réinitialise les lignes du tableau.
   * Supprime toutes les lignes existantes,
   * puis en recrée un nombre fixe
   * défini par VISIBLE_ROWS_COUNT.
   */
  DOM_resetTableRows() {
    for (const s of this.rows)
      s.$.remove();
    this.rows = [];
    const t = Math.min(this.flatten.length, this.VISIBLE_ROWS_COUNT), e = document.createDocumentFragment();
    for (let s = 0; s < t; s++) {
      const i = this.DOM_createEmptyRow(!1);
      e.appendChild(i.$), this.DOM_setRowPosition(i, { top: s, left: 0 });
    }
    this.$tableBody.appendChild(e), this.rows.length > 0 && (this.mostTopRow = this.rows[0].nextElement);
  }
  /**
   * Créé une <tr> vide et l'ajoute à la fin du <tbody>.
   * Créé les <td> correspondants aux colonnes.
   * 
   * @returns La ligne vide créée.
   */
  DOM_createEmptyRow(t = !0) {
    const e = {
      $: document.createElement("div"),
      x: 0,
      y: 0
    };
    return e.$.classList.add("tr"), e.nextElement = e, e.previousElement = e, this.rows.length > 0 && (e.previousElement = this.rows[this.rows.length - 1], e.previousElement.nextElement = e, e.nextElement = this.rows[0], e.nextElement.previousElement = e), this.rows.push(e), this.DOM_createEmptyCells(e), t && this.$tableBody.appendChild(e.$), e;
  }
  /**
   * Créé les <td> vides correspondant aux colonnes.
   * 
   * @param row La ligne à laquelle ajouter les cellules vides.
   */
  DOM_createEmptyCells(t) {
    const e = document.createDocumentFragment();
    for (const s in this.columns) {
      const i = document.createElement("div");
      i.classList.add("td"), i.style.setProperty("--width", this.columns[s].width + this.columnUnits), e.appendChild(i);
    }
    t.$.appendChild(e);
  }
  DOM_removeRow(t) {
    let e = -1;
    typeof t == "number" ? (e = t, t = this.rows[t]) : e = this.rows.findIndex((s) => s === t), !(!t || e === -1) && (t.$.parentNode && t.$.remove(), this.rows.splice(e, 1), t.previousElement && (t.previousElement.nextElement = t.nextElement), t.nextElement && (t.nextElement.previousElement = t.previousElement));
  }
  /**
   * Met à jour la position de la ligne donnée.
   * Appelé lors d'un scroll.
   * 
   * @param row La ligne à mettre à jour.
   * @param position La nouvelle position de la ligne.
   */
  DOM_setRowPosition(t, e) {
    var i, l, o;
    const s = this.TBODY_START_Y + e.top * (this.ROW_HEIGHT - 1);
    t.y = e.top, t.ref = this.flatten[t.y], t.$.dataset.index = `${t.y}`, t.$.dataset.treeIndex = `${(i = t.ref) == null ? void 0 : i.treeIndex}`, t.$.dataset.id = ((o = (l = t.ref) == null ? void 0 : l.data.id) == null ? void 0 : o.toString()) || "", t.$.style.setProperty("--y", s + "px");
  }
  /**
   * Met à jour la position des lignes visibles.
   * Appelé lors d'un scroll.
   */
  DOM_updateScroll() {
    var l;
    if (this.rows.length === 0)
      return;
    const t = ((l = this.mostTopRow) == null ? void 0 : l.y) ?? 0, e = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2), s = this.TBODY_START_Y + t * (this.ROW_HEIGHT - 1), i = s + this.ROW_HEIGHT;
    if (!(this.scrollTop >= s && this.scrollTop <= i) && !(e + this.VISIBLE_ROWS_COUNT - 1 >= this.flatten.length)) {
      for (let o = 0; o < this.rows.length; o++) {
        const n = this.rows[o];
        this.DOM_setRowPosition(n, { top: e + o, left: n.x });
      }
      this.DOM_updateRowsContent();
    }
  }
  /**
   * Gère l'événement de scroll du conteneur.
   * Met à jour les positions des lignes visibles.
   */
  DOM_EVENT_onScroll(t) {
    this.DOM_updateScroll();
  }
  /**
   * 
   */
  DOM_EVENT_onClick(t) {
    !t.shiftKey && !t.ctrlKey && this.DOM_resetSelections(), this.cancelCellEdition();
    const e = t.target;
    if (!e.closest(".th")) {
      const s = e.closest(".tr"), i = this.DOM_getRowFromHTMLRow(s);
      i && this.DOM_EVENT_onRowClick(t, i, e);
    }
  }
  /**
   * 
   */
  DOM_EVENT_onRowClick(t, e, s) {
    if (s.closest(".btn-expand")) {
      this.toggleRowExpand(e);
      return;
    }
    if (s.closest(".td")) {
      const i = s.closest(".td");
      this.options.allowCellEditing && this.editCell(e, i), this.options.allowCellSelection, this.options.allowRowSelection && this.selectRow(t, e);
    }
  }
  /**
   * Gère l'événement de clic sur une ligne.
   * Développe ou réduit la ligne si elle a des enfants.
   * 
   * @param row La ligne sur laquelle on a cliqué.
   * @param expandBtn Le bouton d'expansion/réduction.
   */
  toggleRowExpand(t) {
    if (!t.ref) {
      console.warn("Cannot toggle expand on a row without a reference to the data node.");
      return;
    }
    const e = t.ref;
    e.expanded = !e.expanded, t.$.classList.toggle("expanded", e.expanded), e.expanded;
  }
  // ------------------------------------------------------------------------------
  /**
   * Convertit les données d'un nœud en un nœud de l'arbre,
   * utilisable en interne.
   */
  dataToTreeNodeRec(t, e = void 0) {
    const s = {
      data: t,
      expanded: this.options.defaultExpanded,
      depth: e ? e.depth + 1 : 0,
      parent: e,
      treeIndex: -1,
      children: []
    };
    return Array.isArray(t.children) && (s.children = this.computeTree(t.children, s)), s;
  }
  /**
   * 
   */
  computeTree(t, e = void 0) {
    const s = new Array(t.length);
    for (let i = 0; i < t.length; i++) {
      const l = t[i], o = this.dataToTreeNodeRec(l, e);
      s[i] = o, this.nodeMap.set(l.id.toString(), o), i > 0 && s.length > 1 && (o.left = s[i - 1], s[i - 1].right = o);
    }
    return s.length > 1 && (s[0].left = s[s.length - 1], s[s.length - 1].right = s[0]), s;
  }
  /**
   * 
   */
  recomputeDataTree() {
    this.tree = this.computeTree(this.data), console.debug("Recomputed data tree:", this.tree);
  }
  // ----------------------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------------------------------
  // CRUD
  /**
   * 
   */
  deleteNode(t) {
    return this.deleteNodes([t]);
  }
  /**
   * 
   */
  deleteNodes(t) {
    return this;
  }
  /**
   * 
   */
  addNode(t, e, s) {
    return this.addNodes(t, e, [s]);
  }
  /**
   * 
   */
  addNodes(t, e, s) {
    return this;
  }
  /**
   * 
   */
  updateNode(t) {
    return this.updateNodes([t]);
  }
  /**
   * 
   */
  updateNodes(t) {
    return this;
  }
  /**
   * Reset et redéfini les données de la table.
   * Recalcule tout, excepté les colonnes.
   */
  setData(t) {
    this.data = structuredClone(t), this.recomputeDataTree(), this.DOM_computeInViewVisibleRows();
  }
  // ---- scroll ----
  /**
   * Déplace le scroll jusqu'à l'index de la ligne spécifié.
   */
  scrollTo(t) {
    return this.container.scrollTo({
      top: this.TBODY_START_Y + t * (this.ROW_HEIGHT - 1),
      behavior: "smooth"
    }), this;
  }
  // ---- selection ----
  /**
   * 
   */
  selectRow(t, e) {
    var i;
    if (!e.ref)
      return console.warn("Cannot select a row without a reference to the data node."), this;
    const s = this.DOM_getRowIndex(e);
    if (t.shiftKey) {
      const l = Array.from(this.selectedNodes).reduce((r, a) => s === -1 ? r : Math.abs(a - s) < Math.abs(r - s) ? a : r, -1);
      if (l === -1)
        return this;
      const o = Math.min(l, s), n = Math.max(l, s), h = this.DOM_getRowIndex(this.rows[0]), c = this.DOM_getRowIndex(this.rows[this.rows.length - 1]);
      for (let r = o; r <= n; r++) {
        const a = this.flatten[r];
        if (this.selectedNodes.add(a.treeIndex), r >= h && r <= c) {
          const u = (i = this.rows[r - h]) == null ? void 0 : i.$;
          u == null || u.classList.add("selected");
        }
      }
      return this;
    }
    return this.selectedNodes.has(s) ? (e.$.classList.remove("selected"), this.selectedNodes.delete(s)) : (e.$.classList.add("selected"), this.selectedNodes.add(s)), this;
  }
  /**
   * 
   */
  selectAllRows() {
    this.$tableBody.querySelectorAll(".tr").forEach((t) => {
      t.classList.add("selected");
    }), this.selectedNodes.clear();
    for (let t = 0; t < this.rows.length; t++)
      this.selectedNodes.add(t);
    return this;
  }
  /**
   * 
   */
  unselectAllRows() {
    return this.$tableBody.querySelectorAll(".tr.selected").forEach((t) => {
      t.classList.remove("selected");
    }), this.selectedNodes.clear(), this;
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
    return this.$tableBody.querySelectorAll(".td.selected").forEach((t) => {
      t.classList.remove("selected");
    }), this.selectedCells.clear(), this;
  }
  /**
   * 
   */
  selectColumn(t) {
    const e = this.columns.findIndex((s) => s.title === t.title);
    return e === -1 ? (console.warn(`Column "${t.title}" not found.`), this) : (this.selectedColumns.has(e) ? (this.$tableHead.querySelectorAll(".th.selected").forEach((s) => {
      s.classList.remove("selected");
    }), this.selectedColumns.delete(e)) : (this.$tableHead.querySelectorAll(".th").forEach((s) => {
      s.textContent === t.title && s.classList.add("selected");
    }), this.selectedColumns.add(e)), this);
  }
  /**
   * 
   */
  unselectAllColumns() {
    return this.$tableHead.querySelectorAll(".th.selected").forEach((t) => {
      t.classList.remove("selected");
    }), this.selectedColumns.clear(), this;
  }
  /**
   * 
   */
  editCell(t, e) {
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
  allowColumnResizing(t) {
    return this.options.allowColumnResize = t, this;
  }
  /**
   * 
   */
  allowRowSelection(t) {
    return this.options.allowRowSelection = t, this;
  }
  /**
   * 
   */
  allowCellSelection(t) {
    return this.options.allowCellSelection = t, this;
  }
  /**
   * 
   */
  allowCellEditing(t) {
    return this.options.allowCellEditing = t, this;
  }
  // ---- drag & drop ----
  /**
   * Accepte l'événement de drop sur le conteneur.
   * Gère les classes CSS pour mettre à jour l'état de survol lors du drag.
   * Permet d'identifier quelle ligne a reçu le drop.
   */
  makeDroppable() {
    return this.container.setAttribute("dropzone", "move"), this.container.addEventListener("dragover", (t) => {
      t.preventDefault(), t.dataTransfer.dropEffect = "move";
      const e = t.target, s = e.closest(".tr"), i = !e.closest(".thead");
      s && i && s !== this.$lastHighlightedRow ? (this.$lastHighlightedRow && this.$lastHighlightedRow.classList.remove("dragging-hover"), s.classList.add("dragging-hover"), this.$lastHighlightedRow = s) : (!s || !i) && this.$lastHighlightedRow && (this.$lastHighlightedRow.classList.remove("dragging-hover"), this.$lastHighlightedRow = null);
    }, { capture: !0 }), this.container.addEventListener("drop", (t) => {
      var o, n;
      t.preventDefault();
      const s = t.target.closest(".tr");
      console.log(t);
      const i = (o = t.dataTransfer) == null ? void 0 : o.getData("text/plain");
      (n = this.$lastHighlightedRow) == null || n.classList.remove("dragging-hover"), this.$lastHighlightedRow = null;
      const l = this.rows.find((h) => h.$ === s);
      this.onDrop(i, l);
    }), this;
  }
};
d.DEFAULT_OPTIONS = {
  id: "",
  rowHeight: 30,
  columnSizeInPercentage: !1,
  defaultExpanded: !0,
  // --
  stickyHeader: !1,
  // -- allowed actions
  allowColumnSelection: !1,
  allowRowSelection: !1,
  allowCellSelection: !1,
  allowCellEditing: !1,
  allowColumnResize: !1,
  allowColumnReorder: !1,
  allowRowReorder: !1
};
let p = d;
export {
  p as VirtualTable
};
//# sourceMappingURL=VirtualTable.js.map
