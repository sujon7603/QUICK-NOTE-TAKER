

window.addEventListener('DOMContentLoaded', async () => {
    const textarea = document.getElementById('note');
    const savebtn = document.getElementById('save');
    const deleteBtn = document.getElementById('deleteBtn');

    // Load saved note on startup 
    const savedNote = await window.electronAPI.loadNote();
    textarea.value = savedNote;

    savebtn.addEventListener('click', async () => {
        await window.electronAPI.saveNote(textarea.value);
        alert('Note saved successfully!');
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
            alert('Delete Failed!');
        }
    }
});

});


