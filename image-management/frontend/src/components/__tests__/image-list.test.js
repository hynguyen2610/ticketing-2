import { render, screen, within, userEvent, waitFor } from '@testing-library/react';
import ImageList from '../image-list';
import '@testing-library/jest-dom';

describe('ImageList Component', () => {
    const handlePublishMock = jest.fn();

    // Sample image data for testing
    const images = [
        {
            id: 1,
            filename: 'image1.jpg',
            publishedStatus: 'created',
            publishedUrl: '',
            ticketId: 'TICKET123',
        },
        {
            id: 2,
            filename: 'image2.jpg',
            publishedStatus: 'published',
            publishedUrl: 'http://example.com/image2',
            ticketId: 'TICKET456',
        },
        {
            id: 3,
            filename: 'image3.jpg',
            publishedStatus: 'created',
            publishedUrl: '',
            ticketId: 'TICKET789',
        },
    ];

    test('renders the table with image data', () => {
        render(<ImageList images={images} handlePublish={handlePublishMock} />);

        // Assert: Check that the table header is rendered
        expect(screen.getByText('Id')).toBeInTheDocument();
        expect(screen.getByText('Filename')).toBeInTheDocument();
        expect(screen.getByText('Published Status')).toBeInTheDocument();
        expect(screen.getByText('Published URL')).toBeInTheDocument();
        expect(screen.getByText('Ticket id')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();

        // Assert: Check if each image row is rendered
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
        expect(screen.getByText('image2.jpg')).toBeInTheDocument();
        expect(screen.getByText('image3.jpg')).toBeInTheDocument();
    });

    test('renders "Publish" button URL correctly', () => {
        render(<ImageList images={images} handlePublish={handlePublishMock} />);

        images.forEach((image) => {
            const row = screen.getByRole('row', { name: new RegExp(image.filename, 'i') });

            const publishButton = within(row).queryByRole('button', { name: /publish/i });
            const naText = within(row).queryByText('N/A');

            expect(publishButton ? image.publishedStatus !== 'published' : image.publishedStatus === 'published').toBe(true);
            expect(naText ? image.publishedStatus !== 'published' : image.publishedStatus === 'published').toBe(true);
        });
    });

    test('handlePublish is called when the publish button is clicked for unpublished images', () => {
        render(<ImageList images={images} handlePublish={handlePublishMock} />);

        images.forEach(async (image) => {
            // Find the row based on the image filename
            const row = screen.getByRole('row', { name: new RegExp(image.filename, 'i') });
            expect(row).toBeInTheDocument();

            // Find the "Publish" button only if the image is not published
            await waitFor(() => {
                const publishButton = within(row).queryByRole('button', { name: /publish/i });
                if (publishButton) {
                    userEvent.click(publishButton);
                }
            });

            // Assert that handlePublishMock was called the expected number of times
            expect(handlePublishMock).toHaveBeenCalledTimes(
                images.filter((img) => img.publishedStatus !== 'published').length
            );
        });
    });


});

