/**
 * @copyright Copyright (c) 2025 NoxFly
 * @license AGPL-3.0
 * 
 * Entry point for the virtualization module.
 * Exports the main VirtualTable component and related type definitions.
 */
class E {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Ajoute un écouteur en liant `this` une seule fois.
   * Retourne le symbol à utiliser pour le remove.
   */
  listenTo(t, s, e, i) {
    const n = Symbol.for(e.name), l = e.bind(this);
    return this.listeners.set(n, l), t.addEventListener(s, l, i), n;
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
const g = class g {
  /**
   *
   */
  constructor(t, s, e = {}) {
    this.container = t, this.columns = [], this.rows = [], this.tree = [], this.flatten = [], this.nodeMap = /* @__PURE__ */ new Map(), this.VISIBLE_ROWS_COUNT = 0, this.TOTAL_VISIBLE_ROWS = 0, this.TBODY_START_Y = 0, this.selectedNodes = /* @__PURE__ */ new Set(), this.selectedCells = /* @__PURE__ */ new Set(), this.selectedColumns = /* @__PURE__ */ new Set(), this.$lastHighlightedRow = null, this.$columns = [], this.lastScrollTopIndex = -1, this.onDrop = () => {
    }, this.onCellClicked = () => {
    }, this.onRowClicked = () => {
    }, this.onColumnClicked = () => {
    }, this.onCellRightClicked = () => {
    }, this.onRowRightClicked = () => {
    }, this.onColumnRightClicked = () => {
    }, this.onEmptySpaceRightClicked = () => {
    }, this.onCellEdited = () => {
    }, this.options = { ...g.DEFAULT_OPTIONS, ...e }, this.ROW_HEIGHT = this.options.rowHeight, this.columns = s.map((i) => ({
      ...i,
      id: crypto.randomUUID(),
      type: i.type || "string"
    })), this.$table = document.createElement("div"), this.$table.classList.add("table"), this.$tableHead = document.createElement("div"), this.$tableHead.classList.add("thead"), this.$tableBody = document.createElement("div"), this.$tableBody.classList.add("tbody"), this.$table.append(this.$tableHead, this.$tableBody), this.container.classList.add("virtual-table"), this.container.appendChild(this.$table), this.options.id && (this.$table.id = this.options.id), this.options.stickyHeader && this.$table.classList.add("sticky-header"), this.DOM_createColumns(), this.DOM_computeViewbox(), this.container.addEventListener("scroll", (i) => this.DOM_EVENT_onScroll(i), { passive: !0 }), this.container.addEventListener("click", (i) => this.DOM_EVENT_onClick(i), { passive: !0 }), this.container.addEventListener("contextmenu", (i) => this.DOM_EVENT_onContextMenu(i)), this.$table.style.setProperty("--row-height", this.ROW_HEIGHT + "px");
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
      e.dataset.type = s.type, e.dataset.id = s.id, e.classList.add("th", ...s.cssClasses || []), e.style.width = s.width + this.columnUnits, s.field && e.classList.add(s.field.toString());
      const i = document.createElement("span");
      i.classList.add("cell-value"), i.innerHTML = s.title, e.appendChild(i), t.appendChild(e), this.$columns.push(e);
    }
    this.$tableHead.innerHTML = "", this.$tableHead.appendChild(t);
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
   * *Note : recalcule TOUT, pas intelligemment.*
   */
  DOM_computeInViewVisibleRows() {
    this.DOM_resetSelections();
    for (const e of this.flatten)
      e.flatIndex = -1;
    this.flatten.length = 0;
    let t = 0;
    const s = (e) => {
      if (this.flatten.push(e), e.flatIndex = t++, e.expanded)
        for (const i of e.children)
          s(i);
    };
    for (const e of this.tree)
      s(e);
    this.DOM_computeViewbox(), this.DOM_updateViewBoxHeight(), this.DOM_resetTableRows(), this.DOM_updateScroll(!0);
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
  getRowFromHTMLRow(t) {
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
    var n;
    if (!t.ref)
      return;
    const s = t.ref.children.length > 0;
    let e = "tr ";
    this.rowCssClassesCallback !== void 0 && (e += this.rowCssClassesCallback(t)), t.$.className = e, t.$.classList.toggle("has-children", s), t.$.classList.toggle("expanded", t.ref.expanded), t.$.classList.toggle("selected", this.selectedNodes.has(this.DOM_getRowIndex(t))), t.$.style.setProperty("--depth", `${t.ref.depth}`);
    const i = this.columns.filter((l) => !l.hidden);
    for (const l in i) {
      const d = i[l];
      if (d.hidden)
        continue;
      const r = t.cells[+l], c = r.$;
      if (!c)
        continue;
      const a = d.field !== void 0 ? t.ref.data[d.field] : void 0, h = this.options.allowCellEditing === !0 && d.readonly !== !0 && d.required === !0 && (a == null || d.type === "string" && a === "" || d.type === "number" && a === 0 && this.options.treatZeroAsEmpty === !0), p = a === 0 && this.options.treatZeroAsEmpty === !0 ? void 0 : a;
      r.value = p, r.node = t.ref, r.column = d, r.rowIndex = t.y, r.columnIndex = +l;
      let u;
      if (d.transform !== void 0) {
        const f = (n = d.transform) == null ? void 0 : n.call(d, r);
        f == null ? u = "" : f instanceof HTMLElement ? u = f.outerHTML : u = f;
      } else
        u = this.formatCellValue(a);
      let m = "";
      if (s && c.classList.contains("expand") && this.options.allowExpandCollapse) {
        const f = t.ref.expanded ? "expanded" : "collapsed";
        m += `<button class="btn-expand"><span class="expand-icon ${f}"></span></button>`;
      }
      m += `<div class="cell-value">${u}</div>`, c.innerHTML = m, c.classList.toggle("validator-required", h);
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
    this.$tableBody.appendChild(s), this.rows.length > 0 && (this.mostTopRow = this.rows[0]);
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
      y: 0,
      cells: []
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
      i.classList.add("td", ...e.cssClasses || []), e.field && i.classList.add("field", `field-${e.field.toString()}`), i.style.setProperty("--width", e.width + this.columnUnits), i.dataset.type = e.type, s.appendChild(i);
      const n = {
        $: i,
        value: "",
        row: t,
        node: t.ref,
        column: e,
        rowIndex: t.y,
        columnIndex: this.columns.indexOf(e)
      };
      t.cells.push(n);
    }
    t.$.appendChild(s);
  }
  DOM_removeRow(t) {
    let s = -1;
    typeof t == "number" ? (s = t, t = this.rows[t]) : s = this.rows.findIndex((e) => e === t), !(!t || s === -1) && (t.$.parentNode && t.$.remove(), this.rows.splice(s, 1), t.previousElement && (t.previousElement.nextElement = t.nextElement), t.nextElement && (t.nextElement.previousElement = t.previousElement));
  }
  /**
   * Supprime la cellule à l'index donné de chaque ligne.
   * L'élément HTML de l'entête de la colonne est également enlevé
   */
  DOM_removeCell(t) {
    if (t < 0 || t >= this.columns.length || this.columns[t].hidden)
      return;
    this.columns[t].hidden = !0, this.$columns[t].remove();
    const s = this.columns.slice(0, t).filter((i) => i.hidden).length, e = t - s;
    for (const i of this.rows) {
      const n = i.$.children.item(e);
      n == null || n.remove();
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
  DOM_setRowPosition(t, s) {
    var i, n, l;
    const e = this.TBODY_START_Y + s.top * (this.ROW_HEIGHT - 1);
    t.y = s.top, t.ref = this.flatten[t.y], t.$.dataset.index = `${t.y}`, t.$.dataset.treeIndex = `${(i = t.ref) == null ? void 0 : i.flatIndex}`, t.$.dataset.id = ((l = (n = t.ref) == null ? void 0 : n.data.id) == null ? void 0 : l.toString()) || "", t.$.style.setProperty("--y", e + "px");
  }
  /**
   * Met à jour la position des lignes visibles.
   * Appelé lors d'un scroll.
   */
  DOM_updateScroll(t) {
    var d;
    if (this.rows.length === 0)
      return;
    const s = ((d = this.mostTopRow) == null ? void 0 : d.y) ?? 0, e = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2), i = this.TBODY_START_Y + s * (this.ROW_HEIGHT - 1), n = i + this.ROW_HEIGHT, l = this.totalVirtualHeight > this.container.clientHeight;
    if (!(this.scrollTop >= i && this.scrollTop <= n) && !(!t && l && e + this.VISIBLE_ROWS_COUNT - 1 >= this.flatten.length) && !(!t && e === this.lastScrollTopIndex)) {
      this.lastScrollTopIndex = e;
      for (let r = 0; r < this.rows.length; r++) {
        const c = this.rows[r];
        this.DOM_setRowPosition(c, { top: e + r, left: c.x });
      }
      this.DOM_updateRowsContent();
    }
  }
  /**
   * Gère l'événement de scroll du conteneur.
   * Met à jour les positions des lignes visibles.
   */
  DOM_EVENT_onScroll(t) {
    this.DOM_updateScroll(), this.container.querySelectorAll(".td.editing").forEach((s) => {
      s.classList.remove("editing");
    });
  }
  /**
   *
   */
  DOM_EVENT_onClick(t) {
    !t.shiftKey && !t.ctrlKey && this.DOM_resetSelections(), this.cancelCellEdition();
    const s = t.target;
    if (s.closest(".th")) {
      const e = s.closest(".th"), i = this.$columns.indexOf(e), n = this.columns[i];
      n && this.onColumnClicked(n, t, e);
    } else {
      const e = s.closest(".tr"), i = this.getRowFromHTMLRow(e);
      i && this.DOM_EVENT_onRowClick(t, i, s);
    }
  }
  /**
   *
   */
  DOM_EVENT_onContextMenu(t) {
    const s = t.target;
    if (s.closest(".th")) {
      const e = s.closest(".th"), i = this.$columns.indexOf(e), n = this.columns[i];
      n && this.onColumnRightClicked(n, t, e);
    } else if (s.closest(".tr")) {
      const e = s.closest(".tr"), i = this.getRowFromHTMLRow(e);
      if (i) {
        const n = s.closest(".td");
        if (n) {
          const l = Array.from(i.$.children).indexOf(n), d = i.cells[l];
          this.onCellRightClicked(d, t);
        }
        this.onRowRightClicked(i, t);
      }
    } else
      this.onEmptySpaceRightClicked(t);
  }
  /**
   *
   */
  DOM_EVENT_onRowClick(t, s, e) {
    if (e.closest(".btn-expand")) {
      this.toggleRowExpand(s);
      return;
    }
    const i = e.closest(".td");
    if (i) {
      const n = Array.from(s.$.children).indexOf(i), l = s.cells[n];
      this.options.allowCellEditing && this.editCell(l), this.options.allowCellSelection, this.options.allowRowSelection && this.selectRow(t, s), this.onCellClicked(l, t);
    }
    this.onRowClicked(s, t);
  }
  /**
   * Gère l'événement de clic sur une ligne.
   * Développe ou réduit la ligne si elle a des enfants.
   *
   * @param row La ligne sur laquelle on a cliqué.
   * @param expandBtn Le bouton d'expansion/réduction.
   */
  toggleRowExpand(t) {
    if (!this.options.allowExpandCollapse)
      return;
    if (!t.ref) {
      console.warn("Cannot toggle expand on a row without a reference to the data node.");
      return;
    }
    const s = t.ref;
    s.expanded = !s.expanded, t.$.classList.toggle("expanded", s.expanded), this.DOM_computeInViewVisibleRows();
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
      const n = t[i], l = this.dataToTreeNodeRec(n, s);
      e[i] = l, this.nodeMap.set(n.id.toString(), l), i > 0 && e.length > 1 && (l.left = e[i - 1], e[i - 1].right = l);
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
        for (const l of n.children)
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
    const n = this.verifyDuplicateIds(e);
    if (n.size > 0)
      return console.warn("Duplicate IDs found in the elements to add:", Array.from(n).join(", ")), this;
    const l = s ? i : i == null ? void 0 : i.parent, d = this.computeTree(e, l);
    let r, c = 0;
    if (s)
      Array.isArray(i.children) || (i.children = []), r = i.children, c = r.length, r.push(...d);
    else {
      r = (l == null ? void 0 : l.children) ?? this.tree;
      const a = i ? r.indexOf(i) : -1;
      if (a === -1 && i !== void 0)
        return console.warn(`Reference node with ID "${t}" not found in the parent.`), this;
      c = r.length, r.splice(a + 1, 0, ...d);
    }
    const o = c + d.length;
    return c > 0 && (r[c - 1].right = r[c], r[c].left = r[c - 1], r[o - 1].right = r[0], r[0].left = r[o - 1]), this.DOM_computeInViewVisibleRows(), this;
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
        const l = n.id.toString();
        (this.nodeMap.has(l) || s.has(l)) && s.add(l), Array.isArray(n.children) && e(n.children);
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
      const n = Array.from(this.selectedNodes).reduce((o, a) => e === -1 ? o : Math.abs(a - e) < Math.abs(o - e) ? a : o, -1);
      if (n === -1)
        return this;
      const l = Math.min(n, e), d = Math.max(n, e), r = this.DOM_getRowIndex(this.rows[0]), c = this.DOM_getRowIndex(this.rows[this.rows.length - 1]);
      for (let o = l; o <= d; o++) {
        const a = this.flatten[o];
        if (this.selectedNodes.add(a.flatIndex), o >= r && o <= c) {
          const h = (i = this.rows[o - r]) == null ? void 0 : i.$;
          h == null || h.classList.add("selected");
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
  editCell(t) {
    if (!this.options.allowCellEditing || t.column.readonly || t.$.classList.contains("editing"))
      return this;
    let s;
    const e = t.node.data[t.column.field];
    if (t.column.type === "string" || t.column.type === "number")
      s = document.createElement("input"), s.type = "text", s.value = (e == null ? void 0 : e.toString().trim()) || "", t.column.type === "number" && (s.oninput = () => {
        s.value = s.value.replace(/[^0-9.-]/g, "");
      });
    else if (t.column.type === "boolean")
      s = document.createElement("input"), s.type = "checkbox", s.checked = !!e;
    else if (t.column.type === "date")
      s = document.createElement("input"), s.type = "date", s.value = e && (e instanceof Date || typeof e == "string" || typeof e == "number") ? new Date(e).toISOString().split("T")[0] : "";
    else if (t.column.type === "enum" && t.column.enumValues !== void 0) {
      s = document.createElement("select");
      for (const o of t.column.enumValues) {
        const a = document.createElement("option");
        a.value = o.toString(), a.textContent = o.toString(), o.toString() === (e == null ? void 0 : e.toString()) && (a.selected = !0), s.appendChild(a);
      }
    } else
      return console.warn(`Unsupported column type: ${t.column.type}`), this;
    if (t.column.type !== "enum" && t.column.editTransformedValue === !0 && t.column.transform !== void 0) {
      const o = t.column.transform(t);
      o instanceof HTMLElement || (s.value = (o == null ? void 0 : o.toString().trim()) || "");
    }
    s.classList.add("cell-editor"), t.$.classList.add("editing");
    const i = () => {
      var o;
      s instanceof HTMLInputElement ? s.removeEventListener("keydown", r) : s.removeEventListener("change", n), s.removeEventListener("blur", n);
      try {
        (o = t.$) == null || o.classList.remove("editing"), s == null || s.remove();
      } catch {
      }
    }, n = () => {
      i();
      const o = s instanceof HTMLInputElement ? s.value.trim() : s.value;
      if (o === (e == null ? void 0 : e.toString().trim()))
        return;
      let a = o;
      switch (t.column.type) {
        case "number":
          a = parseFloat(o), isNaN(a) && (a = null);
          break;
        case "boolean":
          a = s.checked;
          break;
        case "date":
          a = new Date(o), isNaN(a.getTime()) && (a = null);
          break;
      }
      this.onCellEdited(t, a);
    }, l = (o) => {
      n();
      let h = t.row.cells.indexOf(t) + o;
      for (; h >= 0 && h < t.row.cells.length; ) {
        const p = t.row.cells[h], u = p.column.type, m = p.column.readonly === !0;
        if (u === "html" || m) {
          h += o;
          continue;
        }
        this.editCell(p);
        break;
      }
    }, d = (o) => {
      n();
      const h = this.DOM_getRowIndex(t.row) + o;
      if (h >= 0 && h < this.rows.length) {
        const u = this.rows[h].cells[t.columnIndex];
        this.editCell(u);
      }
    }, r = (o) => {
      o.key === "Enter" ? (o.preventDefault(), n()) : o.key === "Escape" ? (o.preventDefault(), i()) : o.key === "Tab" ? (o.preventDefault(), l(o.shiftKey ? -1 : 1)) : o.key === "ArrowLeft" || o.key === "ArrowRight" ? (o.preventDefault(), l(o.key === "ArrowLeft" ? -1 : 1)) : (o.key === "ArrowUp" || o.key === "ArrowDown") && (o.preventDefault(), d(o.key === "ArrowUp" ? -1 : 1));
    };
    return s instanceof HTMLInputElement ? s.addEventListener("keydown", r) : s instanceof HTMLSelectElement && s.addEventListener("change", n, { once: !0, passive: !0 }), s.addEventListener("blur", n, { once: !0, passive: !0 }), t.$.appendChild(s), s.focus(), s instanceof HTMLInputElement && (t.column.type === "string" || t.column.type === "number") && s.select(), this;
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
  hideColumn(t) {
    let s;
    if (typeof t == "number" ? s = t : s = this.columns.findIndex((i) => i.id === t), s < 0 || s >= this.columns.length)
      return console.warn(`Column index ${s} is out of bounds.`), this;
    const e = this.columns[s];
    return e.hidden ? (console.warn(`Column "${e.title}" is already hidden.`), this) : (this.DOM_removeCell(s), this);
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
      var l, d;
      t.preventDefault();
      const e = t.target.closest(".tr"), i = (l = t.dataTransfer) == null ? void 0 : l.getData("text/plain");
      (d = this.$lastHighlightedRow) == null || d.classList.remove("dragging-hover"), this.$lastHighlightedRow = null;
      const n = this.rows.find((r) => r.$ === e);
      this.onDrop(i, n);
    }), this;
  }
};
g.DEFAULT_OPTIONS = {
  id: "",
  rowHeight: 30,
  columnSizeInPercentage: !1,
  defaultExpanded: !0,
  treatZeroAsEmpty: !1,
  // --
  stickyHeader: !1,
  // -- allowed actions
  allowExpandCollapse: !0,
  allowColumnSelection: !1,
  allowRowSelection: !1,
  allowCellSelection: !1,
  allowCellEditing: !1,
  allowColumnResize: !1,
  allowColumnReorder: !1,
  allowRowReorder: !1
};
let w = g;
export {
  E as EventManager,
  w as VirtualTable
};
//# sourceMappingURL=VirtualTable.js.map
