/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 * 
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */
const c = class c {
  /**
   * 
   */
  constructor(t, s, e = {}) {
    this.container = t, this.columns = [], this.rows = [], this.data = [], this.tree = [], this.flatten = [], this.nodeMap = /* @__PURE__ */ new Map(), this.VISIBLE_ROWS_COUNT = 0, this.TOTAL_VISIBLE_ROWS = 0, this.TBODY_START_Y = 0, this.selectedNodes = /* @__PURE__ */ new Set(), this.selectedCells = /* @__PURE__ */ new Set(), this.selectedColumns = /* @__PURE__ */ new Set(), this.$lastHighlightedRow = null, this.lastScrollTopIndex = -1, this.onDrop = () => {
    }, this.options = { ...c.DEFAULT_OPTIONS, ...e }, this.ROW_HEIGHT = this.options.rowHeight, this.columns = s, this.$table = document.createElement("div"), this.$table.classList.add("table"), this.$tableHead = document.createElement("div"), this.$tableHead.classList.add("thead"), this.$tableBody = document.createElement("div"), this.$tableBody.classList.add("tbody"), this.$table.append(this.$tableHead, this.$tableBody), this.container.classList.add("virtual-table"), this.container.appendChild(this.$table), this.options.id && (this.$table.id = this.options.id), this.options.stickyHeader && this.$table.classList.add("sticky-header"), this.DOM_createColumns(), this.DOM_computeViewbox(), this.container.addEventListener("scroll", (i) => this.DOM_EVENT_onScroll(i)), this.container.addEventListener("click", (i) => this.DOM_EVENT_onClick(i)), this.$table.style.setProperty("--row-height", this.ROW_HEIGHT + "px");
  }
  getNodes() {
    return this.tree;
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
    for (const s of this.columns) {
      const e = document.createElement("div");
      e.classList.add("th"), e.style.width = s.width + this.columnUnits;
      const i = document.createElement("span");
      i.classList.add("cell-value"), i.textContent = s.title, e.appendChild(i), t.appendChild(e);
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
      const s = this.flatten.length, e = Math.min(s, this.VISIBLE_ROWS_COUNT);
      if (this.rows.length < e)
        for (let i = this.rows.length; i < e; i++)
          this.DOM_createEmptyRow();
      else if (this.rows.length > e)
        for (let i = this.rows.length - 1; i >= e; i--)
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
    this.DOM_resetSelections(), performance.now();
    for (const e of this.flatten)
      e.flatIndex = -1;
    performance.now(), this.flatten = [];
    let t = 0;
    const s = (e) => {
      if (this.flatten.push(e), e.flatIndex = t++, e.expanded)
        for (const i of e.children)
          s(i);
    };
    for (const e of this.tree)
      s(e);
    performance.now(), this.DOM_computeViewbox(), this.DOM_updateViewBoxHeight(), this.DOM_resetTableRows(), this.DOM_updateScroll(!0), performance.now();
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
    const s = parseInt(t.dataset.index || "-1", 10), e = +(this.rows[0].$.dataset.index ?? 0);
    return this.rows[s - e] || null;
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
    this.TOTAL_VISIBLE_ROWS = this.flatten.length;
    const t = this.totalVirtualHeight + this.$tableHead.clientHeight - 1;
    this.$table.style.height = t + "px";
  }
  /**
   * 
   */
  DOM_updateRowsContent() {
    var t;
    for (const s of this.rows) {
      if (!s.ref)
        continue;
      const e = s.ref.children.length > 0;
      s.$.classList.toggle("has-children", e), s.$.classList.toggle("expanded", s.ref.expanded), s.$.classList.toggle("selected", this.selectedNodes.has(this.DOM_getRowIndex(s))), s.$.style.setProperty("--depth", `${s.ref.depth}`);
      for (const i in this.columns) {
        const o = this.columns[i], l = s.$.children.item(+i);
        if (l) {
          const a = o.field ? s.ref.data[o.field] : void 0, n = {
            $: s.$,
            value: a,
            row: s.ref,
            column: o,
            rowIndex: s.y,
            columnIndex: +i
          }, h = ((t = o.transform) == null ? void 0 : t.call(o, n)) || this.formatCellValue(a);
          let r = "";
          if (e && i === "0") {
            const d = s.ref.expanded ? "expanded" : "collapsed";
            r += `<button class="btn-expand"><span class="expand-icon ${d}"></span></button>`;
          }
          r += `<span class="cell-value">${h}</span>`, l.innerHTML = r;
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
    for (const e of this.rows)
      e.$.remove();
    this.rows = [];
    const t = Math.min(this.flatten.length, this.VISIBLE_ROWS_COUNT), s = document.createDocumentFragment();
    for (let e = 0; e < t; e++) {
      const i = this.DOM_createEmptyRow(!1);
      s.appendChild(i.$), this.DOM_setRowPosition(i, { top: e, left: 0 });
    }
    this.$tableBody.appendChild(s), this.rows.length > 0 && (this.mostTopRow = this.rows[0].nextElement);
  }
  /**
   * Créé une <tr> vide et l'ajoute à la fin du <tbody>.
   * Créé les <td> correspondants aux colonnes.
   * 
   * @returns La ligne vide créée.
   */
  DOM_createEmptyRow(t = !0) {
    const s = {
      $: document.createElement("div"),
      x: 0,
      y: 0
    };
    return s.$.classList.add("tr"), s.nextElement = s, s.previousElement = s, this.rows.length > 0 && (s.previousElement = this.rows[this.rows.length - 1], s.previousElement.nextElement = s, s.nextElement = this.rows[0], s.nextElement.previousElement = s), this.rows.push(s), this.DOM_createEmptyCells(s), t && this.$tableBody.appendChild(s.$), s;
  }
  /**
   * Créé les <td> vides correspondant aux colonnes.
   * 
   * @param row La ligne à laquelle ajouter les cellules vides.
   */
  DOM_createEmptyCells(t) {
    const s = document.createDocumentFragment();
    for (const e in this.columns) {
      const i = document.createElement("div");
      i.classList.add("td"), i.style.setProperty("--width", this.columns[e].width + this.columnUnits), s.appendChild(i);
    }
    t.$.appendChild(s);
  }
  DOM_removeRow(t) {
    let s = -1;
    typeof t == "number" ? (s = t, t = this.rows[t]) : s = this.rows.findIndex((e) => e === t), !(!t || s === -1) && (t.$.parentNode && t.$.remove(), this.rows.splice(s, 1), t.previousElement && (t.previousElement.nextElement = t.nextElement), t.nextElement && (t.nextElement.previousElement = t.previousElement));
  }
  /**
   * Met à jour la position de la ligne donnée.
   * Appelé lors d'un scroll.
   * 
   * @param row La ligne à mettre à jour.
   * @param position La nouvelle position de la ligne.
   */
  DOM_setRowPosition(t, s) {
    var i, o, l;
    const e = this.TBODY_START_Y + s.top * (this.ROW_HEIGHT - 1);
    t.y = s.top, t.ref = this.flatten[t.y], t.$.dataset.index = `${t.y}`, t.$.dataset.treeIndex = `${(i = t.ref) == null ? void 0 : i.flatIndex}`, t.$.dataset.id = ((l = (o = t.ref) == null ? void 0 : o.data.id) == null ? void 0 : l.toString()) || "", t.$.style.setProperty("--y", e + "px");
  }
  /**
   * Met à jour la position des lignes visibles.
   * Appelé lors d'un scroll.
   */
  DOM_updateScroll(t) {
    var a;
    if (this.rows.length === 0)
      return;
    const s = ((a = this.mostTopRow) == null ? void 0 : a.y) ?? 0, e = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2), i = this.TBODY_START_Y + s * (this.ROW_HEIGHT - 1), o = i + this.ROW_HEIGHT, l = this.totalVirtualHeight > this.container.clientHeight;
    if (!(this.scrollTop >= i && this.scrollTop <= o) && !(l && e + this.VISIBLE_ROWS_COUNT - 1 >= this.flatten.length) && !(!t && e === this.lastScrollTopIndex)) {
      this.lastScrollTopIndex = e;
      for (let n = 0; n < this.rows.length; n++) {
        const h = this.rows[n];
        this.DOM_setRowPosition(h, { top: e + n, left: h.x });
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
    const s = t.target;
    if (!s.closest(".th")) {
      const e = s.closest(".tr"), i = this.DOM_getRowFromHTMLRow(e);
      i && this.DOM_EVENT_onRowClick(t, i, s);
    }
  }
  /**
   * 
   */
  DOM_EVENT_onRowClick(t, s, e) {
    if (e.closest(".btn-expand")) {
      this.toggleRowExpand(s);
      return;
    }
    if (e.closest(".td")) {
      const i = e.closest(".td");
      this.options.allowCellEditing && this.editCell(s, i), this.options.allowCellSelection, this.options.allowRowSelection && this.selectRow(t, s);
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
    const s = t.ref;
    s.expanded = !s.expanded, t.$.classList.toggle("expanded", s.expanded), s.expanded;
  }
  // ------------------------------------------------------------------------------
  /**
   * Convertit les données d'un nœud en un nœud de l'arbre,
   * utilisable en interne.
   */
  dataToTreeNodeRec(t, s = void 0) {
    const e = {
      data: t,
      expanded: this.options.defaultExpanded,
      depth: s ? s.depth + 1 : 0,
      parent: s,
      flatIndex: -1,
      children: []
    };
    return Array.isArray(t.children) && (e.children = this.computeTree(t.children, e)), e;
  }
  /**
   * 
   */
  computeTree(t, s = void 0) {
    const e = new Array(t.length);
    for (let i = 0; i < t.length; i++) {
      const o = t[i], l = this.dataToTreeNodeRec(o, s);
      e[i] = l, this.nodeMap.set(o.id.toString(), l), i > 0 && e.length > 1 && (l.left = e[i - 1], e[i - 1].right = l);
    }
    return e.length > 1 && (e[0].left = e[e.length - 1], e[e.length - 1].right = e[0]), e;
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
    for (const s of t) {
      const e = this.nodeMap.get(s);
      if (!e)
        continue;
      if (e.left && (e.left.right = e.right), e.right && (e.right.left = e.left), e.parent) {
        const o = e.parent.children.indexOf(e);
        o !== -1 && e.parent.children.splice(o, 1);
      } else {
        const o = this.tree.indexOf(e);
        o !== -1 && this.tree.splice(o, 1);
      }
      const i = [e];
      for (; i.length > 0; ) {
        const o = i.pop();
        this.nodeMap.delete(o.data.id.toString());
        for (const l of o.children)
          i.push(l);
      }
      e.parent = void 0, e.left = void 0, e.right = void 0, e.children.length = 0;
    }
    return this.DOM_computeInViewVisibleRows(), this;
  }
  /**
   * 
   */
  addNode(t, s, e) {
    return this.addNodes(t, s, [e]);
  }
  /**
   * 
   */
  addNodes(t, s, e) {
    if (e.length === 0)
      return this;
    const i = this.nodeMap.get(t);
    if (!i && s)
      return console.warn(`Reference node with ID "${t}" not found.`), this;
    const o = this.verifyDuplicateIds(e);
    if (o.size > 0)
      return console.warn("Duplicate IDs found in the elements to add:", Array.from(o).join(", ")), this;
    const l = s ? i : i == null ? void 0 : i.parent, a = this.computeTree(e, l);
    let n, h = 0;
    if (s)
      Array.isArray(i.children) || (i.children = []), n = i.children, h = n.length, n.push(...a);
    else {
      n = (l == null ? void 0 : l.children) ?? this.tree;
      const d = i ? n.indexOf(i) : -1;
      if (d === -1 && i !== void 0)
        return console.warn(`Reference node with ID "${t}" not found in the parent.`), this;
      h = n.length, n.splice(d + 1, 0, ...a);
    }
    const r = h + a.length;
    return h > 0 && (n[h - 1].right = n[h], n[h].left = n[h - 1], n[r - 1].right = n[0], n[0].left = n[r - 1]), this.DOM_computeInViewVisibleRows(), this;
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
   * Vérifie si les éléments à ajouter ont des IDs dupliqués,
   * entre eux, et avec les IDs déjà présents dans le hashmap.
   * @returns Un Set contenant les IDs dupliqués.
   */
  verifyDuplicateIds(t) {
    const s = /* @__PURE__ */ new Set(), e = (i) => {
      for (const o of i) {
        const l = o.id.toString();
        (this.nodeMap.has(l) || s.has(l)) && s.add(l), Array.isArray(o.children) && e(o.children);
      }
    };
    return e(t), s;
  }
  /**
   * Reset et redéfini les données de la table.
   * Recalcule tout, excepté les colonnes.
   */
  setData(t) {
    this.data = structuredClone(t);
    const s = this.verifyDuplicateIds(this.data);
    if (s.size > 0) {
      console.warn("Duplicate IDs found in the data:", Array.from(s).join(", "));
      return;
    }
    this.recomputeDataTree(), this.DOM_computeInViewVisibleRows();
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
  selectRow(t, s) {
    var i;
    if (!s.ref)
      return console.warn("Cannot select a row without a reference to the data node."), this;
    const e = this.DOM_getRowIndex(s);
    if (t.shiftKey) {
      const o = Array.from(this.selectedNodes).reduce((r, d) => e === -1 ? r : Math.abs(d - e) < Math.abs(r - e) ? d : r, -1);
      if (o === -1)
        return this;
      const l = Math.min(o, e), a = Math.max(o, e), n = this.DOM_getRowIndex(this.rows[0]), h = this.DOM_getRowIndex(this.rows[this.rows.length - 1]);
      for (let r = l; r <= a; r++) {
        const d = this.flatten[r];
        if (this.selectedNodes.add(d.flatIndex), r >= n && r <= h) {
          const f = (i = this.rows[r - n]) == null ? void 0 : i.$;
          f == null || f.classList.add("selected");
        }
      }
      return this;
    }
    return this.selectedNodes.has(e) ? (s.$.classList.remove("selected"), this.selectedNodes.delete(e)) : (s.$.classList.add("selected"), this.selectedNodes.add(e)), this;
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
    const s = this.columns.findIndex((e) => e.title === t.title);
    return s === -1 ? (console.warn(`Column "${t.title}" not found.`), this) : (this.selectedColumns.has(s) ? (this.$tableHead.querySelectorAll(".th.selected").forEach((e) => {
      e.classList.remove("selected");
    }), this.selectedColumns.delete(s)) : (this.$tableHead.querySelectorAll(".th").forEach((e) => {
      e.textContent === t.title && e.classList.add("selected");
    }), this.selectedColumns.add(s)), this);
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
  editCell(t, s) {
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
      const s = t.target, e = s.closest(".tr"), i = !s.closest(".thead");
      e && i && e !== this.$lastHighlightedRow ? (this.$lastHighlightedRow && this.$lastHighlightedRow.classList.remove("dragging-hover"), e.classList.add("dragging-hover"), this.$lastHighlightedRow = e) : (!e || !i) && this.$lastHighlightedRow && (this.$lastHighlightedRow.classList.remove("dragging-hover"), this.$lastHighlightedRow = null);
    }, { capture: !0 }), this.container.addEventListener("drop", (t) => {
      var l, a;
      t.preventDefault();
      const e = t.target.closest(".tr");
      console.log(t);
      const i = (l = t.dataTransfer) == null ? void 0 : l.getData("text/plain");
      (a = this.$lastHighlightedRow) == null || a.classList.remove("dragging-hover"), this.$lastHighlightedRow = null;
      const o = this.rows.find((n) => n.$ === e);
      this.onDrop(i, o);
    }), this;
  }
};
c.DEFAULT_OPTIONS = {
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
let u = c;
export {
  u as VirtualTable
};
//# sourceMappingURL=VirtualTable.js.map
