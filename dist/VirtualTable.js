const a = class a {
  constructor(t, e, s = {}) {
    this.container = t, this.columns = [], this.rows = [], this.data = [], this.tree = [], this.flatten = [], this.ROW_HEIGHT = 30, this.VISIBLE_ROWS_COUNT = 0, this.TOTAL_VISIBLE_ROWS = 0, this.tbodyStartY = 0, this.selectedRows = /* @__PURE__ */ new Set(), this.selectedCells = /* @__PURE__ */ new Set(), this.selectedColumns = /* @__PURE__ */ new Set(), this.lastHighlightedRow = null, this.onDrop = () => {
    }, this.options = { ...a.DEFAULT_OPTIONS, ...s }, this.columns = e, this.virtualScroller = document.createElement("div"), this.virtualScroller.classList.add("virtual-scroller"), this.table = document.createElement("div"), this.table.classList.add("table"), this.tableHead = document.createElement("div"), this.tableHead.classList.add("thead"), this.tableBody = document.createElement("div"), this.tableBody.classList.add("tbody"), this.table.append(this.tableHead, this.tableBody), this.container.appendChild(this.table), this.container.appendChild(this.virtualScroller), this.options.id && (this.table.id = this.options.id), this.createColumns(), this.computeViewbox(), this.container.addEventListener("scroll", (l) => this.onScroll(l)), this.container.addEventListener("click", (l) => this.onClick(l)), this.table.style.setProperty("--row-height", this.ROW_HEIGHT + "px");
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
        for (let l = this.rows.length; l < s; l++)
          this.createEmptyRow();
      else if (this.rows.length > s)
        for (let l = this.rows.length - 1; l >= s; l--)
          this.removeRow(this.rows[l]);
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
    this.flatten = [];
    const t = (e) => {
      if (this.flatten.push({ node: e }), e.expanded)
        for (const s of e.children)
          t(s);
    };
    for (const e of this.tree)
      t(e);
    this.computeViewbox(), this.updateViewBoxHeight();
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
    this.TOTAL_VISIBLE_ROWS = this.flatten.length, console.log(this.TOTAL_VISIBLE_ROWS), this.virtualScroller.style.height = this.totalVirtualHeight + "px";
  }
  updateRowsContent() {
    var t;
    for (const e of this.rows) {
      if (!e.node)
        continue;
      const s = e.node.children.length > 0;
      e.$.classList.toggle("has-children", s), e.$.style.setProperty("--depth", `${e.node.depth}`);
      for (const l in this.columns) {
        const o = this.columns[l], i = e.$.children.item(+l);
        if (i) {
          const n = o.field ? e.node.data[o.field] : void 0, h = {
            $: e.$,
            value: n,
            row: e.node,
            column: o,
            rowIndex: e.y,
            columnIndex: +l
          }, r = ((t = o.transform) == null ? void 0 : t.call(o, h)) || this.formatCellValue(n);
          let d = "";
          if (s && l === "0") {
            const p = e.node.expanded ? "expanded" : "collapsed";
            d += `<button class="btn-expand"><span class="expand-icon ${p}"></span></button>`;
          }
          d += `<span class="cell-value">${r}</span>`, i.innerHTML = d;
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
      const l = document.createElement("div");
      l.classList.add("td"), l.style.setProperty("--width", this.columns[s].width + this.columnUnits), e.appendChild(l);
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
    const s = this.tbodyStartY + e.top * (this.ROW_HEIGHT - 1);
    t.y = e.top, t.node = this.flatten[t.y].node, t.$.dataset.index = `${t.y}`, t.$.style.setProperty("--y", s + "px");
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
      for (let l = 0; l < this.rows.length; l++) {
        const o = this.rows[l];
        this.setRowPosition(o, { top: s + l, left: o.x });
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
    const e = t.target, s = e.closest(".tr"), l = this.getNodeFromRow(s);
    console.log(l, e), this.cancelCellEdition(), !t.shiftKey && !t.ctrlKey && (this.unselectAllRows(), this.unselectAllCells(), this.unselectAllColumns()), l && this.onRowClick(l, e);
  }
  onRowClick(t, e) {
    if (e.closest(".btn-expand")) {
      this.toggleRowExpand(t);
      return;
    }
    if (e.closest(".td")) {
      const s = e.closest(".td");
      this.options.allowCellEditing && this.editCell(t, s), this.options.allowCellSelection;
    }
    this.options.allowRowSelection && this.selectRow(t);
  }
  selectRow(t) {
    this.selectedRows.has(t.node) ? (t.$.classList.remove("selected"), this.selectedRows.delete(t.node)) : (t.$.classList.add("selected"), this.selectedRows.add(t.node)), console.log("Selected rows:", this.selectedRows);
  }
  selectAllRows() {
    this.tableBody.querySelectorAll(".tr").forEach((t) => {
      t.classList.add("selected");
    }), this.selectedRows.clear();
    for (const t of this.rows)
      this.selectedRows.add(t.node);
  }
  unselectAllRows() {
    this.tableBody.querySelectorAll(".tr.selected").forEach((t) => {
      t.classList.remove("selected");
    }), this.selectedRows.clear();
  }
  selectCell() {
  }
  unselectAllCells() {
    this.tableBody.querySelectorAll(".td.selected").forEach((t) => {
      t.classList.remove("selected");
    }), this.selectedCells.clear();
  }
  selectColumn(t) {
    this.selectedColumns.has(t) ? (this.tableHead.querySelectorAll(".th.selected").forEach((e) => {
      e.classList.remove("selected");
    }), this.selectedColumns.delete(t)) : (this.tableHead.querySelectorAll(".th").forEach((e) => {
      e.textContent === t.title && e.classList.add("selected");
    }), this.selectedColumns.add(t));
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
    const e = t.node;
    e.expanded = !e.expanded, t.$.classList.toggle("expanded", e.expanded);
    const s = this.flatten.findIndex((l) => l.node === e);
    if (e.expanded) {
      const l = e.children.map((o) => this.dataToTreeNode(o.data, e.depth + 1));
      this.flatten.splice(s + 1, 0, ...l.map((o) => ({ node: o })));
      for (let o = s + 1; o < s + 1 + l.length; o++)
        this.createEmptyRow(!1);
    } else {
      const l = e.children.length;
      this.flatten.splice(s + 1, l);
      for (let o = 0; o < l; o++)
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
      const l = this.createEmptyRow(!1);
      e.appendChild(l.$), this.setRowPosition(l, { top: s, left: 0 });
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
      const e = t.target, s = e.closest(".tr"), l = !e.closest(".thead");
      s && l && s !== this.lastHighlightedRow ? (this.lastHighlightedRow && this.lastHighlightedRow.classList.remove("dragging-hover"), s.classList.add("dragging-hover"), this.lastHighlightedRow = s) : (!s || !l) && this.lastHighlightedRow && (this.lastHighlightedRow.classList.remove("dragging-hover"), this.lastHighlightedRow = null);
    }, { capture: !0 }), this.container.addEventListener("drop", (t) => {
      var i, n;
      t.preventDefault();
      const s = t.target.closest(".tr");
      console.log(t);
      const l = (i = t.dataTransfer) == null ? void 0 : i.getData("text/plain");
      (n = this.lastHighlightedRow) == null || n.classList.remove("dragging-hover"), this.lastHighlightedRow = null;
      const o = this.rows.find((h) => h.$ === s);
      this.onDrop(l, o);
    });
  }
};
a.DEFAULT_OPTIONS = {
  id: "",
  columnSizeInPercentage: !1,
  defaultExpanded: !0,
  // -- allowed actions
  allowColumnSelection: !1,
  allowRowSelection: !1,
  allowCellSelection: !1,
  allowCellEditing: !1,
  allowColumnResize: !1,
  allowColumnReorder: !1,
  allowRowReorder: !1
};
let c = a;
export {
  c as VirtualTable
};
//# sourceMappingURL=VirtualTable.js.map
