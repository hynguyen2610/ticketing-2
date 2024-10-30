import React, { useEffect, useState } from 'react';
import { Table, Button } from 'react-bootstrap';

function App() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('https://ticketing.dev/api/images');
        const data = await response.json();
        setImages(data); // Assuming data is the array of images
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  const handlePublish = (id) => {
    // Implement publish logic here
    console.log(`Publishing image with ID: ${id}`);
  };

  return (
    <div className="container mt-5">
      <h1>Image List</h1>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Id</th>
            <th>Filename</th>
            <th>Published Status</th>
            <th>Published URL</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {images.map((image) => (
            <tr key={image.id}>
              <td>{image.id}</td>
              <td>{image.filename}</td>
              <td>{image.publishedStatus}</td>
              <td>
                {image.publishedStatus === 'Published' ? (
                  <a href={image.publishedUrl} target="_blank" rel="noopener noreferrer">
                    {image.publishedUrl}
                  </a>
                ) : (
                  'N/A'
                )}
              </td>
              <td>
                {image.publishedStatus !== 'Published' && (
                  <Button 
                    variant="primary" 
                    onClick={() => handlePublish(image.id)}
                  >
                    Publish
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default App;
