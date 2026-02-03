const openpgp = require('openpgp');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const config = require('../config');

class PGPService {
  constructor() {
    this.publicKey = null;
    this.privateKey = null;
  }

  /**
   * Load PGP keys
   */
  async loadKeys() {
    try {
      if (config.features.skipEncryption) {
        logger.warn('Encryption is disabled in config');
        return;
      }

      // Load public key
      if (config.encryption.pgpPublicKeyPath) {
        const publicKeyArmored = await fs.readFile(config.encryption.pgpPublicKeyPath, 'utf8');
        this.publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        logger.info('PGP public key loaded');
      }

      // Load private key (for decryption if needed)
      if (config.encryption.pgpPrivateKeyPath) {
        const privateKeyArmored = await fs.readFile(config.encryption.pgpPrivateKeyPath, 'utf8');
        this.privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
        logger.info('PGP private key loaded');
      }
    } catch (error) {
      logger.error('Failed to load PGP keys', { error: error.message });
      throw error;
    }
  }

  /**
   * Encrypt file with PGP
   */
  async encryptFile(inputPath, outputPath) {
    try {
      if (config.features.skipEncryption) {
        logger.warn('Skipping encryption (disabled in config)');
        await fs.copyFile(inputPath, outputPath);
        return outputPath;
      }

      if (!this.publicKey) {
        throw new Error('PGP public key not loaded');
      }

      const fileContent = await fs.readFile(inputPath);

      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ binary: fileContent }),
        encryptionKeys: this.publicKey,
        format: 'binary'
      });

      await fs.writeFile(outputPath, encrypted);
      logger.info(`File encrypted: ${outputPath}`);

      return outputPath;
    } catch (error) {
      logger.error('Encryption failed', { error: error.message, inputPath });
      throw error;
    }
  }

  /**
   * Decrypt file with PGP
   */
  async decryptFile(inputPath, outputPath, passphrase = '') {
    try {
      if (!this.privateKey) {
        throw new Error('PGP private key not loaded');
      }

      const encryptedData = await fs.readFile(inputPath);

      const message = await openpgp.readMessage({ binaryMessage: encryptedData });

      const decrypted = await openpgp.decrypt({
        message,
        decryptionKeys: this.privateKey,
        config: { preferredCompressionAlgorithm: openpgp.enums.compression.zlib }
      });

      await fs.writeFile(outputPath, decrypted.data);
      logger.info(`File decrypted: ${outputPath}`);

      return outputPath;
    } catch (error) {
      logger.error('Decryption failed', { error: error.message, inputPath });
      throw error;
    }
  }

  /**
   * Encrypt string
   */
  async encryptString(plaintext) {
    if (!this.publicKey) {
      throw new Error('PGP public key not loaded');
    }

    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: plaintext }),
      encryptionKeys: this.publicKey
    });

    return encrypted;
  }
}

module.exports = PGPService;
