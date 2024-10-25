export interface ImageData {
  id: string;
  filename: string;
  href: string;
  publishedStatus: string;
}

export const dummyImages: ImageData[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    filename: 'Image 1',
    href: 'https://via.placeholder.com/150',
    publishedStatus: 'Published',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    filename: 'Image 2',
    href: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Image2',
    publishedStatus: 'Published',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    filename: 'Image 3',
    href: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Image3',
    publishedStatus: 'Published',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    filename: 'Image 4',
    href: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=Image4',
    publishedStatus: 'Published',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d483',
    filename: 'Image 5',
    href: 'https://via.placeholder.com/150/FFFF00/000000?text=Image5',
    publishedStatus: 'Published',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d484',
    filename: 'Image 6',
    href: 'https://via.placeholder.com/150/00FFFF/000000?text=Image6',
    publishedStatus: 'Draft',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d485',
    filename: 'Image 7',
    href: 'https://via.placeholder.com/150/FF00FF/FFFFFF?text=Image7',
    publishedStatus: 'Draft',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d486',
    filename: 'Image 8',
    href: 'https://via.placeholder.com/150/FFFFFF/000000?text=Image8',
    publishedStatus: 'Published',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d487',
    filename: 'Image 9',
    href: 'https://via.placeholder.com/150/000000/FFFFFF?text=Image9',
    publishedStatus: 'Published',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d488',
    filename: 'Image 10',
    href: 'https://via.placeholder.com/150/808080/FFFFFF?text=Image10',
    publishedStatus: 'Draft',
  },
];
