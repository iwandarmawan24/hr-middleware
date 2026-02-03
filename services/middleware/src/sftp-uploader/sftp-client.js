const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

class SFTPUploader {
  constructor() {
    this.sftp = new SftpClient();
    this.connected = false;
  }

  /**
   * Connect to SFTP server
   */
  async connect() {
    try {
      if (config.features.skipUpload) {
        logger.warn('SFTP upload is disabled in config');
        return;
      }

      const connectionConfig = {
        host: config.sftp.host,
        port: config.sftp.port,
        username: config.sftp.username
      };

      // Use password or private key
      if (config.sftp.privateKey) {
        connectionConfig.privateKey = config.sftp.privateKey;
      } else {
        connectionConfig.password = config.sftp.password;
      }

      await this.sftp.connect(connectionConfig);
      this.connected = true;
      logger.info('Connected to SFTP server', { host: config.sftp.host });
    } catch (error) {
      logger.error('SFTP connection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Upload file to SFTP
   */
  async uploadFile(localPath, remotePath) {
    try {
      if (config.features.skipUpload) {
        logger.warn(`Skipping upload (disabled in config): ${localPath}`);
        return remotePath;
      }

      if (!this.connected) {
        await this.connect();
      }

      // Ensure remote directory exists
      const remoteDir = path.dirname(remotePath);
      await this.ensureRemoteDir(remoteDir);

      await this.sftp.put(localPath, remotePath);
      logger.info(`File uploaded to SFTP: ${remotePath}`);

      return remotePath;
    } catch (error) {
      logger.error('SFTP upload failed', { error: error.message, localPath, remotePath });
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files) {
    const results = [];

    for (const { localPath, remotePath } of files) {
      try {
        const result = await this.uploadFile(localPath, remotePath);
        results.push({ localPath, remotePath: result, status: 'success' });
      } catch (error) {
        logger.error(`Failed to upload ${localPath}`, { error: error.message });
        results.push({ localPath, remotePath, status: 'failed', error: error.message });
      }
    }

    return results;
  }

  /**
   * Upload file with trigger file (.ok)
   */
  async uploadWithTrigger(localPath, remotePath) {
    try {
      // Upload main file
      await this.uploadFile(localPath, remotePath);

      // Create and upload .ok trigger file
      const okPath = `${remotePath}.ok`;
      await this.sftp.put(Buffer.from(''), okPath);
      logger.info(`Trigger file uploaded: ${okPath}`);

      return { filePath: remotePath, triggerPath: okPath };
    } catch (error) {
      logger.error('Failed to upload with trigger', { error: error.message });
      throw error;
    }
  }

  /**
   * List files in remote directory
   */
  async listFiles(remotePath) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      const files = await this.sftp.list(remotePath);
      return files;
    } catch (error) {
      logger.error('Failed to list files', { error: error.message, remotePath });
      throw error;
    }
  }

  /**
   * Ensure remote directory exists
   */
  async ensureRemoteDir(remotePath) {
    try {
      const exists = await this.sftp.exists(remotePath);
      if (!exists) {
        await this.sftp.mkdir(remotePath, true);
        logger.info(`Created remote directory: ${remotePath}`);
      }
    } catch (error) {
      logger.error('Failed to ensure remote directory', { error: error.message, remotePath });
      throw error;
    }
  }

  /**
   * Disconnect from SFTP server
   */
  async disconnect() {
    try {
      if (this.connected) {
        await this.sftp.end();
        this.connected = false;
        logger.info('Disconnected from SFTP server');
      }
    } catch (error) {
      logger.error('SFTP disconnect error', { error: error.message });
    }
  }
}

module.exports = SFTPUploader;
