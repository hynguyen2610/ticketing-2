import React from 'react';
import { Table, Button } from 'react-bootstrap';

const ImageList = ({ images, handlePublish }) => {
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
                        <th>Ticket id</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {images.map((image) => (
                        <tr key={image.id}>
                            <td>{image.id}</td>
                            <td>
                                <a href={`/uploads/${image.filename}`} target="_blank" rel="noopener noreferrer">
                                    {image.filename}
                                </a>
                            </td>
                            <td>{image.publishedStatus}</td>
                            <td>
                                {image.publishedStatus === 'published' ? (
                                    <a href={image.publishedUrl} target="_blank" rel="noopener noreferrer">
                                        {image.publishedUrl}
                                    </a>
                                ) : (
                                    'N/A'
                                )}
                            </td>
                            <td>{image.ticketId}</td>
                            <td>
                                {image.publishedStatus !== 'published' && (
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
};

export default ImageList;
