/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 * 
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */
class g {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Ajoute un écouteur en liant `this` une seule fois.
   * Retourne le symbol à utiliser pour le remove.
   */
  listenTo(t, s, e, i) {
    const n = Symbol.for(e.name), o = e.bind(this);
    return this.listeners.set(n, o), t.addEventListener(s, o, i), n;
  }
  /**
   * Supprime un écouteur à partir de son symbol.
   */
  stopListenTo(t, s, e, i) {
    typeof e == "function" && (e = Symbol.for(e.name));
    const n = this.listeners.get(e);
    n && (t.removeEventListener(s, n, i), this.listeners.delete(e));
  }
  /**
   * Supprime tous les écouteurs gérés par cette instance.
   */
  removeAllListeners(t, s) {
    for (const [e, i] of this.listeners)
      s ? t.removeEventListener(s, i) : console.warn("Impossible de removeAll sans type stocké, il faut étendre la structure.");
    this.listeners.clear();
  }
}
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
    this.container = t, this.columns = [], this.rows = [], this.tree = [], this.flatten = [], this.nodeMap = /* @__PURE__ */ new Map(), this.VISIBLE_ROWS_COUNT = 0, this.TOTAL_VISIBLE_ROWS = 0, this.TBODY_START_Y = 0, this.selectedNodes = /* @__PURE__ */ new Set(), this.selectedCells = /* @__PURE__ */ new Set(), this.selectedColumns = /* @__PURE__ */ new Set(), this.$lastHighlightedRow = null, this.lastScrollTopIndex = -1, this.onDrop = () => {
    }, this.options = { ...c.DEFAULT_OPTIONS, ...e }, this.ROW_HEIGHT = this.options.rowHeight, this.columns = s, this.$table = document.createElement("div"), this.$table.classList.add("table"), this.$tableHead = document.createElement("div"), this.$tableHead.classList.add("thead"), this.$tableBody = document.createElement("div"), this.$tableBody.classList.add("tbody"), this.$table.append(this.$tableHead, this.$tableBody), this.container.classList.add("virtual-table"), this.container.appendChild(this.$table), this.options.id && (this.$table.id = this.options.id), this.options.stickyHeader && this.$table.classList.add("sticky-header"), this.DOM_createColumns(), this.DOM_computeViewbox(), this.container.addEventListener("scroll", (i) => this.DOM_EVENT_onScroll(i), { passive: !0 }), this.container.addEventListener("click", (i) => this.DOM_EVENT_onClick(i), { passive: !0 }), this.$table.style.setProperty("--row-height", this.ROW_HEIGHT + "px");
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
      if (s.hidden)
        return;
      const e = document.createElement("div");
      e.classList.add("th", ...s.cssClasses || []), e.style.width = s.width + this.columnUnits, s.field && e.classList.add(s.field.toString());
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
    this.DOM_resetSelections();
    const t = performance.now();
    for (const r of this.flatten)
      r.flatIndex = -1;
    const s = performance.now();
    this.flatten.length = 0;
    let e = 0;
    const i = (r) => {
      if (this.flatten.push(r), r.flatIndex = e++, r.expanded)
        for (const l of r.children)
          i(l);
    };
    for (const r of this.tree)
      i(r);
    const n = performance.now();
    this.DOM_computeViewbox(), this.DOM_updateViewBoxHeight(), this.DOM_resetTableRows(), this.DOM_updateScroll(!0);
    const o = performance.now();
    console.table([
      { step: "reset tree indexes", time: s - t },
      { step: "flatten tree", time: n - s },
      { step: "compute viewbox", time: o - n },
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
    for (const t of this.rows)
      this.DOM_updateRowContent(t);
  }
  /**
   * 
   */
  DOM_updateRowContent(t) {
    var e;
    if (!t.ref)
      return;
    const s = t.ref.children.length > 0;
    t.$.classList.toggle("has-children", s), t.$.classList.toggle("expanded", t.ref.expanded), t.$.classList.toggle("selected", this.selectedNodes.has(this.DOM_getRowIndex(t))), t.$.style.setProperty("--depth", `${t.ref.depth}`);
    for (const i in this.columns) {
      const n = this.columns[i], o = t.$.children.item(+i);
      if (o) {
        const r = n.field ? t.ref.data[n.field] : void 0, l = {
          $: t.$,
          value: r,
          row: t.ref,
          column: n,
          rowIndex: t.y,
          columnIndex: +i
        }, a = ((e = n.transform) == null ? void 0 : e.call(n, l)) || this.formatCellValue(r);
        let h = "";
        if (s && i === "0") {
          const d = t.ref.expanded ? "expanded" : "collapsed";
          h += `<button class="btn-expand"><span class="expand-icon ${d}"></span></button>`;
        }
        h += `<span class="cell-value">${a}</span>`, o.innerHTML = h;
      }
    }
  }
  /**
   * 
   */
  DOM_getTableRowFromNode(t) {
    if (!(t.flatIndex < 0 || t.flatIndex >= this.flatten.length))
      return this.rows.find((s) => {
        var e;
        return ((e = s.ref) == null ? void 0 : e.data.id) === t.data.id;
      });
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
    this.rows.length = 0;
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
    for (const e of this.columns) {
      if (e.hidden)
        continue;
      const i = document.createElement("div");
      i.classList.add("td", ...e.cssClasses || []), i.style.setProperty("--width", e.width + this.columnUnits), s.appendChild(i);
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
    var i, n, o;
    const e = this.TBODY_START_Y + s.top * (this.ROW_HEIGHT - 1);
    t.y = s.top, t.ref = this.flatten[t.y], t.$.dataset.index = `${t.y}`, t.$.dataset.treeIndex = `${(i = t.ref) == null ? void 0 : i.flatIndex}`, t.$.dataset.id = ((o = (n = t.ref) == null ? void 0 : n.data.id) == null ? void 0 : o.toString()) || "", t.$.style.setProperty("--y", e + "px");
  }
  /**
   * Met à jour la position des lignes visibles.
   * Appelé lors d'un scroll.
   */
  DOM_updateScroll(t) {
    var r;
    if (this.rows.length === 0)
      return;
    const s = ((r = this.mostTopRow) == null ? void 0 : r.y) ?? 0, e = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2), i = this.TBODY_START_Y + s * (this.ROW_HEIGHT - 1), n = i + this.ROW_HEIGHT, o = this.totalVirtualHeight > this.container.clientHeight;
    if (!(this.scrollTop >= i && this.scrollTop <= n) && !(o && e + this.VISIBLE_ROWS_COUNT - 1 >= this.flatten.length) && !(!t && e === this.lastScrollTopIndex)) {
      this.lastScrollTopIndex = e;
      for (let l = 0; l < this.rows.length; l++) {
        const a = this.rows[l];
        this.DOM_setRowPosition(a, { top: e + l, left: a.x });
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
      const n = t[i], o = this.dataToTreeNodeRec(n, s);
      e[i] = o, this.nodeMap.set(n.id.toString(), o), i > 0 && e.length > 1 && (o.left = e[i - 1], e[i - 1].right = o);
    }
    return e.length > 1 && (e[0].left = e[e.length - 1], e[e.length - 1].right = e[0]), e;
  }
  /**
   * 
   */
  recomputeDataTree(t) {
    this.tree = this.computeTree(t), console.debug("Recomputed data tree:", this.tree);
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
    if (t.length === 0)
      return this;
    for (const s of t) {
      const e = this.nodeMap.get(s);
      if (!e)
        continue;
      if (e.left && (e.left.right = e.right), e.right && (e.right.left = e.left), e.parent) {
        const n = e.parent.children.indexOf(e);
        n !== -1 && e.parent.children.splice(n, 1);
      } else {
        const n = this.tree.indexOf(e);
        n !== -1 && this.tree.splice(n, 1);
      }
      const i = [e];
      for (; i.length > 0; ) {
        const n = i.pop();
        this.nodeMap.delete(n.data.id.toString());
        for (const o of n.children)
          i.push(o);
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
    const n = this.verifyDuplicateIds(e);
    if (n.size > 0)
      return console.warn("Duplicate IDs found in the elements to add:", Array.from(n).join(", ")), this;
    const o = s ? i : i == null ? void 0 : i.parent, r = this.computeTree(e, o);
    let l, a = 0;
    if (s)
      Array.isArray(i.children) || (i.children = []), l = i.children, a = l.length, l.push(...r);
    else {
      l = (o == null ? void 0 : o.children) ?? this.tree;
      const d = i ? l.indexOf(i) : -1;
      if (d === -1 && i !== void 0)
        return console.warn(`Reference node with ID "${t}" not found in the parent.`), this;
      a = l.length, l.splice(d + 1, 0, ...r);
    }
    const h = a + r.length;
    return a > 0 && (l[a - 1].right = l[a], l[a].left = l[a - 1], l[h - 1].right = l[0], l[0].left = l[h - 1]), this.DOM_computeInViewVisibleRows(), this;
  }
  /**
   * 
   */
  updateNode(t) {
    return this.updateNodes([t]);
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
  updateNodes(t) {
    if (t.length === 0)
      return this;
    for (const s of t) {
      const e = this.nodeMap.get(s.id.toString());
      if (!e) {
        console.warn(`Node with ID "${s.id}" not found.`);
        continue;
      }
      e.data = { ...e.data, ...s };
      const i = this.DOM_getTableRowFromNode(e);
      i && this.DOM_updateRowContent(i);
    }
    return this;
  }
  /**
   * Vérifie si les éléments à ajouter ont des IDs dupliqués,
   * entre eux, et avec les IDs déjà présents dans le hashmap.
   * @returns Un Set contenant les IDs dupliqués.
   */
  verifyDuplicateIds(t) {
    const s = /* @__PURE__ */ new Set(), e = (i) => {
      for (const n of i) {
        const o = n.id.toString();
        (this.nodeMap.has(o) || s.has(o)) && s.add(o), Array.isArray(n.children) && e(n.children);
      }
    };
    return e(t), s;
  }
  /**
   * Reset et redéfini les données de la table.
   * Recalcule tout, excepté les colonnes.
   */
  setData(t) {
    t = structuredClone(t);
    const s = this.verifyDuplicateIds(t);
    if (s.size > 0) {
      console.warn("Duplicate IDs found in the data:", Array.from(s).join(", "));
      return;
    }
    this.recomputeDataTree(t), this.DOM_computeInViewVisibleRows();
  }
  /**
   * 
   */
  clear() {
    this.tree.length = 0, this.flatten.length = 0, this.rows.length = 0, this.nodeMap.clear(), this.$tableBody.innerHTML = "", this.DOM_computeInViewVisibleRows();
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
      const n = Array.from(this.selectedNodes).reduce((h, d) => e === -1 ? h : Math.abs(d - e) < Math.abs(h - e) ? d : h, -1);
      if (n === -1)
        return this;
      const o = Math.min(n, e), r = Math.max(n, e), l = this.DOM_getRowIndex(this.rows[0]), a = this.DOM_getRowIndex(this.rows[this.rows.length - 1]);
      for (let h = o; h <= r; h++) {
        const d = this.flatten[h];
        if (this.selectedNodes.add(d.flatIndex), h >= l && h <= a) {
          const f = (i = this.rows[h - l]) == null ? void 0 : i.$;
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
      var o, r;
      t.preventDefault();
      const e = t.target.closest(".tr"), i = (o = t.dataTransfer) == null ? void 0 : o.getData("text/plain");
      (r = this.$lastHighlightedRow) == null || r.classList.remove("dragging-hover"), this.$lastHighlightedRow = null;
      const n = this.rows.find((l) => l.$ === e);
      this.onDrop(i, n);
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
  g as EventManager,
  u as VirtualTable
};
//# sourceMappingURL=VirtualTable.js.map
