/******/ var __webpack_modules__ = ({

/***/ "./src/VirtualTable.ts":
/*!*****************************!*\
  !*** ./src/VirtualTable.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   VirtualTable: () => (/* binding */ VirtualTable)
/* harmony export */ });
class VirtualTable {
    constructor(container, columnsDef, options = {}) {
        this.container = container;
        this.columns = [];
        this.rows = [];
        this.data = [];
        this.tree = [];
        this.flatten = [];
        this.ROW_HEIGHT = 30;
        this.VISIBLE_ROWS_COUNT = 0;
        this.TOTAL_VISIBLE_ROWS = 0;
        this.tbodyStartY = 0;
        this.lastHighlightedRow = null;
        this.onDrop = () => { };
        this.options = Object.assign(Object.assign({}, VirtualTable.DEFAULT_OPTIONS), options);
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
        if (this.options.id) {
            this.table.id = this.options.id;
        }
        this.createColumns();
        this.computeViewbox();
        this.container.addEventListener('scroll', (e) => this.onScroll(e));
        this.container.addEventListener('click', (e) => this.onClick(e));
        this.table.style.setProperty('--row-height', this.ROW_HEIGHT + 'px');
    }
    get scrollTop() {
        return this.container.scrollTop;
    }
    get totalVirtualHeight() {
        return this.tableHead.clientHeight + (this.TOTAL_VISIBLE_ROWS - 1) * (this.ROW_HEIGHT - 1);
    }
    get columnUnits() {
        return this.options.columnSizeInPercentage ? '%' : 'px';
    }
    createColumns() {
        const $tr = document.createElement('div');
        $tr.classList.add('tr');
        for (const columnDef of this.columns) {
            const $th = document.createElement('div');
            $th.classList.add('th');
            $th.style.width = columnDef.width + this.columnUnits;
            $th.textContent = columnDef.title;
            $tr.appendChild($th);
        }
        this.tableHead.appendChild($tr);
    }
    computeViewbox() {
        const CONTAINER_HEIGHT = this.container.clientHeight;
        this.VISIBLE_ROWS_COUNT = Math.ceil(CONTAINER_HEIGHT / this.ROW_HEIGHT) + 4;
        if (this.flatten.length > 0) {
            const rowsCount = this.flatten.length;
            const max = Math.min(rowsCount, this.VISIBLE_ROWS_COUNT);
            if (this.rows.length < max) {
                for (let i = this.rows.length; i < max; i++) {
                    this.createEmptyRow();
                }
            }
            else if (this.rows.length > max) {
                for (let i = this.rows.length - 1; i >= max; i--) {
                    this.removeRow(this.rows[i]);
                }
            }
        }
        this.tbodyStartY = this.tableHead.clientHeight - 1;
    }
    computeInViewVisibleRows() {
        this.flatten = [];
        const rec = (node) => {
            this.flatten.push({ node });
            if (node.expanded) {
                for (const child of node.children) {
                    rec(child);
                }
            }
        };
        for (const node of this.tree) {
            rec(node);
        }
        this.computeViewbox();
        this.updateViewBoxHeight();
    }
    updateViewBoxHeight() {
        this.TOTAL_VISIBLE_ROWS = this.flatten.length;
        console.log(this.TOTAL_VISIBLE_ROWS);
        this.virtualScroller.style.height = this.totalVirtualHeight + 'px';
    }
    updateRowsContent() {
        var _a;
        for (const row of this.rows) {
            if (!row.node) {
                continue;
            }
            const hasChildren = row.node.children.length > 0;
            row.$.classList.toggle('has-children', hasChildren);
            row.$.style.setProperty('--depth', `${row.node.depth}`);
            for (const i in this.columns) {
                const col = this.columns[i];
                const $cell = row.$.children.item(+i);
                if ($cell) {
                    const value = col.field ? row.node.data[col.field] : undefined;
                    const cell = {
                        $: row.$,
                        value,
                        row: row.node,
                        column: col,
                        rowIndex: row.y,
                        columnIndex: +i,
                    };
                    const transformedValue = ((_a = col.transform) === null || _a === void 0 ? void 0 : _a.call(col, cell)) || this.formatCellValue(value);
                    let html = '';
                    if (hasChildren && i === '0') {
                        const cls = row.node.expanded ? 'expanded' : 'collapsed';
                        html += `<button class="btn-expand"><span class="expand-icon ${cls}"></span></button>`;
                    }
                    html += `<span class="cell-value">${transformedValue}</span>`;
                    $cell.innerHTML = html;
                }
            }
        }
    }
    formatCellValue(value) {
        return (value === null || value === void 0 ? void 0 : value.toString()) || '';
    }
    createEmptyRow(shouldAddDirectly = true) {
        const row = {
            $: document.createElement('div'),
            x: 0,
            y: 0,
        };
        row.$.classList.add('tr');
        row.nextElement = row;
        row.previousElement = row;
        if (this.rows.length > 0) {
            row.previousElement = this.rows[this.rows.length - 1];
            row.previousElement.nextElement = row;
            row.nextElement = this.rows[0];
            row.nextElement.previousElement = row;
        }
        this.rows.push(row);
        this.createEmptyCells(row);
        if (shouldAddDirectly) {
            this.tableBody.appendChild(row.$);
        }
        return row;
    }
    createEmptyCells(row) {
        const $fragment = document.createDocumentFragment();
        for (const i in this.columns) {
            const $td = document.createElement('div');
            $td.classList.add('td');
            $td.style.setProperty('--width', this.columns[i].width + this.columnUnits);
            $fragment.appendChild($td);
        }
        row.$.appendChild($fragment);
    }
    removeRow(row) {
        if (row.$.parentNode) {
            row.$.remove();
        }
        const rowIndex = this.rows.findIndex(r => r === row);
        if (rowIndex !== -1) {
            this.rows.splice(rowIndex, 1);
            if (row.previousElement) {
                row.previousElement.nextElement = row.nextElement;
            }
            if (row.nextElement) {
                row.nextElement.previousElement = row.previousElement;
            }
        }
    }
    setRowPosition(row, position) {
        const top = this.tbodyStartY + position.top * (this.ROW_HEIGHT - 1);
        row.y = position.top;
        row.node = this.flatten[row.y].node;
        row.$.dataset.index = `${row.y}`;
        row.$.style.setProperty('--y', top + 'px');
    }
    updateScroll() {
        if (this.rows.length === 0) {
            return;
        }
        const topMin = this.tbodyStartY + this.mostTopRow.y * (this.ROW_HEIGHT - 1);
        const topMax = topMin + this.ROW_HEIGHT;
        if (this.scrollTop >= topMin && this.scrollTop <= topMax) {
            return;
        }
        const scrollTopIndex = Math.max(0, Math.floor(this.scrollTop / (this.ROW_HEIGHT - 1)) - 2);
        if (scrollTopIndex + this.VISIBLE_ROWS_COUNT - 1 >= this.flatten.length) {
            return;
        }
        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            this.setRowPosition(row, { top: scrollTopIndex + i, left: row.x });
        }
        this.updateRowsContent();
    }
    onScroll(e) {
        this.updateScroll();
    }
    onClick(e) {
        const $target = e.target;
        const $closestRow = $target.closest('.tr');
        console.log($closestRow, $target);
        if ($target.closest('.btn-expand')) {
            this.toggleRowExpand($closestRow);
        }
    }
    toggleRowExpand($row) {
        const row = this.rows.find(r => r.$ === $row);
        const node = row.node;
        node.expanded = !node.expanded;
        $row.classList.toggle('expanded', node.expanded);
        const startIndex = this.flatten.findIndex(f => f.node === node);
        if (node.expanded) {
            const children = node.children.map(c => this.dataToTreeNode(c.data, node.depth + 1));
            this.flatten.splice(startIndex + 1, 0, ...children.map(c => ({ node: c })));
            for (let i = startIndex + 1; i < startIndex + 1 + children.length; i++) {
                this.createEmptyRow(false);
            }
        }
        else {
            const childrenCount = node.children.length;
            this.flatten.splice(startIndex + 1, childrenCount);
            for (let i = 0; i < childrenCount; i++) {
                this.removeRow(this.rows[startIndex + 1]);
            }
        }
        this.updateViewBoxHeight();
        this.updateScroll();
        this.updateRowsContent();
    }
    resetTableRows() {
        for (const row of this.rows) {
            row.$.remove();
        }
        this.rows = [];
        const max = Math.min(this.flatten.length, this.VISIBLE_ROWS_COUNT);
        const $fragment = document.createDocumentFragment();
        for (let i = 0; i < max; i++) {
            const row = this.createEmptyRow(false);
            $fragment.appendChild(row.$);
            this.setRowPosition(row, { top: i, left: 0 });
        }
        this.tableBody.appendChild($fragment);
        if (this.rows.length > 0) {
            this.mostTopRow = this.rows[0].nextElement;
        }
    }
    dataToTreeNode(data, depth) {
        return {
            data,
            expanded: this.options.defaultExpanded,
            depth,
            children: data.children
                ? data.children.map(d => this.dataToTreeNode(d, depth + 1))
                : [],
        };
    }
    scrollTo(index) {
        this.container.scrollTo({
            top: this.tbodyStartY + index * (this.ROW_HEIGHT - 1),
            behavior: 'smooth',
        });
    }
    setData(data) {
        this.data = data;
        this.tree = this.data.map(d => this.dataToTreeNode(d, 0));
        this.computeInViewVisibleRows();
        this.resetTableRows();
        this.updateScroll();
    }
    allowColumnResizing() {
    }
    disallowColumnResizing() {
    }
    allowSelection() {
    }
    disallowSelection() {
    }
    makeDroppable() {
        this.container.setAttribute('dropzone', 'move');
        this.container.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            const target = event.target;
            const closestRow = target.closest('.tr');
            const isNotHead = !target.closest('.thead');
            if (closestRow && isNotHead && closestRow !== this.lastHighlightedRow) {
                if (this.lastHighlightedRow) {
                    this.lastHighlightedRow.classList.remove('dragging-hover');
                }
                closestRow.classList.add('dragging-hover');
                this.lastHighlightedRow = closestRow;
            }
            else if (!closestRow || !isNotHead) {
                if (this.lastHighlightedRow) {
                    this.lastHighlightedRow.classList.remove('dragging-hover');
                    this.lastHighlightedRow = null;
                }
            }
        }, { capture: true });
        this.container.addEventListener('drop', (event) => {
            var _a, _b;
            event.preventDefault();
            const target = event.target;
            const closestRow = target.closest('.tr');
            console.log(event);
            const data = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('text/plain');
            (_b = this.lastHighlightedRow) === null || _b === void 0 ? void 0 : _b.classList.remove('dragging-hover');
            this.lastHighlightedRow = null;
            const row = this.rows.find(r => r.$ === closestRow);
            this.onDrop(data, row);
        });
    }
}
VirtualTable.DEFAULT_OPTIONS = {
    id: '',
    columnSizeInPercentage: false,
    defaultExpanded: true,
};


/***/ }),

/***/ "./src/types.ts":
/*!**********************!*\
  !*** ./src/types.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   VirtualTable: () => (/* reexport safe */ VirtualTable__WEBPACK_IMPORTED_MODULE_0__.VirtualTable)
/* harmony export */ });
/* harmony import */ var VirtualTable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! VirtualTable */ "./src/VirtualTable.ts");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./types */ "./src/types.ts");



})();

var __webpack_exports__VirtualTable = __webpack_exports__.VirtualTable;
export { __webpack_exports__VirtualTable as VirtualTable };

//# sourceMappingURL=VirtualTable.js.map