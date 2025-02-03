import { useEffect, useState } from 'react';
import ImageList from './components/image-list';

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

  const handlePublish = async (id) => {
    try {
      const response = await fetch(`https://ticketing.dev/api/images/${id}/publish`,
        { method: 'PUT', });
      if (response.ok) {
        console.log(`Successfully published image with ID: ${id}`);
      }
      else {
        console.error('Failed to publish the image:', response.statusText);
      }
    }
    catch (error) {
      console.error('Error publishing the image:', error);
    }
  };

  return (
    <ImageList images={images} handlePublish={handlePublish} />
  );
}

export default App;
