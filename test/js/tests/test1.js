import { VirtualTable, } from "../../../src/VirtualTable.ts";
import { createTestContainer } from "../utils";
import { generateRandomContacts } from "../faker.js";

export default function($container) {
    const container = createTestContainer($container);

    const data = generateRandomContacts(100000);
    console.log(data);

    const tableContainer = document.createElement('div');
    tableContainer.id = 'table-container';
    container.appendChild(tableContainer);


    /* ------- */
    
    /** @typedef {ColumnDef<Contact>[]} */
    const columnsDef = [
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
        }
    ];


    /* ------- */

    const virtualTable = new VirtualTable(tableContainer, columnsDef, {
        columnSizeInPercentage: false,
        allowRowSelection: true,
        stickyHeader: true,
    });

    virtualTable.setData(data);
    virtualTable.makeDroppable();

    /** @typedef {(any, TableRow<Contact>) => void} */
    virtualTable.onDrop = (data, row) => {
        console.log('Dropped data:', data);
        console.log('Dropped row:', row);
    };


    // setTimeout(() => {
    //     virtualTable.scrollTo(98000);
    // }, 1000);



    /* ------ */

    const draggableDiv = document.createElement('div');
    draggableDiv.classList.add('draggable-div');
    draggableDiv.textContent = 'Drag me over the table!';
    draggableDiv.setAttribute('draggable', 'true');
    container.appendChild(draggableDiv);

    const mouse = { x: 0, y: 0 };
    const grabPoint = { x: 0, y: 0 };

    // when start dragging the div, create a clone and move the clone to the mouse position when dragging
    draggableDiv.addEventListener('dragstart', (event) => {
        const clone = draggableDiv.cloneNode(true);
        clone.id = 'clone';

        const bounds = draggableDiv.getBoundingClientRect();

        grabPoint.x = event.clientX - bounds.left;
        grabPoint.y = event.clientY - bounds.top;

        event.dataTransfer.dropEffect = "copy";
        event.dataTransfer.setDragImage(new Image(), 0, 0);

        document.body.addEventListener('drag', onDrag);
        document.addEventListener('dragend', onDragEnd, { once: true });
        document.addEventListener('dragover', onDragOver);


        clone.style.opacity = '0';
        clone.style.animation = 'fadeIn 0.1s 0.05s forwards';
        document.body.appendChild(clone);
    });
    

    function onDrag(event) {
        const clone = document.getElementById('clone');
        
        if (clone) {
            const x = mouse.x - grabPoint.x;
            const y = mouse.y - grabPoint.y;

            clone.style.transform = `translate(${x}px, ${y}px)`;
        }
    }

    function onDragEnd(event) {
        document.body.removeEventListener('drag', onDrag);
        document.removeEventListener('dragover', onDragOver);

        const clone = document.getElementById('clone');
        
        if (clone) {
            clone.style.animation = '';
            clone.style.opacity = '0';
            clone.remove();
            grabPoint.x = 0;
            grabPoint.y = 0;
        }
    }

    function onDragOver(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    }
}