const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { getAzureClient } = require('../config/azure');

class AzureBlobService {
  constructor() {
    this.blobServiceClient = getAzureClient();
  }

  // Upload file to Azure Blob Storage
  async uploadFile(containerName, fileName, fileBuffer, contentType) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      
      // Ensure container exists
      await containerClient.createIfNotExists({
        access: 'blob'
      });

      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      const uploadResult = await blockBlobClient.upload(
        fileBuffer,
        fileBuffer.length,
        {
          blobHTTPHeaders: {
            blobContentType: contentType
          }
        }
      );

      return {
        success: true,
        url: blockBlobClient.url,
        uploadResult
      };
    } catch (error) {
      console.error('Azure Blob upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete file from Azure Blob Storage
  async deleteFile(containerName, fileName) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      const deleteResult = await blockBlobClient.delete();

      return {
        success: true,
        deleteResult
      };
    } catch (error) {
      console.error('Azure Blob delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate signed URL for secure access
  async generateSasUrl(containerName, fileName, expiryMinutes = 60) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + expiryMinutes);

      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: 'r', // read permission
        expiresOn: expiryDate
      });

      return {
        success: true,
        sasUrl
      };
    } catch (error) {
      console.error('Azure Blob SAS URL generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List files in container
  async listFiles(containerName, prefix = '') {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      
      const files = [];
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        files.push({
          name: blob.name,
          url: `${containerClient.url}/${blob.name}`,
          lastModified: blob.properties.lastModified,
          contentLength: blob.properties.contentLength,
          contentType: blob.properties.contentType
        });
      }

      return {
        success: true,
        files
      };
    } catch (error) {
      console.error('Azure Blob list files error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AzureBlobService();
