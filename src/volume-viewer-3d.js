/**
 * Cornerstone3D Volume Viewer Module
 * Manages 3D volume rendering for medical imaging
 */

import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { volumeLoader, setVolumesForViewports, CONSTANTS } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/core';
import {
    TrackballRotateTool,
    PanTool,
    ZoomTool,
} from '@cornerstonejs/tools';
const { ToolGroupManager, Enums: csToolsEnums } = cornerstoneTools;
const { MouseBindings } = csToolsEnums;

class VolumeViewer3D {
    constructor(containerId) {
        this.containerId = containerId;
        this.renderingEngine = null;
        this.viewport = null;
        this.viewportId = 'CT_VOLUME_3D';
        this.renderingEngineId = 'myVolumeRenderingEngine';
        this.volumeName = 'CT_VOLUME_ID';
        this.volumeLoaderScheme = 'cornerstoneStreamingImageVolume';
        this.volumeId = `${this.volumeLoaderScheme}:${this.volumeName}`;
        this.toolGroupId = 'VOLUME_3D_TOOL_GROUP';
        this.toolGroup = null;
        this.isInitialized = false;
        this.currentVolumeData = null;
    }

    /**
     * Initialize Cornerstone3D volume rendering engine and viewport
     */
    /**
 * Initialize Cornerstone3D volume rendering engine and viewport
 */
async initialize() {
    try {
        console.log('Initializing Cornerstone3D volume viewer...');
        
        // Initialize Cornerstone3D and Tools
        await cornerstone.init();
        await cornerstoneTools.init();
        console.log('Cornerstone3D core and tools initialized');

        // Register tools BEFORE creating tool group
        this.registerTools();
        
        // Create tool group for 3D viewport interactions
        this.setupToolGroup();
        
        // Get the container element
        const container = document.getElementById(this.containerId);
        if (!container) {
            throw new Error(`Container element '${this.containerId}' not found`);
        }

        // Clear any existing content
        container.innerHTML = '';
        
        // Create viewport element
        const viewportElement = document.createElement('div');
        viewportElement.style.width = '100%';
        viewportElement.style.height = '100%';
        viewportElement.style.backgroundColor = '#000';
        viewportElement.style.position = 'relative';
        viewportElement.oncontextmenu = () => false;
        container.appendChild(viewportElement);

        // Create rendering engine
        this.renderingEngine = new cornerstone.RenderingEngine(this.renderingEngineId);
        console.log('Rendering engine created');

        // Create viewport input configuration
        const viewportInputArray = [{
            viewportId: this.viewportId,
            type: Enums.ViewportType.VOLUME_3D,
            element: viewportElement,
            defaultOptions: {
                orientation: Enums.OrientationAxis.CORONAL,
                background: CONSTANTS.BACKGROUND_COLORS.slicer3D || [0.2, 0.3, 0.4],
            },
        }];

        // Set viewports
        this.renderingEngine.setViewports(viewportInputArray);
        console.log('Viewport configured');

        // Get viewport reference
        this.viewport = this.renderingEngine.getViewport(this.viewportId);

        // Add viewport to tool group for interaction
        this.toolGroup.addViewport(this.viewportId, this.renderingEngineId);

        // Configure trackball rotation for unrestricted movement
        this.configureTrackballRotation();

        this.isInitialized = true;
        console.log('Cornerstone3D volume viewer initialized successfully');

        // Show ready message
        this.showMessage('3D Volume Viewer ready - Upload DICOM files to begin');

    } catch (error) {
        console.error('Error initializing Cornerstone3D volume viewer:', error);
        this.showError(`Failed to initialize 3D viewer: ${error.message}`);
        throw error;
    }
}
registerTools() {
    try {
        // Register tools with Cornerstone Tools
        cornerstoneTools.addTool(cornerstoneTools.TrackballRotateTool);
        cornerstoneTools.addTool(cornerstoneTools.PanTool);
        cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        
        console.log('All tools registered successfully');
    } catch (error) {
        console.error('Error registering tools:', error);
        throw error;
    }
}

