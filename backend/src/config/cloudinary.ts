import { v2 as cloudinary } from 'cloudinary';

const cloudinaryClient = cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export const getCloudinary = () => {
    if (!cloudinaryClient.cloud_name || !cloudinaryClient.api_key || !cloudinaryClient.api_secret) {
        throw new Error('Cloudinary environment variables are not configured');
    }
    return cloudinary;
};

export default cloudinary;
