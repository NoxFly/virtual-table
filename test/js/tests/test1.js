import { VirtualTable, } from "../../../src/VirtualTable.ts";
import { Test } from "../Test.js";
import { generateRandomContacts } from "../faker.js";


export class Test1 extends Test {
    static id = 1;
    static description = "10 000 entries for first level, children, drag & drop, basic styling, some options.";

    columnsDef = [
        {
            field: 'id',
            title: 'ID',
            width: 500,
            field: 'id',
        },
        {
            title: 'index',
            width: 100,
            transform: (cell) => cell.rowIndex.toString(),
        },
        {
            title: 'abs. index',
            width: 100,
            transform: (cell) => cell.row.flatIndex.toString(),
        },
        {
            title: '',
            transform: (cell) => this.createTooltipButton(cell),
            width: 50,
        },
        {
            field: 'name',
            title: 'Name',
            width: 100,
        },
        {
            field: 'email',
            title: 'Email',
            width: 200,
        },
        {
            field: 'phone',
            title: 'Phone',
            width: 100,
        },
        {
            field: 'address',
            title: 'Address',
            width: 250,
        },
        {
            field: 'company',
            title: 'Company',
            width: 200,
        },
        {
            field: 'jobTitle',
            title: 'Job Title',
            width: 200,
        },
        {
            field: 'birthday',
            title: 'Birthday',
            width: 150,
        },
        {
            field: 'website',
            title: 'Website',
            width: 200,
        },
    ];

    mouse = { x: 0, y: 0 };
    grabPoint = { x: 0, y: 0 };
    dropActionMap = new Map();

    constructor(parentElement) {
        super(Test1.id, parentElement);
    }

    /**
     * 
     */
    execute() {
        this.data = generateRandomContacts(10000, true);

        this.virtualTable = new VirtualTable(this.table, this.columnsDef, {
            columnSizeInPercentage: false,
            allowRowSelection: true,
            stickyHeader: true,
        });

        this.virtualTable.setData(this.data);
        this.virtualTable.makeDroppable();

        /** @typedef {(any, TableRow<Contact>) => void} */
        this.virtualTable.onDrop = this.onDrop.bind(this);

        this.generateFilterbar();

        this.createDraggableElement('Delete', this.onDeleteActionDrop.bind(this), 'action-delete');
        this.createDraggableElement('Insert next to it', this.onInsertBelowActionDrop.bind(this), 'action-insert-below');
        this.createDraggableElement('Insert children', this.onInsertChildrenActionDrop.bind(this), 'action-insert-children');
        this.createDraggableElement('Update', this.onUpdateActionDrop.bind(this), 'action-update');

        this.createButtonsContainer();
    }

    createButtonsContainer() {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('buttons-container');
        this.container.appendChild(buttonsContainer);

        this.createDeleteAllButton(buttonsContainer);
        this.createScrollToButton(buttonsContainer);
    }

    createDeleteAllButton(buttonsContainer) {
        const deleteAllButton = document.createElement('button');
        deleteAllButton.classList.add('delete-all-button');
        deleteAllButton.textContent = 'Delete All';
        buttonsContainer.appendChild(deleteAllButton);

        deleteAllButton.addEventListener('click', () => {
            this.data = [];
            this.virtualTable.setData(this.data);
        });
    }

    createScrollToButton(buttonsContainer) {
        const scrollToButton = document.createElement('button');
        scrollToButton.classList.add('scroll-to-button');
        scrollToButton.textContent = 'Scroll to 5000';
        buttonsContainer.appendChild(scrollToButton);

        scrollToButton.addEventListener('click', () => {
            this.virtualTable.scrollTo(5000);
        });
    }

    /**
     * 
     */
    generateFilterbar() {
        const filterbar = document.createElement('div');
        filterbar.classList.add('filterbar');
        this.container.insertBefore(filterbar, this.container.firstChild);

        const filterInput = document.createElement('input');
        filterInput.classList.add('filter-input');
        filterInput.type = 'text';
        filterInput.placeholder = 'Search...';
        filterbar.appendChild(filterInput);

        filterInput.addEventListener('input', this.onFilterInput.bind(this));

        const filterFieldSelect = document.createElement('select');
        filterFieldSelect.classList.add('filter-field-select');

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'By Field';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        filterFieldSelect.appendChild(defaultOption);

        const fields = Object.keys(this.data[0] || {});

        fields.forEach(field => {
            const option = document.createElement('option');
            option.value = field;
            option.textContent = field.charAt(0).toUpperCase() + field.slice(1);
            filterFieldSelect.appendChild(option);
        });

        filterbar.appendChild(filterFieldSelect);

        filterFieldSelect.addEventListener('change', this.onFilterFieldChange.bind(this));
    }

    /**
     * 
     */
    onFilterInput(event) {
    }

    /**
     * 
     */
    onFilterFieldChange(event) {
    }

