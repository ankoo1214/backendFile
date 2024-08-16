document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    fetch(this.action, {
        method: this.method,
        body: formData
    })
    .then(response => response.text())
    .then(result => {
        document.getElementById('response').innerText =result;
    }) 
    .catch(error => { 
        console.error('Error:', error);
        document.getElementById('response').innerText = 'An error occurred while uploading the image.';
    });
});