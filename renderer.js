

window.addEventListener('DOMContentLoaded', async () => {
    const textarea = document.getElementById('note');
    const savebtn = document.getElementById('save');
    const deleteBtn = document.getElementById('deleteBtn');
    const statusEl = document.getElementById('save_status');

    // Load saved note on startup 
    const savedNote = await window.electronAPI.loadNote();
    textarea.value = savedNote;
    let lastSavedText = textarea.value;

    savebtn.addEventListener('click', async () => {
        try {
            await window.electronAPI.saveNote(textarea.value);
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
            statusEl.style.coor = 'red';
        }catch(err){
            console.error(err);
            // alert('Delete Failed!');
        }
    }
});

});


