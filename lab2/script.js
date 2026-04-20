const addBtn = document.getElementById('addBtn');
const taskInput = document.getElementById('taskInput');
const importance = document.getElementById('importance');

const searchInput = document.getElementById('searchInput');
const caseInsensitiveCheckbox = document.getElementById('caseInsensitiveCheckbox');

const undoBtn = document.getElementById('undoBtn');
const modal = document.getElementById('deleteConfirmation');
const modalText = document.getElementById('modal-text');
const confirmDel = document.getElementById('confirmDel');
const cancelDel = document.getElementById('cancelDel');

let toDelete = null;
let lastDeleted = null;

addBtn.addEventListener('click', function() {
    const taskText = taskInput.value;

    if (taskText==="") {
        alert("Zadanie nie może być puste!");
        return;
    }

    const category = importance.value;
    const targetList = document.getElementById('list-' + category);

    const listElement = document.createElement('li');
    
    const tekstSpan = document.createElement('span');
    tekstSpan.textContent = taskText;
    
    const dataSpan = document.createElement('span');
    dataSpan.className = 'task-date';

    const buttonX = document.createElement('button');
    buttonX.textContent = " X ";
    buttonX.style.marginLeft = "10px";

    listElement.appendChild(tekstSpan);
    listElement.appendChild(dataSpan);
    listElement.appendChild(buttonX);

    targetList.appendChild(listElement);

    taskInput.value = "";



    tekstSpan.addEventListener('click', function() {
        listElement.classList.toggle('done');

        if (listElement.classList.contains('done')) {
            const today = new Date();
            dataSpan.textContent = " (" + today.toLocaleString() + ")";
        } else {
            dataSpan.textContent = ""; 
        }
    });

    buttonX.addEventListener('click', function() {
        modalText.textContent = "Czy na pewno chcesz usunąć zadanie: " + taskText + "?";
        modal.style.display = "block";
        toDelete = listElement;
    });
});



confirmDel.addEventListener('click', function() {
    if (toDelete !== null) {
        lastDeleted = {
            element: toDelete,
            parent: toDelete.parentElement
        };

        toDelete.remove();

        undoBtn.disabled = false;

        modal.style.display = "none";
        toDelete = null;
    }
});

cancelDel.addEventListener('click', function() {
    modal.style.display = "none";
    toDelete = null;
});


undoBtn.addEventListener('click', function() {
    if (lastDeleted !== null) {
        lastDeleted.parent.appendChild(lastDeleted.element);

        undoBtn.disabled = true;
        lastDeleted = null;
    }
});


function listFilter() {
    const searchedText = searchInput.value;
    const ignoreUppercase = caseInsensitiveCheckbox.checked;

    const allTasks = document.querySelectorAll('#Lists li');

    allTasks.forEach(function(task) {
        let taskText = task.querySelector('span').textContent;
        let searched = searchedText;

        if (ignoreUppercase === true) {
            taskText = taskText.toLowerCase();
            searched = searched.toLowerCase();
        }

        if (taskText.includes(searched)) {
            task.style.display = "list-item";
        } else {
            task.style.display = "none"; 
        }
    });
}

searchInput.addEventListener('keyup', listFilter);
caseInsensitiveCheckbox.addEventListener('change', listFilter);


const allHeadings = document.querySelectorAll('#Lists h3');

allHeadings.forEach(function(heading) {
    heading.style.cursor = "pointer";

    heading.addEventListener('click', function() {
        const nextList = heading.nextElementSibling;
        
        if (nextList.style.display === "none") {
            nextList.style.display = "block";
        } else {
            nextList.style.display = "none";
        }
    });
});