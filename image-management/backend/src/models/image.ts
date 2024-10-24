import { ImageStatus } from '@ndhcode/common';
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface ImageAttrs {
  filename: string;
  published_url: string | undefined;
  published_status: ImageStatus;
  ticketId: string;
}

export interface ImageDoc extends mongoose.Document {
  filename: string;
  published_url: string | undefined;
  version: number;
  published_status: ImageStatus;
  ticketId: string;
}

interface ImageModel extends mongoose.Model<ImageDoc> {
  build(attrs: ImageAttrs): ImageDoc;
  findByEvent(event: { id: string; version: number }): Promise<ImageDoc | null>;
}

const ImageSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    published_url: {
      type: String,
      required: false,
    },
    publishedStatus: {
      type: String,
      required: true,
      enum: Object.values(ImageStatus),
      default: ImageStatus.Created,
    },
    ticketId: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

ImageSchema.set('versionKey', 'version');
ImageSchema.plugin(updateIfCurrentPlugin);

ImageSchema.statics.build = (attrs: ImageAttrs) => {
  return new Image(attrs);
};

// Method to find Image by id and previous version
ImageSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Image.findOne({ _id: event.id, version: event.version - 1 });
};

const Image = mongoose.model<ImageDoc, ImageModel>('Image', ImageSchema);

export { Image };