    /**
 * Setup tool group for 3D viewport interactions.
 * This function adds all tools to the group and sets up their initial states.
 */
/**
 * Setup tool group for 3D viewport interactions.
 * Tools must be registered before calling this method.
 */
setupToolGroup() {
    try {
        // Destroy existing tool group if it exists
        try {
            ToolGroupManager.destroyToolGroup(this.toolGroupId);
        } catch (e) {
            // Tool group doesn't exist, which is fine
            console.log('No existing tool group to destroy');
        }
        
        // Create new tool group
        this.toolGroup = ToolGroupManager.createToolGroup(this.toolGroupId);
        console.log('Tool group created:', this.toolGroupId);

        // Add tools to the group (tools must be registered first)
        this.toolGroup.addTool(cornerstoneTools.TrackballRotateTool.toolName);
        this.toolGroup.addTool(cornerstoneTools.PanTool.toolName);
        this.toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
        console.log('Tools added to group');

        // Set initial tool states
        // Mouse wheel zoom is always available
        this.toolGroup.setToolActive(cornerstoneTools.ZoomTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Wheel }],
        });

        // Set TrackballRotate as default active tool for primary mouse button
        this.toolGroup.setToolActive(cornerstoneTools.TrackballRotateTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        // Set other tools as passive initially
        this.toolGroup.setToolPassive(cornerstoneTools.PanTool.toolName);

        console.log('Tool group configured successfully with initial states');
    } catch (error) {
        console.error('Error setting up tool group:', error);
        throw error;
    }
}

    /**
     * Sets the active tool for the primary mouse button (left-click).
     * @param {string} toolName - The name of the tool to activate (e.g., 'TrackballRotate', 'Pan', 'Zoom').
     */
    /**
 * Sets the active tool for the primary mouse button (left-click).
 * @param {string} toolName - The name of the tool to activate (e.g., 'TrackballRotate', 'Pan', 'Zoom').
 */
