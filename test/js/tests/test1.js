import { VirtualTable, } from "../../../src/VirtualTable.ts";
import { Test } from "../Test.js";
import { generateRandomContacts } from "../faker.js";


export class Test1 extends Test {
    static id = 1;
    static description = "100 000 entries for first level, children, drag & drop, basic styling, some options.";

    columnsDef = [
        {
            field: 'id',
            title: 'ID',
            width: 150,
            transform: (cell) => cell.rowIndex.toString(),
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

    constructor(parentElement) {
        super(Test1.id, parentElement);
    }

    execute() {
        const data = generateRandomContacts(100000);
        console.log(data);

        this.virtualTable = new VirtualTable(this.table, this.columnsDef, {
            columnSizeInPercentage: false,
            allowRowSelection: true,
            stickyHeader: true,
        });

        this.virtualTable.setData(data);
        this.virtualTable.makeDroppable();

        /** @typedef {(any, TableRow<Contact>) => void} */
        this.virtualTable.onDrop = this.onDrop.bind(this);

        // setTimeout(() => {
        //     virtualTable.scrollTo(98000);
        // }, 1000);

        this.createDraggableElement();
    }

    createDraggableElement() {
        const draggableDiv = document.createElement('div');
        draggableDiv.classList.add('draggable-div');
        draggableDiv.textContent = 'Drag me over the table!';
        draggableDiv.setAttribute('draggable', 'true');
        this.container.appendChild(draggableDiv);

        draggableDiv.addEventListener('dragstart', this.onDragStart.bind(this));
    }

    onDrop(data, row) {
        console.log('Dropped data:', data);
        console.log('Dropped row:', row);
    }

    // when start dragging the div, create a clone and move the clone to the mouse position when dragging
    onDragStart(event) {
        const clone = event.target.cloneNode(true);
        clone.id = 'clone';

        const bounds = event.target.getBoundingClientRect();

        this.grabPoint.x = event.clientX - bounds.left;
        this.grabPoint.y = event.clientY - bounds.top;

        event.dataTransfer.dropEffect = "copy";
        event.dataTransfer.setDragImage(new Image(), 0, 0);

        document.body.addEventListener('drag', this.onDrag.bind(this));
        document.addEventListener('dragend', this.onDragEnd.bind(this), { once: true });
        document.addEventListener('dragover', this.onDragOver.bind(this));

        clone.style.opacity = '0';
        clone.style.animation = 'fadeIn 0.1s 0.05s forwards';
        document.body.appendChild(clone);
    }
    

    onDrag(event) {
        const clone = document.getElementById('clone');
        
        if (clone) {
            const x = this.mouse.x - this.grabPoint.x;
            const y = this.mouse.y - this.grabPoint.y;

            clone.style.transform = `translate(${x}px, ${y}px)`;
        }
    }

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

    onDragOver(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }
}