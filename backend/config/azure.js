const { BlobServiceClient } = require('@azure/storage-blob');

let blobServiceClient;

const initializeAzureStorage = () => {
  try {
    if (!blobServiceClient) {
      blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
      console.log('Azure Blob Storage client initialized');
    }
    return blobServiceClient;
  } catch (error) {
    console.error('Azure Storage initialization failed:', error);
    throw error;
  }
};

const getAzureClient = () => {
  if (!blobServiceClient) {
    return initializeAzureStorage();
  }
  return blobServiceClient;
};

module.exports = {
  initializeAzureStorage,
  getAzureClient
};
