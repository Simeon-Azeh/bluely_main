import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    type: 'prediction' | 'reminder' | 'medication' | 'insight' | 'achievement' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    data?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        firebaseUid: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['prediction', 'reminder', 'medication', 'insight', 'achievement', 'system'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        data: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

NotificationSchema.index({ firebaseUid: 1, createdAt: -1 });
NotificationSchema.index({ firebaseUid: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
