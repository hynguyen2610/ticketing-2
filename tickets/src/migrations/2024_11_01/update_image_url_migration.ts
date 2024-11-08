/**
 * Migration Reason: Some images published in the Iman module were not reflected in the Tickets module due to data mismatches
 * during earlier tests. This migration updates the ticket images to reflect the correct URLs.
 *
 * Practically, this migration is one way, and cannot be rolled back.
 */

import axios from 'axios';
import { Ticket } from '../../models/ticket';
import { BaseMigration } from '../base_migration';

interface ImageManagerResponse {
  ticketId: string;
  filename: string;
  publishedUrl: string;
}

export default class UpdateImageUrlMigration extends BaseMigration {
  id: string = 'update_image_filename_with_url';
  public async applyMigration(): Promise<void> {
    // Fetch all tickets and images from the image manager in parallel
    const [databaseTickets, imageManagerAllImages] = await Promise.all([
      Ticket.find(),
      axios
        .get<ImageManagerResponse[]>('https://ticketing.dev/api/images')
        .then((res) => res.data),
    ]);

    // Create a lookup map for faster image URL retrieval
    const imageLookup = new Map<string, string>(
      imageManagerAllImages.map((image) => [
        `${image.ticketId}:${image.filename}`,
        image.publishedUrl,
      ])
    );

    for (const ticket of databaseTickets) {
      let countUpdated = 0;
      ticket.images = ticket.images?.map((oldImage) => {
        // Replace old filename with the corresponding Imgur URL if it’s not already a URL
        if (!oldImage.startsWith('https://')) {
          const imgurUrl = imageLookup.get(`${ticket.id}:${oldImage}`); // Use the map for fast lookup
          if (imgurUrl) {
            countUpdated++;
          }
          return imgurUrl || oldImage; // Return found URL or original if not found
        }
        return oldImage; // Return unchanged if it's already a valid URL
      });
      if (countUpdated > 0) {
        await ticket.save(); // Save the updated ticket
      }
    }
  }
  public undoMigration(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
