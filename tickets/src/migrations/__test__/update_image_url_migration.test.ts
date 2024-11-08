import UpdateImageUrlMigration from '../2024_11_01/update_image_url_migration';
import { Ticket } from '../../models/ticket';
import axios from 'axios';

jest.mock('axios');
jest.mock('../../models/ticket'); // Mock the Ticket model

describe('UpdateImageUrlMigration', () => {
  let migration: UpdateImageUrlMigration;

  // Define mock image data globally for reuse
  const mockImages = [
    { ticketId: '1', filename: 'image1.png', publishedUrl: 'https://new-url.com/image1.png' },
    { ticketId: '2', filename: 'image2.jpg', publishedUrl: 'https://new-url.com/image2.jpg' },
  ];

  // Create mocked tickets with mocked `save` functions
  const mockTicket1 = {
    id: '1',
    images: ['image1.png'],
    save: jest.fn().mockResolvedValue(true), // Mock save function
  };

  const mockTicket2 = {
    id: '2',
    images: ['image2.jpg'],
    save: jest.fn().mockResolvedValue(true), // Mock save function
  };

  const mockTickets = [mockTicket1, mockTicket2];

  beforeEach(() => {
    migration = new UpdateImageUrlMigration();

    // Mock Ticket.find to return the appropriate mocked ticket by id
    Ticket.find = jest.fn().mockImplementation(() => {
      return Promise.resolve(mockTickets);
    });

    // Mock axios to return the image data
    axios.get = jest.fn().mockResolvedValue({ data: mockImages });
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test to avoid cross-test pollution
  });

  describe('applyMigration', () => {
    it('should update ticket images with correct URLs', async () => {
      // Run the migration
      await migration.applyMigration();

      // Assertions
      expect(axios.get).toHaveBeenCalledWith('https://ticketing.dev/api/images');
      expect(Ticket.find).toHaveBeenCalledTimes(1);

      // Ensure that the ticket images are updated with the correct URLs
      expect(mockTicket1.images).toEqual(['https://new-url.com/image1.png']);
      expect(mockTicket2.images).toEqual(['https://new-url.com/image2.jpg']);

      // Ensure save method was called for each ticket
      expect(mockTicket1.save).toHaveBeenCalledTimes(1);
      expect(mockTicket2.save).toHaveBeenCalledTimes(1);

      // Ensure save was called with the updated images for both tickets
      expect(mockTicket1.save).toHaveBeenCalledWith();
      expect(mockTicket2.save).toHaveBeenCalledWith();

      // Check that the images in the tickets were updated correctly
      expect(mockTicket1.images).toEqual(['https://new-url.com/image1.png']);
      expect(mockTicket2.images).toEqual(['https://new-url.com/image2.jpg']);
    });

    it('should not modify image if it already contains a valid URL', async () => {
      const mockTicketsWithValidUrls = [
        { id: '1', images: ['https://someurl.com/image1.png'], save: jest.fn().mockResolvedValue(true) },
        { id: '2', images: ['https://someurl.com/image2.jpg'], save: jest.fn().mockResolvedValue(true) },
      ];

      Ticket.find = jest.fn().mockResolvedValue(mockTicketsWithValidUrls);

      // Run the migration
      await migration.applyMigration();

      // Ensure the URLs weren't changed because they are already valid
      expect(mockTicketsWithValidUrls[0].images).toEqual(['https://someurl.com/image1.png']);
      expect(mockTicketsWithValidUrls[1].images).toEqual(['https://someurl.com/image2.jpg']);

      // Ensure save was NOT called, because the images were already valid
      expect(mockTicketsWithValidUrls[0].save).not.toHaveBeenCalled();
      expect(mockTicketsWithValidUrls[1].save).not.toHaveBeenCalled();
    });

    it('should handle missing images gracefully', async () => {
      const imagesFromDatabase = [
        { id: '1', images: ['image1.png'], save: jest.fn().mockResolvedValue(true) },
        { id: '2', images: ['image2.jpg'], save: jest.fn().mockResolvedValue(true) },
      ];

      const mockImagesFromImageManagement = [
        { ticketId: '1', filename: 'image1.png', publishedUrl: 'https://new-url.com/image1.png' },
      ]; // Missing image for ticket 2

      Ticket.find = jest.fn().mockResolvedValue(imagesFromDatabase);

      // Mock axios to return image data with one missing
      axios.get = jest.fn().mockResolvedValue({ data: mockImagesFromImageManagement });

      await migration.applyMigration();

      // Check if the URL for ticket 1 is updated and ticket 2 remains unchanged
      expect(imagesFromDatabase[0].images).toEqual(['https://new-url.com/image1.png']);
      expect(imagesFromDatabase[1].images).toEqual(['image2.jpg']); // This stays the same

      // Ensure save was called for both tickets, even though one had no image match
      expect(imagesFromDatabase[0].save).toHaveBeenCalledTimes(1);
      expect(imagesFromDatabase[1].save).toHaveBeenCalledTimes(0);
    });
  });

  describe('undoMigration', () => {
    it('should throw an error', () => {
      expect(() => migration.undoMigration()).toThrowError('Method not implemented.');
    });
  });
});
