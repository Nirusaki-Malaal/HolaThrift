import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { getEnv } from '../config/env';
import { IntegrationConfigError } from './integrationError';

let configuredKey = '';

const getCloudinaryConfig = () => ({
  cloud_name: getEnv('CLOUDINARY_CLOUD_NAME'),
  api_key: getEnv('CLOUDINARY_API_KEY'),
  api_secret: getEnv('CLOUDINARY_API_SECRET'),
});

export const isCloudinaryConfigured = (): boolean => {
  const config = getCloudinaryConfig();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

const getCloudinaryClient = () => {
  const config = getCloudinaryConfig();
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    throw new IntegrationConfigError('Cloudinary credentials are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  const nextKey = `${config.cloud_name}:${config.api_key}:${config.api_secret.length}`;
  if (nextKey !== configuredKey) {
    cloudinary.config(config);
    configuredKey = nextKey;
  }

  return cloudinary;
};

export const uploadImageDataUri = async (dataUri: string, options: UploadApiOptions): Promise<UploadApiResponse> => {
  const client = getCloudinaryClient();
  return await client.uploader.upload(dataUri, options);
};