    /**
     * 
     * @param {string} caption 
     * @param {(data: any, row: any) => void} action 
     * @param {string} className
     */
    createDraggableElement(caption, action, className = '') {
        const draggableDiv = document.createElement('div');
        draggableDiv.classList.add('draggable-div', className);
        draggableDiv.textContent = caption;
        draggableDiv.setAttribute('draggable', 'true');


        let draggableDivContainer = document.querySelector('.draggable-container');
        
        if (!draggableDivContainer) {
            draggableDivContainer = document.createElement('div');
            draggableDivContainer.classList.add('draggable-container');
            this.container.appendChild(draggableDivContainer);
        }

        draggableDivContainer.appendChild(draggableDiv);

        draggableDiv.addEventListener('dragstart', e => this.onDragStart(e, action.name));
        this.dropActionMap.set(Symbol.for(action.name), action);
    }

    /**
     * 
     */
    onDrop(data, row) {
        console.log('Dropped data:', data);
        console.log('Dropped row:', row);

        const action = this.dropActionMap.get(Symbol.for(data));

        action?.(data, row);
    }

    /**
     * when start dragging the div, create a clone and move the clone to the mouse position when dragging
     * @param {DragEvent} event
     * @param {string} actionId
     */
    onDragStart(event, actionId) {
        const clone = event.target.cloneNode(true);
        clone.id = 'clone';

        const bounds = event.target.getBoundingClientRect();

        this.grabPoint.x = event.clientX - bounds.left;
        this.grabPoint.y = event.clientY - bounds.top;

        event.dataTransfer.dropEffect = "copy";
        event.dataTransfer.setDragImage(new Image(), 0, 0);
        event.dataTransfer.setData('text/plain', actionId);

        document.body.addEventListener('drag', this.onDrag.bind(this));
        document.addEventListener('dragend', this.onDragEnd.bind(this), { once: true });
        document.addEventListener('dragover', this.onDragOver.bind(this));

        clone.style.opacity = '0';
        clone.style.animation = 'fadeIn 0.1s 0.05s forwards';
        document.body.appendChild(clone);
    }
    
    /**
     * 
     */
    onDrag(event) {
        const clone = document.getElementById('clone');
        
        if (clone) {
            const x = this.mouse.x - this.grabPoint.x;
            const y = this.mouse.y - this.grabPoint.y;

            clone.style.transform = `translate(${x}px, ${y}px)`;
        }
    }

    /**
     * 
     */
    onDragEnd(event) {
        document.body.removeEventListener('drag', this.onDrag.bind(this));
        document.removeEventListener('dragover', this.onDragOver.bind(this));

        const clone = document.getElementById('clone');
        
        if (clone) {
            clone.style.animation = '';
            clone.style.opacity = '0';
            clone.remove();
            this.grabPoint.x = 0;
            this.grabPoint.y = 0;
        }
    }

    /**
     * 
     */
    onDragOver(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }

    /**
     * 
     */
    onDeleteActionDrop(data, row) {
        if(!row) {
            return;
        }

        const nodeId = row.ref.data.id;
        this.virtualTable.deleteNode(nodeId);
    }

    /**
     * 
     */
    onInsertBelowActionDrop(data, row) {
        if(!row) {
            const nodes = this.virtualTable.getNodes();
            const lastNodeId = nodes[nodes.length - 1]?.data.id;
            row = { ref: { data: { id: lastNodeId } } };
        }

        const nodeId = row.ref.data.id;
        const randomCount = Math.floor(Math.random() * 5) + 1;
        const nodes = generateRandomContacts(randomCount, Math.random() >= 0.5);
        this.virtualTable.addNodes(nodeId, false, nodes);
    }

    /**
     * 
     */
    onInsertChildrenActionDrop(data, row) {
        if(!row) {
            const nodes = this.virtualTable.getNodes();
            const lastNodeId = nodes[nodes.length - 1]?.data.id;
            row = { ref: { data: { id: lastNodeId } } };
        }

        const nodeId = row.ref.data.id;
        const randomCount = Math.floor(Math.random() * 5) + 1;
        const nodes = generateRandomContacts(randomCount, Math.random() >= 0.5);
        this.virtualTable.addNodes(nodeId, true, nodes);
    }

    /**
     * 
     */
    onUpdateActionDrop(data, row) {
        if(!row) {
            return;
        }

        const nodeId = row.ref.data.id;
        const newNodeData = generateRandomContacts(1)[0];

        newNodeData.id = nodeId;
        delete newNodeData.children;

        this.virtualTable.updateNode(newNodeData);
    }


    /**
     * 
     * @param {*} cell 
     * @returns {HTMLButtonElement}
     */
    createTooltipButton(cell) {
        return `<button class="btn-tooltip" onclick="alert('Row: ' + ${cell.rowIndex})" title="Row: ${cell.rowIndex}">`
                + `<span></span>`
                + `<span></span>`
                + `<span></span>`
            + `</button>`;
    }
}