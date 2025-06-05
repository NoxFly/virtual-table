const f = class f {
  constructor(t, e, s = {}) {
    this.container = t, this.columns = [], this.rows = [], this.data = [], this.tree = [], this.flatten = [], this.VISIBLE_ROWS_COUNT = 0, this.TOTAL_VISIBLE_ROWS = 0, this.tbodyStartY = 0, this.selectedNodes = /* @__PURE__ */ new Set(), this.selectedCells = /* @__PURE__ */ new Set(), this.selectedColumns = /* @__PURE__ */ new Set(), this.lastHighlightedRow = null, this.onDrop = () => {
    }, this.options = { ...f.DEFAULT_OPTIONS, ...s }, this.ROW_HEIGHT = this.options.rowHeight, this.columns = e, this.table = document.createElement("div"), this.table.classList.add("table"), this.tableHead = document.createElement("div"), this.tableHead.classList.add("thead"), this.tableBody = document.createElement("div"), this.tableBody.classList.add("tbody"), this.table.append(this.tableHead, this.tableBody), this.container.classList.add("virtual-table"), this.container.appendChild(this.table), this.options.id && (this.table.id = this.options.id), this.options.stickyHeader && this.table.classList.add("sticky-header"), this.createColumns(), this.computeViewbox(), this.container.addEventListener("scroll", (i) => this.onScroll(i)), this.container.addEventListener("click", (i) => this.onClick(i)), this.table.style.setProperty("--row-height", this.ROW_HEIGHT + "px");
  }
  /**
   * Retourne la position actuelle du scroll dans le conteneur.
   */
  get scrollTop() {
    return this.container.scrollTop;
  }
  get totalVirtualHeight() {
    return this.tableHead.clientHeight + (this.TOTAL_VISIBLE_ROWS - 1) * (this.ROW_HEIGHT - 1);
  }
  get columnUnits() {
    return this.options.columnSizeInPercentage ? "%" : "px";
  }
  /**
   * Définit le colonnes de la table et le formattage des cellules
   * des données appartenant à ces colonnes.
   */
  createColumns() {
    const t = document.createElement("div");
    t.classList.add("tr");
    for (const e of this.columns) {
      const s = document.createElement("div");
      s.classList.add("th"), s.style.width = e.width + this.columnUnits, s.textContent = e.title, t.appendChild(s);
    }
    this.tableHead.appendChild(t);
  }
  /**
   * Sert à recalculer le nombre de lignes visibles dans le conteneur.
   * Utilisé à l'initialisation et lors d'un redimensionnement du conteneur.
   * Ajoute ou enlève les lignes nécessaires.
   * Ensuite, appelle computeInViewVisibleRows.
   */
  computeViewbox() {
    const t = this.container.clientHeight;
    if (this.VISIBLE_ROWS_COUNT = Math.ceil(t / this.ROW_HEIGHT) + 4, this.flatten.length > 0) {
      const e = this.flatten.length, s = Math.min(e, this.VISIBLE_ROWS_COUNT);
      if (this.rows.length < s)
        for (let i = this.rows.length; i < s; i++)
          this.createEmptyRow();
      else if (this.rows.length > s)
        for (let i = this.rows.length - 1; i >= s; i--)
          this.removeRow(this.rows[i]);
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
  computeInViewVisibleRows() {
    this.flatten = [], this.resetSelections();
    let t = -1;
    const e = (s) => {
      if (t++, this.flatten.push({ node: s, index: t }), s.expanded)
        for (const i of s.children)
          e(i);
    };
    for (const s of this.tree)
      e(s);
    this.computeViewbox(), this.updateViewBoxHeight();
  }
  resetSelections() {
    this.unselectAllCells(), this.unselectAllRows(), this.unselectAllColumns();
  }
  /**
   * Retourne le nœud de l'arbre correspondant à la ligne donnée.
   * en O(1)
   */
  getNodeFromRow(t) {
    if (t == null || this.rows.length === 0)
      return null;
    const e = parseInt(t.dataset.index || "-1", 10), s = +(this.rows[0].$.dataset.index ?? 0);
    return this.rows[e - s] || null;
  }
  /**
   * Appelé APRES avoir mis à jour this.flatten
   */
  updateViewBoxHeight() {
    this.TOTAL_VISIBLE_ROWS = this.flatten.length, console.info("Total visible rows: ", this.TOTAL_VISIBLE_ROWS);
    const t = this.totalVirtualHeight + this.tableHead.clientHeight - 1;
    this.table.style.height = t + "px";
  }
  updateRowsContent() {
    var t;
    for (const e of this.rows) {
      if (!e.ref)
        continue;
      const s = e.ref.node.children.length > 0;
      e.$.classList.toggle("has-children", s), e.$.classList.toggle("expanded", e.ref.node.expanded), e.$.classList.toggle("selected", this.selectedNodes.has(e.ref.index)), e.$.style.setProperty("--depth", `${e.ref.node.depth}`);
      for (const i in this.columns) {
        const l = this.columns[i], o = e.$.children.item(+i);
        if (o) {
          const a = l.field ? e.ref.node.data[l.field] : void 0, d = {
            $: e.$,
            value: a,
            row: e.ref.node,
            column: l,
            rowIndex: e.y,
            columnIndex: +i
          }, h = ((t = l.transform) == null ? void 0 : t.call(l, d)) || this.formatCellValue(a);
          let c = "";
          if (s && i === "0") {
            const p = e.ref.node.expanded ? "expanded" : "collapsed";
            c += `<button class="btn-expand"><span class="expand-icon ${p}"></span></button>`;
          }
          c += `<span class="cell-value">${h}</span>`, o.innerHTML = c;
        }
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatCellValue(t) {
    return (t == null ? void 0 : t.toString()) || "";
  }
  // ------------------------------------------------------------------------------
  // Table DOM manager
  /**
   * Créé une <tr> vide et l'ajoute à la fin du <tbody>.
   * Créé les <td> correspondants aux colonnes.
   * 
   * @returns La ligne vide créée.
   */
  createEmptyRow(t = !0) {
    const e = {
      $: document.createElement("div"),
      x: 0,
      y: 0
    };
    return e.$.classList.add("tr"), e.nextElement = e, e.previousElement = e, this.rows.length > 0 && (e.previousElement = this.rows[this.rows.length - 1], e.previousElement.nextElement = e, e.nextElement = this.rows[0], e.nextElement.previousElement = e), this.rows.push(e), this.createEmptyCells(e), t && this.tableBody.appendChild(e.$), e;
  }
  /**
   * Créé les <td> vides correspondant aux colonnes.
   * 
   * @param row La ligne à laquelle ajouter les cellules vides.
   */
  createEmptyCells(t) {
    const e = document.createDocumentFragment();
    for (const s in this.columns) {
      const i = document.createElement("div");
      i.classList.add("td"), i.style.setProperty("--width", this.columns[s].width + this.columnUnits), e.appendChild(i);
    }
    t.$.appendChild(e);
  }
  /**
   * Supprime la ligne donnée du <tbody> et de la liste des lignes.
   * 
   * @param row La ligne à supprimer.
   */
  removeRow(t) {
    t.$.parentNode && t.$.remove();
    const e = this.rows.findIndex((s) => s === t);
    e !== -1 && (this.rows.splice(e, 1), t.previousElement && (t.previousElement.nextElement = t.nextElement), t.nextElement && (t.nextElement.previousElement = t.previousElement));
  }
  /**
   * Met à jour la position de la ligne donnée.
   * Appelé lors d'un scroll.
   * 
   * @param row La ligne à mettre à jour.
   * @param position La nouvelle position de la ligne.
   */
  setRowPosition(t, e) {
    var i;
    const s = this.tbodyStartY + e.top * (this.ROW_HEIGHT - 1);
    t.y = e.top, t.ref = this.flatten[t.y], t.$.dataset.index = `${t.y}`, t.$.dataset.id = ((i = t.ref.node.data.id) == null ? void 0 : i.toString()) || "", t.$.style.setProperty("--y", s + "px");
  }
  /**
   * Met à jour la position des lignes visibles.
   * Appelé lors d'un scroll.
   */
  updateScroll() {
    if (this.rows.length === 0)
      return;
    const t = this.tbodyStartY + this.mostTopRow.y * (this.ROW_HEIGHT - 1), e = t + this.ROW_HEIGHT;
    if (this.scrollTop >= t && this.scrollTop <= e)
      return;
    const s = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2);
    if (!(s + this.VISIBLE_ROWS_COUNT - 1 >= this.flatten.length)) {
      for (let i = 0; i < this.rows.length; i++) {
        const l = this.rows[i];
        this.setRowPosition(l, { top: s + i, left: l.x });
      }
      this.updateRowsContent();
    }
  }
  /**
   * Gère l'événement de scroll du conteneur.
   * Met à jour les positions des lignes visibles.
   */
  onScroll(t) {
    this.updateScroll();
  }
  onClick(t) {
    const e = t.target, s = e.closest(".tr"), i = this.getNodeFromRow(s);
    console.log(i, e), this.cancelCellEdition(), !t.shiftKey && !t.ctrlKey && this.resetSelections(), i && this.onRowClick(t, i, e);
  }
  onRowClick(t, e, s) {
    if (s.closest(".btn-expand")) {
      this.toggleRowExpand(e);
      return;
    }
    if (s.closest(".td")) {
      const i = s.closest(".td");
      this.options.allowCellEditing && this.editCell(e, i), this.options.allowCellSelection;
    }
    this.options.allowRowSelection && this.selectRow(t, e);
  }
  selectRow(t, e) {
    var s, i, l, o, a;
    if (!e.ref) {
      console.warn("Cannot select a row without a reference to the data node.");
      return;
    }
    if (t.shiftKey) {
      const d = e.ref, h = Array.from(this.selectedNodes).reduce((n, r) => Math.abs(r - d.index) < Math.abs(n - d.index) ? r : n, -1);
      if (h === -1) {
        console.warn("No nearest selected index found.");
        return;
      }
      const c = Math.min(h, d.index), p = Math.max(h, d.index), m = ((i = (s = this.rows[0]) == null ? void 0 : s.ref) == null ? void 0 : i.index) || -1, g = ((o = (l = this.rows[this.rows.length - 1]) == null ? void 0 : l.ref) == null ? void 0 : o.index) || -1;
      for (let n = c; n <= p; n++) {
        const r = this.flatten[n];
        if (this.selectedNodes.add(r.index), n >= m && n <= g) {
          const u = (a = this.rows[n - m]) == null ? void 0 : a.$;
          u == null || u.classList.add("selected");
        }
      }
      return;
    }
    this.selectedNodes.has(e.ref.index) ? (e.$.classList.remove("selected"), this.selectedNodes.delete(e.ref.index)) : (e.$.classList.add("selected"), this.selectedNodes.add(e.ref.index));
  }
  selectAllRows() {
    this.tableBody.querySelectorAll(".tr").forEach((t) => {
      t.classList.add("selected");
    }), this.selectedNodes.clear();
    for (let t = 0; t < this.rows.length; t++)
      this.selectedNodes.add(t);
  }
  unselectAllRows() {
    this.tableBody.querySelectorAll(".tr.selected").forEach((t) => {
      t.classList.remove("selected");
    }), this.selectedNodes.clear();
  }
  selectCell() {
  }
  unselectAllCells() {
    this.tableBody.querySelectorAll(".td.selected").forEach((t) => {
      t.classList.remove("selected");
    }), this.selectedCells.clear();
  }
  selectColumn(t) {
    const e = this.columns.findIndex((s) => s.title === t.title);
    if (e === -1) {
      console.warn(`Column "${t.title}" not found.`);
      return;
    }
    this.selectedColumns.has(e) ? (this.tableHead.querySelectorAll(".th.selected").forEach((s) => {
      s.classList.remove("selected");
    }), this.selectedColumns.delete(e)) : (this.tableHead.querySelectorAll(".th").forEach((s) => {
      s.textContent === t.title && s.classList.add("selected");
    }), this.selectedColumns.add(e));
  }
  unselectAllColumns() {
    this.tableHead.querySelectorAll(".th.selected").forEach((t) => {
      t.classList.remove("selected");
    }), this.selectedColumns.clear();
  }
  editCell(t, e) {
  }
  cancelCellEdition() {
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
    const e = t.ref.node;
    e.expanded = !e.expanded, t.$.classList.toggle("expanded", e.expanded);
    const s = t.ref.index;
    if (e.expanded) {
      const i = e.children.map((l, o) => ({
        node: this.dataToTreeNode(l.data, e.depth + 1),
        index: s + 1 + o
      }));
      this.flatten.splice(s + 1, 0, ...i);
      for (let l = s + 1; l < s + 1 + i.length; l++)
        this.createEmptyRow(!1);
    } else {
      const i = e.children.length;
      this.flatten.splice(s + 1, i);
      for (let l = 0; l < i; l++)
        this.removeRow(this.rows[s + 1]);
    }
    this.updateViewBoxHeight(), this.updateScroll(), this.updateRowsContent();
  }
  /**
   * Réinitialise les lignes du tableau.
   * Supprime toutes les lignes existantes,
   * puis en recrée un nombre fixe
   * défini par VISIBLE_ROWS_COUNT.
   */
  resetTableRows() {
    for (const s of this.rows)
      s.$.remove();
    this.rows = [];
    const t = Math.min(this.flatten.length, this.VISIBLE_ROWS_COUNT), e = document.createDocumentFragment();
    for (let s = 0; s < t; s++) {
      const i = this.createEmptyRow(!1);
      e.appendChild(i.$), this.setRowPosition(i, { top: s, left: 0 });
    }
    this.tableBody.appendChild(e), this.rows.length > 0 && (this.mostTopRow = this.rows[0].nextElement);
  }
  /**
   * Convertit les données d'un nœud en un nœud de l'arbre,
   * utilisable en interne.
   */
  dataToTreeNode(t, e) {
    return {
      data: t,
      expanded: this.options.defaultExpanded,
      depth: e,
      children: t.children ? t.children.map((s) => this.dataToTreeNode(s, e + 1)) : []
    };
  }
  // --------
  /**
   * Déplace le scroll jusqu'à l'index de la ligne spécifié.
   */
  scrollTo(t) {
    this.container.scrollTo({
      top: this.tbodyStartY + t * (this.ROW_HEIGHT - 1),
      behavior: "smooth"
    });
  }
  /**
   * Reset et redéfini les données de la table.
   * Recalcule tout, excepté les colonnes.
   */
  setData(t) {
    this.data = t, this.tree = this.data.map((e) => this.dataToTreeNode(e, 0)), this.computeInViewVisibleRows(), this.resetTableRows(), this.updateScroll();
  }
  /* --- ADDITIONAL FEATURES --- */
  allowColumnResizing(t) {
    this.options.allowColumnResize = t;
  }
  allowRowSelection(t) {
    this.options.allowRowSelection = t;
  }
  allowCellSelection(t) {
    this.options.allowCellSelection = t;
  }
  allowCellEditing(t) {
    this.options.allowCellEditing = t;
  }
  /**
   * Accepts the drop event on the container.
   * Manages the css classes to update drag over state.
   * Manages to tell which row has received the drop.
   */
  makeDroppable() {
    this.container.setAttribute("dropzone", "move"), this.container.addEventListener("dragover", (t) => {
      t.preventDefault(), t.dataTransfer.dropEffect = "move";
      const e = t.target, s = e.closest(".tr"), i = !e.closest(".thead");
      s && i && s !== this.lastHighlightedRow ? (this.lastHighlightedRow && this.lastHighlightedRow.classList.remove("dragging-hover"), s.classList.add("dragging-hover"), this.lastHighlightedRow = s) : (!s || !i) && this.lastHighlightedRow && (this.lastHighlightedRow.classList.remove("dragging-hover"), this.lastHighlightedRow = null);
    }, { capture: !0 }), this.container.addEventListener("drop", (t) => {
      var o, a;
      t.preventDefault();
      const s = t.target.closest(".tr");
      console.log(t);
      const i = (o = t.dataTransfer) == null ? void 0 : o.getData("text/plain");
      (a = this.lastHighlightedRow) == null || a.classList.remove("dragging-hover"), this.lastHighlightedRow = null;
      const l = this.rows.find((d) => d.$ === s);
      this.onDrop(i, l);
    });
  }
};
f.DEFAULT_OPTIONS = {
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
let w = f;
export {
  w as VirtualTable
};
//# sourceMappingURL=VirtualTable.js.map
