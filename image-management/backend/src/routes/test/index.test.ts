import request from 'supertest';
import express from 'express';
import { Image } from '../../models/image';
import { indexImagesRouter } from '../../routes/index';

// Create an instance of Express app and use the router
const app = express();
app.use(indexImagesRouter);

// Mock the Image model
jest.mock('../../models/image');

describe('GET /api/images', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should return all images when no query params are provided', async () => {
    // Arrange
    const mockImages = [
      { _id: '1', title: 'Image 1', publishStatus: 'draft' },
      { _id: '2', title: 'Image 2', publishStatus: 'published' },
    ];

    (Image.find as jest.Mock).mockResolvedValue(mockImages);

    // Act
    const response = await request(app).get('/api/images');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockImages);
    expect(Image.find).toHaveBeenCalledWith({});
  });

  it('should return only published images when the "published" query param is set', async () => {
    // Arrange
    const mockPublishedImages = [
      { _id: '2', title: 'Image 2', publishStatus: 'published' },
    ];

    (Image.find as jest.Mock).mockResolvedValue(mockPublishedImages);

    // Act
    const response = await request(app).get('/api/images').query({ published: 'true' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockPublishedImages);
    expect(Image.find).toHaveBeenCalledWith({ publishStatus: 'published' });
  });

  it('should return a 500 error if there is a database error', async () => {
    // Arrange
    (Image.find as jest.Mock).mockRejectedValue(new Error('Database Error'));

    // Act
    const response = await request(app).get('/api/images');

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch images' });
  });
});
