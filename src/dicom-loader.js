/**
 * DICOM Loader Module
 * Handles DICOM file loading and parsing for the medical imaging tool
 */

import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import * as dicomParser from 'dicom-parser';

class DicomLoader {
    constructor() {
        this.initializeDicomLoader();
    }

    /**
     * Initialize DICOM image loader with Cornerstone
     */
    initializeDicomLoader() {
        try {
            // Initialize the DICOM image loader
            cornerstoneDICOMImageLoader.init({
                cornerstone,
                dicomParser
            });
            
            console.log('DICOM loader initialized successfully');
        } catch (error) {
            console.error('Error initializing DICOM loader:', error);
        }
    }

    /**
     * Load DICOM file from File object
     * @param {File} file - DICOM file from file input
     * @returns {Promise<Object>} Promise resolving to image data and metadata
     */
    async loadDicomFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            if (!this.isDicomFile(file)) {
                reject(new Error('Invalid DICOM file'));
                return;
            }

            console.log('Loading DICOM file:', file.name);

            const fileReader = new FileReader();
            
            fileReader.onload = (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    const byteArray = new Uint8Array(arrayBuffer);
                    
                    // Create a blob URL for the DICOM file
                    const blob = new Blob([byteArray], { type: 'application/dicom' });
                    const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(blob);
                    
                    console.log('Created image ID:', imageId);
                    
                    // Load the image
                    cornerstone.imageLoader.loadImage(imageId).then((image) => {
                        console.log('Image loaded successfully:', image);
                        
                        // Extract metadata
                        const metadata = this.extractMetadata(image);
                        
                        resolve({
                            image: image,
                            imageId: imageId,
                            metadata: metadata,
                            fileName: file.name
                        });
                    }).catch((error) => {
                        console.error('Error loading image:', error);
                        reject(new Error(`Failed to load DICOM image: ${error.message}`));
                    });
                    
                } catch (error) {
                    console.error('Error processing file:', error);
                    reject(new Error(`Failed to process DICOM file: ${error.message}`));
                }
            };
            
            fileReader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            fileReader.readAsArrayBuffer(file);
        });
    }

    /**
     * Load multiple DICOM files
     * @param {FileList} files - Multiple DICOM files
     * @returns {Promise<Array>} Promise resolving to array of loaded images
     */
    async loadMultipleDicomFiles(files) {
        const loadPromises = Array.from(files).map(file => this.loadDicomFile(file));
        
        try {
            const results = await Promise.allSettled(loadPromises);
            const successful = [];
            const failed = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successful.push(result.value);
                } else {
                    failed.push({
                        file: files[index].name,
                        error: result.reason.message
                    });
                }
            });
            
            if (failed.length > 0) {
                console.warn('Some files failed to load:', failed);
            }
            
            return {
                successful: successful,
                failed: failed,
                total: files.length
            };
        } catch (error) {
            throw new Error(`Failed to load DICOM files: ${error.message}`);
        }
    }

    /**
     * Check if file is a valid DICOM file
     * @param {File} file - File to check
     * @returns {boolean} True if file appears to be DICOM
     */
    isDicomFile(file) {
        // Check file extension
        const validExtensions = ['.dcm', '.dicom', '.DCM', '.DICOM'];
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext.toLowerCase())
        );
        
        // Check MIME type (some browsers set this)
        const hasValidMimeType = file.type === 'application/dicom' || 
                                file.type === 'application/octet-stream' ||
                                file.type === '';
        
        return hasValidExtension && hasValidMimeType;
    }

    /**
     * Extract metadata from loaded DICOM image
     * @param {Object} image - Cornerstone image object
     * @returns {Object} Extracted metadata
     */
    extractMetadata(image) {
        const metadata = {
            patientName: 'Unknown',
            studyDate: 'Unknown',
            modality: 'Unknown',
            dimensions: `${image.width} x ${image.height}`,
            pixelSpacing: 'Unknown',
            windowCenter: image.windowCenter || 'Unknown',
            windowWidth: image.windowWidth || 'Unknown',
            intercept: image.intercept || 0,
            slope: image.slope || 1
        };

        try {
            // Try to get metadata from the image data using cornerstone metadata providers
            const imageId = image.imageId;
            
            if (imageId) {
                // Use Cornerstone's metadata providers to get DICOM data
                const generalImageModule = cornerstone.metaData.get('generalImageModule', imageId);
                const patientModule = cornerstone.metaData.get('patientModule', imageId);
                const generalStudyModule = cornerstone.metaData.get('generalStudyModule', imageId);
                const imagePixelModule = cornerstone.metaData.get('imagePixelModule', imageId);
                
                // Extract patient name
                if (patientModule && patientModule.patientName) {
                    metadata.patientName = patientModule.patientName;
                }
                
                // Extract study date
                if (generalStudyModule && generalStudyModule.studyDate) {
                    metadata.studyDate = generalStudyModule.studyDate;
                }
                
                // Extract modality
                if (generalImageModule && generalImageModule.modality) {
                    metadata.modality = generalImageModule.modality;
                }
                
                // Extract pixel spacing
                if (imagePixelModule && imagePixelModule.pixelSpacing) {
                    const spacing = imagePixelModule.pixelSpacing;
                    if (Array.isArray(spacing)) {
                        metadata.pixelSpacing = `${spacing[0]} x ${spacing[1]}`;
                    } else {
                        metadata.pixelSpacing = spacing.toString();
                    }
                }
            }
            
            // Fallback: try to access data directly from image object
            if (image.data && typeof image.data === 'object') {
                // Check if we have direct access to DICOM elements
                if (image.data.elements) {
                    const elements = image.data.elements;
                    
                    // Patient name (0010,0010)
                    if (elements.x00100010 && elements.x00100010.vr === 'PN') {
                        metadata.patientName = elements.x00100010.value || 'Unknown';
                    }
                    
                    // Study date (0008,0020)
                    if (elements.x00080020 && elements.x00080020.vr === 'DA') {
                        metadata.studyDate = elements.x00080020.value || 'Unknown';
                    }
                    
                    // Modality (0008,0060)
                    if (elements.x00080060 && elements.x00080060.vr === 'CS') {
                        metadata.modality = elements.x00080060.value || 'Unknown';
                    }
                    
                    // Pixel spacing (0028,0030)
                    if (elements.x00280030 && elements.x00280030.vr === 'DS') {
                        metadata.pixelSpacing = elements.x00280030.value || 'Unknown';
                    }
                }
            }
        } catch (error) {
            console.warn('Could not extract all metadata:', error);
            console.warn('Available image properties:', Object.keys(image));
            if (image.data) {
                console.warn('Available data properties:', Object.keys(image.data));
            }
        }

        return metadata;
    }

    /**
     * Create a volume from multiple DICOM images (for 3D viewing)
     * @param {Array} images - Array of loaded DICOM images
     * @returns {Object} Volume data for 3D rendering
     */
    createVolumeFromImages(images) {
        if (!images || images.length === 0) {
            throw new Error('No images provided for volume creation');
        }

        // Sort images by instance number or position
        const sortedImages = images.sort((a, b) => {
            const aPos = a.metadata.instanceNumber || 0;
            const bPos = b.metadata.instanceNumber || 0;
            return aPos - bPos;
        });

        const firstImage = sortedImages[0].image;
        
        return {
            imageIds: sortedImages.map(img => img.imageId),
            dimensions: {
                width: firstImage.width,
                height: firstImage.height,
                depth: sortedImages.length
            },
            metadata: sortedImages[0].metadata,
            spacing: this.calculateVolumeSpacing(sortedImages)
        };
    }

    /**
     * Calculate volume spacing for 3D reconstruction
     * @param {Array} sortedImages - Sorted array of images
     * @returns {Object} Spacing information
     */
    calculateVolumeSpacing(sortedImages) {
        const defaultSpacing = { x: 1, y: 1, z: 1 };
        
        if (sortedImages.length < 2) {
            return defaultSpacing;
        }

        try {
            // Calculate Z spacing from slice positions
            const firstImage = sortedImages[0];
            const secondImage = sortedImages[1];
            
            // This is a simplified calculation
            // In real scenarios, you'd use ImagePositionPatient DICOM tag
            const zSpacing = Math.abs(1.0); // Default to 1mm
            
            return {
                x: firstImage.metadata.pixelSpacing?.split('\\')[0] || 1,
                y: firstImage.metadata.pixelSpacing?.split('\\')[1] || 1,
                z: zSpacing
            };
        } catch (error) {
            console.warn('Could not calculate volume spacing:', error);
            return defaultSpacing;
        }
    }
}

export default DicomLoader;