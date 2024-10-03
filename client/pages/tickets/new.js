import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const NewTicket = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);

    files.forEach((file) => {
      formData.append('images', file);
    });

    fetch('/api/tickets', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        // Reset the form after submission
        setTitle(''); // Corrected from setName to setTitle
        setPrice('');
        setFiles([]);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error uploading ticket.');
      });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const onBlur = () => {
    const value = parseFloat(price);
    if (!isNaN(value)) {
      setPrice(value.toFixed(2));
    }
  };

  return (
    <div>
      <h1>Create a Ticket</h1>
      <form onSubmit={handleSubmit} encType='multipart/form-data'>
        <div className="form-group">
          <label>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
            required // Optional: Make the title required
          />
        </div>
        <div className="form-group">
          <label>Price</label>
          <input
            type="text" // Make sure to specify type
            value={price}
            onBlur={onBlur}
            onChange={(e) => setPrice(e.target.value)}
            className="form-control"
            required // Optional: Make the price required
          />
        </div>
        <div className='form-group'>
          <label>Images:</label>
          <div {...getRootProps({ className: 'dropzone' })}>
            <input {...getInputProps()} />
            <p>Drag 'n' drop some files here, or click to select files</p>
          </div>
          <aside>
            <h4>Files</h4>
            <ul>
              {files.map((file) => (
                <li key={file.path}>{file.path} - {file.size} bytes</li>
              ))}
            </ul>
          </aside>
        </div>
        <button className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
};

export default NewTicket;
