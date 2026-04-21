// const { ipcMain } = require("electron");


window.addEventListener('DOMContentLoaded', async () => {
    const textarea = document.getElementById('note');
    const savebtn = document.getElementById('save');
    const deleteBtn = document.getElementById('deleteBtn');
    const statusEl = document.getElementById('save_status');
    const saveAsBtn = document.getElementById('save-as');
    const newNoteBtn = document.getElementById('new-note');
    const openFileBtn = document.getElementById('open-file');

    let currntFilepath = null;

    // Load saved note on startup 
    const savedNote = await window.electronAPI.loadNote();
    textarea.value = savedNote;
    let lastSavedText = textarea.value;

    savebtn.addEventListener('click', async () => {
        try {
            await window.electronAPI.saveNote(textarea.value, currentFilePath);
            lastSavedText = textarea.value;
            statusEl.textContent = "Manuallysaved successfully!";
            alert('Note saved successfully!');
        } catch (err) {
            console.error('Manual save failed:', err);
            statusEl.textContent = "Failed to save note!";
            statusEl.style.color = 'red';
        }
    });

    async function autoSave() {
        const currentText = textarea.value;
        if (currentText === lastSavedText) {
            statusEl.textContent = 'No changes to save';
            return;
        }
        try {
            await window.electronAPI.saveNote(currentText);
            lastSavedText = currentText;
            const now = new Date().toLocaleTimeString();
            statusEl.textContent = `Auto-saved at ${now}`;
        } catch (err) {
            console.error('Auto-save failed:', err);
            statusEl.textContent = 'Auto-save failed';
        }
    }

    let debounceTimer;
    textarea.addEventListener('input', () => {
        statusEl.textContent = 'Changes detected - auto-saving in 5 seconds...';
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(autoSave, 5000);
    });


    deleteBtn.addEventListener('click', async() => {
    if(confirm('Really delete All Notes? This cant be undone!')){
        try{
            await window.electronAPI.deleteNote();
            textarea.value = ' ';
            lastSavedText = ' ';
            statusEl.textContent = "All Notes Deleted!";
            statusEl.style.color = 'red';
        }catch(err){
            console.error(err);
            // alert('Delete Failed!');
        }
        }
    });

    // Save As Button 
    saveAsBtn.addEventListener('click', async() => {
        const result = await window.electronAPI.saveAs(textarea.value);
        if(result.success){
            lastSavedText = textarea.value;
            currentFilePath = result.filePath;
            statusEl.textContent = `saved To: ${result.filePath}`;
        }else{
            statusEl.textContent = 'Save As Cencelled';
        }
    })
    
    // New Note Button 
    newNoteBtn.addEventListener('click', async () => {
        // If no unsaved changes, clear immediately
        if (textarea.value === lastSavedText){
            textarea.value = '';
            lastSavedText = '';
            statusEl.textContent = 'New note strated';
            return;
        }
        // if there are unsaved changes, ask the user first 
        const result = await window.electronAPI.newNote();
        if(result.confirmed){
            textarea.value = '';
            lastSavedText = '';
            statusEl.textContent = 'New note strated';
        }else{
            statusEl.textContent = 'New Note Canceled';
        }
    });

    // Open file button 
    openFileBtn.addEventListener('click', async() => {
        const result = await window.electronAPI.openFile();
        if(result.success){
            textarea.value = result.content;
            lastSavedText = result.content;
            currentFilePath = result.filePath;
            statusEl.textContent = `opened: ${result.filePath}`;
        }else{
            statusEl.textContent = 'Open cencelled';
        }
    });

    // Menu action listenner
    window,electronAPI.onMenuAction('menu-new-note', () => {
        newNoteBtn.click();
    });
    window,electronAPI.onMenuAction('menu-open-note', () => {
        openFileBtn.click();
    });
    window,electronAPI.onMenuAction('menu-save', () => {
        saveBtn.click();
    });
    window,electronAPI.onMenuAction('menu-save-as', () => {
        saveAsBtn.click();
    });

});