setActiveTool(toolName) {
    if (!this.toolGroup) {
        console.warn('Tool group not initialized');
        return;
    }

    try {
        const { TrackballRotateTool, PanTool, ZoomTool } = cornerstoneTools;
        const { MouseBindings } = cornerstoneTools.Enums;

        // Map logical name to actual tool name
        const toolMap = {
            TrackballRotate: TrackballRotateTool.toolName,
            Pan: PanTool.toolName,
            Zoom: ZoomTool.toolName,
        };

        const actualToolName = toolMap[toolName];
        
        if (!actualToolName) {
            console.warn('Invalid tool name:', toolName);
            return;
        }

        // Set all tools to passive first (except wheel zoom which stays active)
        this.toolGroup.setToolPassive(TrackballRotateTool.toolName);
        this.toolGroup.setToolPassive(PanTool.toolName);
        this.toolGroup.setToolPassive(ZoomTool.toolName);

        // Reactivate wheel zoom
        this.toolGroup.setToolActive(ZoomTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Wheel }],
        });

        // Activate the selected tool for primary mouse button
        this.toolGroup.setToolActive(actualToolName, {
            bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        console.log(`Active tool set to: ${toolName} (${actualToolName})`);
    } catch (error) {
        console.error('Error setting active tool:', error);
    }
}

    /**
     * Create and display a volume from multiple DICOM images
     * @param {Array} imageIds - Array of Cornerstone image IDs
     * @param {Object} metadata - Volume metadata
     */
    async displayVolume(imageIds, metadata = {}) {
        if (!this.isInitialized) {
            throw new Error('Volume viewer not initialized');
        }

        try {
            console.log('Creating volume from images:', imageIds.length);
            this.showMessage('Creating 3D volume...', 'loading');

            const existingVolume = cornerstone.cache.getVolume(this.volumeId);
            if (existingVolume) {
                cornerstone.cache.removeVolumeLoadObject(this.volumeId);
            }

            const volume = await volumeLoader.createAndCacheVolume(this.volumeId, {
                imageIds,
            });
            console.log('Volume created successfully:', volume);
            
            await volume.load();
            console.log('Volume loaded');

            this.currentVolumeData = {
                volume: volume,
                imageIds: imageIds,
                metadata: metadata
            };

            await setVolumesForViewports(
                this.renderingEngine,
                [{ volumeId: this.volumeId }],
                [this.viewportId]
            );
            console.log('Volume set on viewport');

            this.viewport.setProperties({ preset: 'CT-Bone' });
            this.setupInitialCamera();
            this.viewport.render();
            this.hideMessage();
            this.showMessage('3D Volume loaded - Drag to rotate in any direction', 'info');
            this.updateVolumeInfo(metadata, imageIds.length);
            console.log('Volume displayed successfully');

        } catch (error) {
            console.error('Error displaying volume:', error);
            this.hideMessage();
            this.showError(`Failed to display volume: ${error.message}`);
            throw error;
        }
    }
    
    // ... (các hàm khác như setupInitialCamera, displayVolume, v.v. giữ nguyên không đổi) ...
    // --- BẠN KHÔNG CẦN THAY ĐỔI CÁC HÀM BÊN DƯỚI ---

    /**
     * Setup initial camera for better 3D interaction
     */
    setupInitialCamera() {
        if (!this.viewport) return;
        try {
            const camera = this.viewport.getCamera();
            camera.parallelProjection = true;
            camera.viewAngle = 45;
            const volume = cornerstone.cache.getVolume(this.volumeId);
            if (volume) {
                const { imageData } = volume;
                const bounds = imageData.getBounds();
                const center = [
                    (bounds[0] + bounds[1]) / 2,
                    (bounds[2] + bounds[3]) / 2,
                    (bounds[4] + bounds[5]) / 2
                ];
                const diagonal = Math.sqrt(
                    Math.pow(bounds[1] - bounds[0], 2) +
                    Math.pow(bounds[3] - bounds[2], 2) +
                    Math.pow(bounds[5] - bounds[4], 2)
                );
                camera.focalPoint = center;
                camera.position = [
                    center[0] + diagonal * 0.8,
                    center[1] - diagonal * 0.8,
                    center[2] + diagonal * 0.8
                ];
                camera.viewUp = [0, 0, 1];
                camera.clippingRange = [diagonal * 0.01, diagonal * 100];
            }
            this.viewport.setCamera(camera);
            this.viewport.render();
        } catch (error) {
            console.error('Error setting up initial camera:', error);
        }
    }
    
    /**
     * Get the current viewport for tool integration
     * @returns {Object} Cornerstone viewport
     */
    getViewport() {
        return this.viewport;
    }

    /**
     * Reset viewport camera to default position
     */
    resetCamera() {
        if (!this.viewport) {
            console.warn('No viewport available for camera reset');
            return;
        }

        try {
            this.viewport.resetCamera();
            this.setupInitialCamera();
            this.viewport.render();
            console.log('Camera reset successfully');
        } catch (error) {
            console.error('Error resetting camera:', error);
        }
    }

    /**
     * Configure trackball rotation for unrestricted movement
     */
    configureTrackballRotation() {
       if (!this.toolGroup) return;

    try {
        // Đơn giản hóa configuration
        this.toolGroup.setToolConfiguration(cornerstoneTools.TrackballRotateTool.toolName, {
            rotateSpeed: 1.0
        });
        
        console.log('Trackball rotation configured');
    } catch (error) {
        console.error('Error configuring trackball rotation:', error);
    }
}
    /**
     * Enable/disable rotation with full configuration
     * @param {boolean} enabled - Whether rotation is enabled
     */
    setRotationEnabled(enabled) {
        if (!this.toolGroup) return;

        try {
            if (enabled) {
                this.toolGroup.setToolActive(cornerstoneTools.TrackballRotateTool.toolName, {
                    bindings: [{ 
                        mouseButton: MouseBindings.Primary,
                        modifierKey: undefined
                    }],
                });
                
                // Configure for unrestricted rotation
                this.configureTrackballRotation();
                
                console.log('3D rotation enabled with unrestricted movement');
            } else {
                this.toolGroup.setToolPassive(cornerstoneTools.TrackballRotateTool.toolName);
                console.log('3D rotation disabled');
            }
        } catch (error) {
            console.error('Error setting rotation state:', error);
        }
    }

    /**
     * Apply manual rotation around specific axis
     * @param {string} axis - Rotation axis ('x', 'y', 'z')
     * @param {number} degrees - Rotation degrees
     */
    rotateAroundAxis(axis, degrees) {
        if (!this.viewport) return;

        try {
            const camera = this.viewport.getCamera();
            
            // Convert degrees to radians
            const radians = (degrees * Math.PI) / 180;
            
            // Get current camera vectors
            const position = [...camera.position];
            const focalPoint = [...camera.focalPoint];
            const viewUp = [...camera.viewUp];
            
            // Calculate direction vector from focal point to camera
            const direction = [
                position[0] - focalPoint[0],
                position[1] - focalPoint[1],
                position[2] - focalPoint[2]
            ];
            
            // Apply rotation based on axis
            let newPosition, newViewUp;
            
            switch (axis.toLowerCase()) {
                case 'x':
                    // Rotate around X-axis
                    newPosition = [
                        position[0],
                        focalPoint[1] + direction[1] * Math.cos(radians) - direction[2] * Math.sin(radians),
                        focalPoint[2] + direction[1] * Math.sin(radians) + direction[2] * Math.cos(radians)
                    ];
                    newViewUp = [
                        viewUp[0],
                        viewUp[1] * Math.cos(radians) - viewUp[2] * Math.sin(radians),
                        viewUp[1] * Math.sin(radians) + viewUp[2] * Math.cos(radians)
                    ];
                    break;
                    
                case 'y':
                    // Rotate around Y-axis
                    newPosition = [
                        focalPoint[0] + direction[0] * Math.cos(radians) + direction[2] * Math.sin(radians),
                        position[1],
                        focalPoint[2] - direction[0] * Math.sin(radians) + direction[2] * Math.cos(radians)
                    ];
                    newViewUp = [
                        viewUp[0] * Math.cos(radians) + viewUp[2] * Math.sin(radians),
                        viewUp[1],
                        -viewUp[0] * Math.sin(radians) + viewUp[2] * Math.cos(radians)
                    ];
                    break;
                    
                case 'z':
                    // Rotate around Z-axis
                    newPosition = [
                        focalPoint[0] + direction[0] * Math.cos(radians) - direction[1] * Math.sin(radians),
                        focalPoint[1] + direction[0] * Math.sin(radians) + direction[1] * Math.cos(radians),
                        position[2]
                    ];
                    newViewUp = [
                        viewUp[0] * Math.cos(radians) - viewUp[1] * Math.sin(radians),
                        viewUp[0] * Math.sin(radians) + viewUp[1] * Math.cos(radians),
                        viewUp[2]
                    ];
                    break;
                // In the handleKeyboardShortcuts method

                case 'o': 
                      e.preventDefault(); 
                        document.getElementById('opacity-tool')?.click(); 
                        break;
                default:
                    console.warn('Invalid rotation axis:', axis);
                    return;
            }
            
            // Update camera
            camera.position = newPosition;
            camera.viewUp = newViewUp;
            
            this.viewport.setCamera(camera);
            this.viewport.render();
            
            console.log(`Rotated ${degrees}° around ${axis.toUpperCase()}-axis`);
            
        } catch (error) {
            console.error('Error applying manual rotation:', error);
        }
    }

    /**
     * Set camera to specific preset views
     * @param {string} view - Preset view ('anterior', 'posterior', 'left', 'right', 'superior', 'inferior')
     */
    setPresetView(view) {
        if (!this.viewport) return;

        try {
            const volume = cornerstone.cache.getVolume(this.volumeId);
            if (!volume) return;

            const { imageData } = volume;
            const bounds = imageData.getBounds();
            
            const center = [
                (bounds[0] + bounds[1]) / 2,
                (bounds[2] + bounds[3]) / 2,
                (bounds[4] + bounds[5]) / 2
            ];
            
            const diagonal = Math.sqrt(
                Math.pow(bounds[1] - bounds[0], 2) +
                Math.pow(bounds[3] - bounds[2], 2) +
                Math.pow(bounds[5] - bounds[4], 2)
            );
            
            const camera = this.viewport.getCamera();
            camera.focalPoint = center;
            
            // Set camera position based on preset view
            switch (view.toLowerCase()) {
                case 'anterior':
                    camera.position = [center[0], center[1] - diagonal, center[2]];
                    camera.viewUp = [0, 0, 1];
                    break;
                case 'posterior':
                    camera.position = [center[0], center[1] + diagonal, center[2]];
                    camera.viewUp = [0, 0, 1];
                    break;
                case 'left':
                    camera.position = [center[0] - diagonal, center[1], center[2]];
                    camera.viewUp = [0, 0, 1];
                    break;
                case 'right':
                    camera.position = [center[0] + diagonal, center[1], center[2]];
                    camera.viewUp = [0, 0, 1];
                    break;
                case 'superior':
                    camera.position = [center[0], center[1], center[2] + diagonal];
                    camera.viewUp = [0, 1, 0];
                    break;
                case 'inferior':
                    camera.position = [center[0], center[1], center[2] - diagonal];
                    camera.viewUp = [0, 1, 0];
                    break;
                default:
                    console.warn('Invalid preset view:', view);
                    return;
            }
            
            this.viewport.setCamera(camera);
            this.viewport.render();
            
            console.log('Set preset view:', view);
            
        } catch (error) {
            console.error('Error setting preset view:', error);
        }
    }

    /**
     * Enable/disable rotation
     * @param {boolean} enabled - Whether rotation is enabled
     */
    setRotationEnabled(enabled) {
        if (!this.toolGroup) return;

        try {
            if (enabled) {
                this.toolGroup.setToolActive(cornerstoneTools.TrackballRotateTool.toolName, {
                    bindings: [{ mouseButton: MouseBindings.Primary }],
                });
                console.log('3D rotation enabled');
            } else {
                this.toolGroup.setToolPassive(cornerstoneTools.TrackballRotateTool.toolName);
                console.log('3D rotation disabled');
            }
        } catch (error) {
            console.error('Error setting rotation state:', error);
        }
    }

    /**
     * Apply random rotation (for testing)
     */
    applyRandomRotation() {
        if (!this.viewport) return;

        try {
            // Apply random rotation to the viewport
            this.viewport.setViewPresentation({ 
                rotation: Math.random() * 360 
            });
            this.viewport.render();
            console.log('Applied random rotation');
        } catch (error) {
            console.error('Error applying rotation:', error);
        }
    }

    /**
     * Get the current viewport for tool integration
     * @returns {Object} Cornerstone viewport
     */
    getViewport() {
        return this.viewport;
    }

    /**
     * Reset viewport camera to default position
     */
    resetCamera() {
        if (!this.viewport) {
            console.warn('No viewport available for camera reset');
            return;
        }

        try {
            // Reset camera to show volume properly
            this.viewport.resetCamera();
            this.setupInitialCamera(); // Reapply our custom camera setup
            this.viewport.render();
            console.log('Camera reset successfully');
        } catch (error) {
            console.error('Error resetting camera:', error);
        }
    }

    /**
     * Set volume rendering mode
     * @param {string} mode - Rendering mode ('VR', 'MIP', 'MinIP')
     */
    setRenderingMode(mode) {
        if (!this.viewport || !this.currentVolumeData) {
            console.warn('No volume available for rendering mode change');
            return;
        }

        try {
            // Get volume actors
            const volumeActors = this.viewport.getActors();
            if (volumeActors.length > 0) {
                const volumeActor = volumeActors[0];
                const mapper = volumeActor.getMapper();
                
                // Set rendering mode based on selection
                if (mapper) {
                    switch (mode) {
                        case 'VR':
                            if (mapper.setBlendModeToComposite) {
                                mapper.setBlendModeToComposite();
                            }
                            break;
                        case 'MIP':
                            if (mapper.setBlendModeToMaximumIntensity) {
                                mapper.setBlendModeToMaximumIntensity();
                            }
                            break;
                        case 'MinIP':
                            if (mapper.setBlendModeToMinimumIntensity) {
                                mapper.setBlendModeToMinimumIntensity();
                            }
                            break;
                        default:
                            if (mapper.setBlendModeToComposite) {
                                mapper.setBlendModeToComposite();
                            }
                    }
                    
                    this.viewport.render();
                    console.log('Rendering mode set to:', mode);
                    
                    // Update UI
                    const select = document.getElementById('rendering-mode');
                    if (select) {
                        select.value = mode;
                    }
                } else {
                    console.warn('Volume mapper not available');
                }
            }
        } catch (error) {
            console.error('Error setting rendering mode:', error);
        }
    }

    /**
     * Apply 3D preset with color points and window level
     * @param {Object} preset - Preset configuration with colorPoints, windowLevel, and opacity
     */
    apply3DPreset(preset) {
        if (!this.viewport || !this.currentVolumeData) {
            console.warn('No volume available for preset application');
            return;
        }

        try {
            // 1. Apply window level first
            if (preset.windowLevel) {
                this.setWindowLevel(preset.windowLevel.width, preset.windowLevel.center);
            }

            // 2. Apply RGB color mapping using scalar values
            if (preset.colorPoints && preset.colorPoints.length > 0) {
                this.setRGBTransferFunction(preset.colorPoints);
            }

            // Apply global opacity if specified
            if (preset.opacity !== undefined) {
                this.setVolumeOpacity(preset.opacity);
            }

            // Render the changes
            //this.viewport.render();
            
            console.log(`Applied 3D preset: ${preset.name}`);
            
        } catch (error) {
            console.error('Error applying 3D preset:', error);
        }
    }

    /**
     * Apply custom preset using Cornerstone3D's volume properties
     * @param {Object} preset - Custom preset configuration
     */
    applyCustomPreset(preset) {
        try {
            // Build transfer function points for Cornerstone3D
            let transferFunctionPoints = [];
            
            if (preset.colorPoints && preset.colorPoints.length > 0) {
                preset.colorPoints.forEach(point => {
                    const { position, color } = point;
                    // Convert position (0-1) to HU values (assuming CT data range)
                    const huValue = (position - 0.5) * 4000; // -2000 to +2000 HU range
                    
                    transferFunctionPoints.push({
                        value: huValue,
                        opacity: color[3] || 0.1,
                        color: [color[0], color[1], color[2]]
                    });
                });
            }

            // Apply the custom transfer function
            if (transferFunctionPoints.length > 0) {
                this.viewport.setProperties({
                    transferFunctionPoints: transferFunctionPoints
                });
            }

        } catch (error) {
            console.error('Error applying custom preset:', error);
        }
    }

    /**
     * Update volume opacity using Cornerstone3D API
     * @param {number} opacity - Opacity value (0-1)
     */
    setVolumeOpacity(opacity) {
        if (!this.viewport || !this.currentVolumeData) {
            console.warn('No volume available for opacity change');
            return;
        }

        try {
            // Use Cornerstone3D's volume properties API
            this.viewport.setProperties({
                globalOpacityMultiplier: opacity
            });
            
            this.viewport.render();
            console.log('Volume opacity set to:', opacity);
            
            // Update opacity display if exists
            const opacityDisplay = document.getElementById('opacity-value');
            if (opacityDisplay) {
                opacityDisplay.textContent = Math.round(opacity * 100) + '%';
            }
            
        } catch (error) {
            console.error('Error setting volume opacity:', error);
        }
    }

    /**
     * Apply opacity preset
     * @param {string} presetName - Name of the opacity preset
     */
    applyOpacityPreset(presetName) {
        const opacityPresets = {
            'default': 0.5,
            'bone': 0.7,
            'soft': 0.4,
            'lung': 0.3,
            'vessel': 0.8,
            'transparent': 0.2,
            'opaque': 0.9
        };

        const opacity = opacityPresets[presetName];
        if (opacity !== undefined) {
            this.setVolumeOpacity(opacity);
            
            // Update slider if exists
            const opacitySlider = document.getElementById('opacity-slider');
            if (opacitySlider) {
                opacitySlider.value = opacity;
            }
        }
    }

    /**
     * Set tissue-specific opacities using Cornerstone3D approach
     * @param {Object} tissueOpacities - Object with tissue types and their opacity values
     */
    setTissueOpacities(tissueOpacities) {
        if (!this.viewport || !this.currentVolumeData) {
            console.warn('No volume available for tissue opacity adjustment');
            return;
        }

        try {
            // Define HU ranges for different tissues
            const tissueRanges = {
                bone: { min: 200, max: 2000 },
                softtissue: { min: -100, max: 200 },
                lung: { min: -1000, max: -100 },
                vessel: { min: 100, max: 400 }
            };
            
            // Build transfer function points for tissue-specific opacities
            let transferFunctionPoints = [];
            
            Object.entries(tissueOpacities).forEach(([tissue, opacity]) => {
                const range = tissueRanges[tissue];
                if (range) {
                    // Add points at range boundaries
                    transferFunctionPoints.push({
                        value: range.min,
                        opacity: opacity,
                        color: this.getTissueColor(tissue)
                    });
                    transferFunctionPoints.push({
                        value: range.max,
                        opacity: opacity,
                        color: this.getTissueColor(tissue)
                    });
                }
            });
            
            // Apply the tissue-specific transfer function
            if (transferFunctionPoints.length > 0) {
                this.viewport.setProperties({
                    transferFunctionPoints: transferFunctionPoints
                });
                this.viewport.render();
            }
            
            console.log('Applied tissue-specific opacities:', tissueOpacities);
            
        } catch (error) {
            console.error('Error setting tissue opacities:', error);
        }
    }

    /**
     * Get default color for tissue type
     * @param {string} tissue - Tissue type
     * @returns {Array} RGB color array
     */
    getTissueColor(tissue) {
        const tissueColors = {
            bone: [1.0, 0.9, 0.8],
            softtissue: [0.9, 0.7, 0.6],
            lung: [0.4, 0.6, 0.8],
            vessel: [0.8, 0.2, 0.2]
        };
        
        return tissueColors[tissue] || [1.0, 1.0, 1.0];
    }

    /**
     * Update volume information display
     * @param {Object} metadata - Volume metadata
     * @param {number} sliceCount - Number of slices in volume
     */
    updateVolumeInfo(metadata, sliceCount) {
        try {
            // Update patient name
            const patientNameElement = document.getElementById('patient-name');
            if (patientNameElement) {
                patientNameElement.textContent = metadata.patientName || 'Unknown Patient';
            }

            // Update study date
            const studyDateElement = document.getElementById('study-date');
            if (studyDateElement) {
                studyDateElement.textContent = metadata.studyDate || 'Unknown Date';
            }

            // Update modality
            const modalityElement = document.getElementById('modality');
            if (modalityElement) {
                modalityElement.textContent = metadata.modality || 'CT';
            }

            // Update dimensions
            const dimensionsElement = document.getElementById('dimensions');
            if (dimensionsElement) {
                let dimensionText = metadata.dimensions || 'Unknown';
                if (sliceCount) {
                    dimensionText += ` (${sliceCount} slices)`;
                }
                dimensionsElement.textContent = dimensionText;
            }

            console.log('Volume information updated');

        } catch (error) {
            console.error('Error updating volume info:', error);
        }
    }

    /**
     * Show message in viewport
     * @param {string} message - Message to display
     * @param {string} type - Message type (info, loading, error)
     */
    showMessage(message, type = 'info') {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Remove existing messages
        const existingMessage = container.querySelector('.viewer-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `viewer-message ${type}`;
        messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            background: rgba(0, 0, 0, 0.8);
            padding: 1rem 2rem;
            border-radius: 8px;
            text-align: center;
            z-index: 1000;
            font-size: 0.9rem;
            pointer-events: none;
        `;

        if (type === 'loading') {
            messageElement.innerHTML = `
                <div class="loading-spinner" style="margin: 0 auto 0.5rem; width: 20px; height: 20px;"></div>
                ${message}
            `;
        } else {
            messageElement.textContent = message;
        }

        container.appendChild(messageElement);

        // Auto-remove info messages after 5 seconds (longer for instruction)
        if (type === 'info') {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 5000);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showMessage(message, 'error');
        
        // Also update the volume info panel
        this.updateVolumeInfo({
            patientName: 'Error',
            studyDate: '-',
            modality: '-',
            dimensions: '-'
        }, 0);
    }

    /**
     * Hide any visible messages
     */
    hideMessage() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const message = container.querySelector('.viewer-message');
        if (message) {
            message.remove();
        }
    }

    /**
     * Resize viewport to fit container
     */
    resize() {
        if (!this.renderingEngine) {
            return;
        }

        try {
            // Get container dimensions
            const container = document.getElementById(this.containerId);
            if (!container) return;

            // Trigger resize
            this.renderingEngine.resize();
            
            // Re-render viewport
            if (this.viewport) {
                this.viewport.render();
            }

            console.log('Volume viewport resized');
        } catch (error) {
            console.error('Error resizing volume viewport:', error);
        }
    }

    /**
     * Destroy the viewer and cleanup resources
     */
    destroy() {
        try {
            // Destroy tool group
            if (this.toolGroup) {
                try {
                    ToolGroupManager.destroyToolGroup(this.toolGroupId);
                } catch (e) {
                    console.log('Tool group already destroyed or not found');
                }
                this.toolGroup = null;
            }

            // Remove volume from cache
            if (this.volumeId) {
                try {
                    cornerstone.cache.removeVolumeLoadObject(this.volumeId);
                } catch (e) {
                    console.log('Volume already removed or not found');
                }
            }

            if (this.renderingEngine) {
                // Disable viewport
                if (this.viewport) {
                    this.renderingEngine.disableElement(this.viewportId);
                }
                
                // Destroy rendering engine
                this.renderingEngine.destroy();
                this.renderingEngine = null;
            }

            this.viewport = null;
            this.currentVolumeData = null;
            this.isInitialized = false;

            // Clear container
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = '<div class="loading-message">Upload DICOM files to begin 3D viewing</div>';
            }

            console.log('Cornerstone volume viewer destroyed');
        } catch (error) {
            console.error('Error destroying volume viewer:', error);
        }
    }

    /**
     * Check if viewer is ready
     * @returns {boolean} True if viewer is initialized and ready
     */
    isReady() {
        return this.isInitialized && this.renderingEngine && this.viewport;
    }

    /**
     * Get current volume information
     * @returns {Object} Current volume information
     */
    getCurrentVolumeInfo() {
        if (!this.viewport || !this.currentVolumeData) {
            return null;
        }

        try {
            const properties = this.viewport.getProperties();
            return {
                volumeId: this.volumeId,
                imageCount: this.currentVolumeData.imageIds.length,
                metadata: this.currentVolumeData.metadata,
                properties: properties
            };
        } catch (error) {
            console.error('Error getting current volume info:', error);
            return null;
        }
    }

    /**
     * Set window level (width and center)
     * @param {number} width - Window width
     * @param {number} center - Window center
     */
    setWindowLevel(width, center) {
        if (!this.viewport || !this.currentVolumeData) {
            console.warn('No volume available for window level adjustment');
            return;
        }

        try {

            // Lấy actors từ viewport
            const actors = this.viewport.getActors();
            if (actors && actors.length > 0) {
                const volumeActor = actors[0]; // Lấy volume actor đầu tiên
                console.log('Volume actor found:', volumeActor);
                if (volumeActor && volumeActor.actor) {
                    console.log('Setting window level on volume actor:', volumeActor);
                    const property = volumeActor.actor.getProperty();

                    // Truy cập ScalarOpacity transfer function theo VTK
                    const scalarOpacity = property.getScalarOpacity(0);
                    
                    // Xóa tất cả các điểm cũ
                    scalarOpacity.removeAllPoints();
                    
                    // Thêm các điểm mới cho window level
                    const windowMin = center - width / 2;
                    const windowMax = center + width / 2;
                    
                    // Tạo gradient opacity dựa trên window level
                    scalarOpacity.addPoint(windowMin, 0.0);                // Bắt đầu window
                    scalarOpacity.addPoint(windowMax, 1.0);                // Kết thúc window
                    
                    // Cập nhật lại opacity
                    property.setScalarOpacity(0, scalarOpacity);

                    this.viewport.render();
                    
                    console.log(`Window level: Width=${width}, Center=${center}`);
                    
                }
            }
            
            
        } catch (error) {
            console.error('Error setting window level:', error);
        }
    }

     /**
     * Set RGB transfer function (color mapping)
     * @param {Array} colorPoints - Array of {value, r, g, b} points
     */
    setRGBTransferFunction(colorPoints) {
        if (!this.viewport || !this.currentVolumeData) {
            console.warn('No volume available for color adjustment');
            return;
        }

        try {
            const actors = this.viewport.getActors();
            if (actors && actors.length > 0) {
                const volumeActor = actors[0];
                
                if (volumeActor && volumeActor.actor) {
                    const property = volumeActor.actor.getProperty();

                    if (property && property.getRGBTransferFunction) {
                        const rgbTransferFunction = property.getRGBTransferFunction(0);
                        
                        // Xóa tất cả các điểm cũ
                        rgbTransferFunction.removeAllPoints();
                        
                        // Thêm các điểm màu mới với scalar values
                        colorPoints.forEach(point => {
                            rgbTransferFunction.addRGBPoint(
                                point.value,        // Scalar value (HU)
                                point.color[0],     // Red
                                point.color[1],     // Green
                                point.color[2]      // Blue
                            );
                        });
                        
                        this.viewport.render();
                        console.log('RGB transfer function applied:', colorPoints);
                    }
                }
            }
        } catch (error) {
            console.error('Error setting RGB transfer function:', error);
        }
    }


    /**
     * Get current window level settings
     * @returns {Object} Current window level {width, center}
     */
    getWindowLevel() {
        if (!this.viewport || !this.currentVolumeData) {
            return { width: 400, center: 50 };
        }

        try {
            const properties = this.viewport.getProperties();
            if (properties.voiRange) {
                const { lower, upper } = properties.voiRange;
                const width = upper - lower;
                const center = lower + width / 2;
                return { width, center };
            }
        } catch (error) {
            console.error('Error getting window level:', error);
        }

        return { width: 400, center: 50 };
    }

    /**
     * Apply window level preset
     * @param {string} presetName - Preset name
     */
    applyWindowLevelPreset(presetName) {
        const presets = {
            'bone': { width: 2000, center: 300 },
            'soft-tissue': { width: 400, center: 50 },
            'lung': { width: 1500, center: -600 },
            'brain': { width: 100, center: 50 },
            'liver': { width: 150, center: 30 },
            'mediastinum': { width: 350, center: 50 },
            'abdomen': { width: 400, center: 60 },
            'spine': { width: 400, center: 50 },
            'angio': { width: 600, center: 100 }
        };

        const preset = presets[presetName];
        if (preset) {
            this.setWindowLevel(preset.width, preset.center);
        }
    }
}

export default VolumeViewer3D;