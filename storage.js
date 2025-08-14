/**
 * Storage module for Run Javascript Chrome Extension
 * 
 * This module provides a storage solution that:
 * 1. Uses chrome.storage.sync for synchronization across devices
 * 2. Implements chunking for large scripts that exceed chrome.storage.sync limits
 * 3. Provides backward compatibility with existing scripts
 * 4. Includes fallback to chrome.storage.local when sync fails
 */

// Constants
const CHUNK_SIZE = 80 * 1024; // 80KB chunks (safely under the 100KB limit)
const CHUNK_KEY_PREFIX = '_chunk_';
const METADATA_KEY_PREFIX = '_meta_';
const PREFIX = 'runjavascript_';

// The main storage API object that will be exposed
const StorageManager = {
    /**
     * Get a script by domain
     * @param {string} domain - Domain to get the script for
     * @returns {Promise<Object>} - Promise resolving to the script object
     */
    async getScript(domain) {
        const key = PREFIX + domain;
        try {
            // Try to get the script from sync storage
            const result = await this._chromeStorageGet(key);
            
            // If no result, return default script object
            if (!result || !result[key]) {
                return this._getDefaultScript();
            }
            
            let scriptData = result[key];
            
            // Handle legacy string format
            if (typeof scriptData === 'string') {
                return {
                    code: scriptData,
                    enabled: true,
                    library: ''
                };
            }
            
            // Check if this is a chunked script
            if (scriptData.isChunked) {
                // Get all chunks and reassemble
                const code = await this._getChunkedScript(domain, scriptData.chunkCount);
                scriptData.code = code;
                delete scriptData.isChunked;
                delete scriptData.chunkCount;
            }
            
            return scriptData;
        } catch (error) {
            console.error('Error getting script:', error);
            // Fallback to local storage
            return this._getFromLocalStorage(domain);
        }
    },
    
    /**
     * Save a script for a domain
     * @param {string} domain - Domain to save the script for
     * @param {Object} scriptData - Script data to save
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async saveScript(domain, scriptData) {
        const key = PREFIX + domain;
        try {
            // Check script size
            const scriptSize = JSON.stringify(scriptData).length;
            
            // If script is small enough, save directly
            if (scriptSize <= CHUNK_SIZE) {
                const data = {};
                data[key] = scriptData;
                await this._chromeStorageSet(data);
                return true;
            }
            
            // For large scripts, use chunking
            return await this._saveChunkedScript(domain, scriptData);
        } catch (error) {
            console.error('Error saving script:', error);
            // Fallback to local storage
            return this._saveToLocalStorage(domain, scriptData);
        }
    },
    
    /**
     * Remove a script for a domain
     * @param {string} domain - Domain to remove the script for
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async removeScript(domain) {
        const key = PREFIX + domain;
        try {
            // First get the script to check if it's chunked
            const result = await this._chromeStorageGet(key);
            
            if (result && result[key] && result[key].isChunked) {
                // If chunked, remove all chunks
                const chunkCount = result[key].chunkCount;
                await this._removeChunks(domain, chunkCount);
            }
            
            // Remove the main key
            await this._chromeStorageRemove(key);
            return true;
        } catch (error) {
            console.error('Error removing script:', error);
            // Try to remove from local storage as well
            return this._removeFromLocalStorage(domain);
        }
    },
    
    /**
     * Get all scripts
     * @returns {Promise<Object>} - Promise resolving to an object with domain keys and script values
     */
    async getAllScripts() {
        try {
            // Get all items from sync storage
            const allItems = await this._chromeStorageGetAll();
            
            // Filter out chunk keys and process scripts
            const scripts = {};
            const promises = [];
            
            for (const key in allItems) {
                // Only process main script keys
                if (key.startsWith(PREFIX) && 
                    !key.includes(CHUNK_KEY_PREFIX) && 
                    !key.includes(METADATA_KEY_PREFIX)) {
                    
                    const domain = key.substring(PREFIX.length);
                    // Add promise to array for parallel processing
                    promises.push(
                        this.getScript(domain)
                            .then(script => {
                                scripts[domain] = script;
                            })
                    );
                }
            }
            
            // Wait for all scripts to be processed
            await Promise.all(promises);
            return scripts;
        } catch (error) {
            console.error('Error getting all scripts:', error);
            // Fallback to local storage
            return this._getAllFromLocalStorage();
        }
    },
    
    /**
     * Import scripts from a JSON file
     * @param {Object} scriptsData - Object containing scripts to import
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    async importScripts(scriptsData) {
        try {
            const promises = [];
            
            for (const domain in scriptsData) {
                promises.push(this.saveScript(domain, scriptsData[domain]));
            }
            
            const results = await Promise.all(promises);
            
            // Check if all saves were successful
            const allSuccessful = results.every(result => result === true);
            return allSuccessful;
        } catch (error) {
            console.error('Error importing scripts:', error);
            return false;
        }
    },
    
    /**
     * Export all scripts to a JSON object
     * @returns {Promise<Object>} - Promise resolving to an object with all scripts
     */
    async exportScripts() {
        return await this.getAllScripts();
    },
    
    // Private helper methods
    
    /**
     * Get default empty script
     * @returns {Object} - Default script object
     * @private
     */
    _getDefaultScript() {
        return {
            code: '',
            enabled: true,
            library: ''
        };
    },
    
    /**
     * Save a chunked script
     * @param {string} domain - Domain to save the script for
     * @param {Object} scriptData - Script data to save
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     * @private
     */
    async _saveChunkedScript(domain, scriptData) {
        // Extract code from script data
        const { code, ...metaData } = scriptData;
        
        // Split code into chunks
        const chunks = this._splitIntoChunks(code);
        const chunkCount = chunks.length;
        
        // Create metadata
        const metadata = {
            ...metaData,
            isChunked: true,
            chunkCount,
            version: Date.now(),
            size: code.length
        };
        
        // Save metadata
        const key = PREFIX + domain;
        const metaObj = {};
        metaObj[key] = metadata;
        await this._chromeStorageSet(metaObj);
        
        // Save all chunks
        for (let i = 0; i < chunks.length; i++) {
            const chunkKey = PREFIX + domain + CHUNK_KEY_PREFIX + i;
            const chunkObj = {};
            chunkObj[chunkKey] = chunks[i];
            await this._chromeStorageSet(chunkObj);
        }
        
        return true;
    },
    
    /**
     * Get a chunked script
     * @param {string} domain - Domain to get the script for
     * @param {number} chunkCount - Number of chunks to retrieve
     * @returns {Promise<string>} - Promise resolving to the reassembled code
     * @private
     */
    async _getChunkedScript(domain, chunkCount) {
        const chunks = [];
        
        // Get all chunks
        for (let i = 0; i < chunkCount; i++) {
            const chunkKey = PREFIX + domain + CHUNK_KEY_PREFIX + i;
            const result = await this._chromeStorageGet(chunkKey);
            
            if (result && result[chunkKey]) {
                chunks.push(result[chunkKey]);
            } else {
                console.error(`Missing chunk ${i} for domain ${domain}`);
                // If a chunk is missing, try to get from local storage
                return this._getFromLocalStorage(domain).then(script => script.code);
            }
        }
        
        // Reassemble chunks
        return chunks.join('');
    },
    
    /**
     * Remove all chunks for a script
     * @param {string} domain - Domain to remove chunks for
     * @param {number} chunkCount - Number of chunks to remove
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     * @private
     */
    async _removeChunks(domain, chunkCount) {
        for (let i = 0; i < chunkCount; i++) {
            const chunkKey = PREFIX + domain + CHUNK_KEY_PREFIX + i;
            await this._chromeStorageRemove(chunkKey);
        }
        return true;
    },
    
    /**
     * Split a string into chunks
     * @param {string} str - String to split
     * @returns {Array<string>} - Array of chunks
     * @private
     */
    _splitIntoChunks(str) {
        const chunks = [];
        let i = 0;
        while (i < str.length) {
            chunks.push(str.slice(i, i + CHUNK_SIZE));
            i += CHUNK_SIZE;
        }
        return chunks;
    },
    
    /**
     * Wrapper for chrome.storage.sync.get
     * @param {string} key - Key to get
     * @returns {Promise<Object>} - Promise resolving to the result
     * @private
     */
    _chromeStorageGet(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(key, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        });
    },
    
    /**
     * Wrapper for chrome.storage.sync.set
     * @param {Object} data - Data to set
     * @returns {Promise<void>} - Promise resolving when complete
     * @private
     */
    _chromeStorageSet(data) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    },
    
    /**
     * Wrapper for chrome.storage.sync.remove
     * @param {string} key - Key to remove
     * @returns {Promise<void>} - Promise resolving when complete
     * @private
     */
    _chromeStorageRemove(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.remove(key, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    },
    
    /**
     * Wrapper for chrome.storage.sync.get with no key (gets all items)
     * @returns {Promise<Object>} - Promise resolving to all items
     * @private
     */
    _chromeStorageGetAll() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        });
    },
    
    /**
     * Fallback to get from local storage
     * @param {string} domain - Domain to get the script for
     * @returns {Promise<Object>} - Promise resolving to the script object
     * @private
     */
    async _getFromLocalStorage(domain) {
        const key = PREFIX + domain;
        return new Promise((resolve) => {
            chrome.storage.local.get(key, (result) => {
                if (chrome.runtime.lastError || !result || !result[key]) {
                    resolve(this._getDefaultScript());
                } else {
                    let scriptData = result[key];
                    
                    // Handle legacy string format
                    if (typeof scriptData === 'string') {
                        scriptData = {
                            code: scriptData,
                            enabled: true,
                            library: ''
                        };
                    }
                    
                    resolve(scriptData);
                }
            });
        });
    },
    
    /**
     * Fallback to save to local storage
     * @param {string} domain - Domain to save the script for
     * @param {Object} scriptData - Script data to save
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     * @private
     */
    async _saveToLocalStorage(domain, scriptData) {
        const key = PREFIX + domain;
        return new Promise((resolve) => {
            const data = {};
            data[key] = scriptData;
            chrome.storage.local.set(data, () => {
                resolve(!chrome.runtime.lastError);
            });
        });
    },
    
    /**
     * Fallback to remove from local storage
     * @param {string} domain - Domain to remove the script for
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     * @private
     */
    async _removeFromLocalStorage(domain) {
        const key = PREFIX + domain;
        return new Promise((resolve) => {
            chrome.storage.local.remove(key, () => {
                resolve(!chrome.runtime.lastError);
            });
        });
    },
    
    /**
     * Fallback to get all scripts from local storage
     * @returns {Promise<Object>} - Promise resolving to an object with domain keys and script values
     * @private
     */
    async _getAllFromLocalStorage() {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (result) => {
                const scripts = {};
                
                if (!chrome.runtime.lastError && result) {
                    for (const key in result) {
                        if (key.startsWith(PREFIX)) {
                            const domain = key.substring(PREFIX.length);
                            let scriptData = result[key];
                            
                            // Handle legacy string format
                            if (typeof scriptData === 'string') {
                                scriptData = {
                                    code: scriptData,
                                    enabled: true,
                                    library: ''
                                };
                            }
                            
                            scripts[domain] = scriptData;
                        }
                    }
                }
                
                resolve(scripts);
            });
        });
    }
};

// Export the storage manager
window.StorageManager = StorageManager;

