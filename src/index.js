import './styles.css';
import VolumeViewer3D from './volume-viewer-3d.js';
import DicomLoader from './dicom-loader.js';

class MedicalImagingApp {
    constructor() {
        this.volumeViewer = null;
        this.dicomLoader = null;
        this.currentImages = [];
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Initializing Medical 3D Volume Imaging Tool...');
            this.showAppLoading();

            this.volumeViewer = new VolumeViewer3D('cornerstone-viewport');
            this.dicomLoader = new DicomLoader();

            await this.volumeViewer.initialize();
            this.setupEventListeners();

            this.hideAppLoading();
            this.isInitialized = true;
            this.showSuccessMessage('3D Volume Viewer loaded successfully. Upload DICOM files to begin.');
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showErrorMessage(`Failed to initialize 3D application: ${error.message}`);
        }
    }

    setupEventListeners() {
        document.getElementById('dicom-file')?.addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        const toolButtons = {
            'rotate-tool': 'Rotate',
            'pan-tool': 'Pan',
            'zoom-tool': 'Zoom',
            'opacity-tool': 'Opacity'
        };

        Object.entries(toolButtons).forEach(([id, name]) => {
            document.getElementById(id)?.addEventListener('click', () => {
                this.setActiveTool(name, document.getElementById(id));
            });
        });

       // Thêm vào phương thức setupEventListeners() trong index.js

// Opacity slider event
document.getElementById('opacity-slider')?.addEventListener('input', (e) => {
    const opacity = parseFloat(e.target.value);
    this.volumeViewer?.setVolumeOpacity(opacity);
});

// Opacity preset buttons (nếu bạn có các buttons cho preset)
const opacityPresets = ['default', 'bone', 'soft', 'lung', 'vessel', 'transparent', 'opaque'];
opacityPresets.forEach(preset => {
    document.getElementById(`opacity-${preset}`)?.addEventListener('click', () => {
        this.volumeViewer?.applyOpacityPreset(preset);
        this.showSuccessMessage(`Applied ${preset} opacity preset`);
    });
});

// Tissue-specific opacity controls (nếu bạn có)
['bone', 'soft-tissue', 'lung', 'vessel'].forEach(tissue => {
    document.getElementById(`${tissue}-opacity`)?.addEventListener('input', (e) => {
        const opacity = parseFloat(e.target.value);
        const tissueOpacities = {};
        tissueOpacities[tissue.replace('-', '')] = opacity;
        this.volumeViewer?.setTissueOpacities(tissueOpacities);
    });
});

// Reset opacity button
document.getElementById('reset-opacity')?.addEventListener('click', () => {
    this.volumeViewer?.setVolumeOpacity(0.5);
    const opacitySlider = document.getElementById('opacity-slider');
    if (opacitySlider) opacitySlider.value = 0.5;
    const opacityDisplay = document.getElementById('opacity-value');
    if (opacityDisplay) opacityDisplay.textContent = '50%';
    this.showSuccessMessage('Opacity reset to 50%');
});

// Window Center slider event
document.getElementById('window-center-slider')?.addEventListener('input', (e) => {
    const center = parseFloat(e.target.value);
    const width = parseFloat(document.getElementById('window-width-slider')?.value || 400);
    this.setWindowLevel(width, center);
    
    // Update display
    const centerDisplay = document.getElementById('window-center-value');
    if (centerDisplay) centerDisplay.textContent = center.toString();
});

// Window Width slider event  
document.getElementById('window-width-slider')?.addEventListener('input', (e) => {
    const width = parseFloat(e.target.value);
    const center = parseFloat(document.getElementById('window-center-slider')?.value || 50);
    this.setWindowLevel(width, center);
    
    // Update display
    const widthDisplay = document.getElementById('window-width-value');
    if (widthDisplay) widthDisplay.textContent = width.toString();
});

// Window Level preset buttons
const windowPresets = {
    'bone': { width: 2000, center: 300 },
    'soft-tissue': { width: 400, center: 50 },
    'lung': { width: 1500, center: -600 },
    'brain': { width: 100, center: 50 },
    'liver': { width: 150, center: 30 },
    'mediastinum': { width: 350, center: 50 }
};

Object.entries(windowPresets).forEach(([preset, values]) => {
    document.getElementById(`window-${preset}`)?.addEventListener('click', () => {
        this.setWindowLevel(values.width, values.center);
        this.updateWindowLevelSliders(values.width, values.center);
        this.showSuccessMessage(`Applied ${preset} window preset`);
    });
});

// Reset window level button
document.getElementById('reset-window-level')?.addEventListener('click', () => {
    this.setWindowLevel(400, 50);
    this.updateWindowLevelSliders(400, 50);
    this.showSuccessMessage('Window level reset to default');
});

        document.getElementById('rendering-mode')?.addEventListener('change', (e) => {
            this.setRenderingMode(e.target.value);
        });

        // Thêm event listener cho 3D presets dropdown
        document.getElementById('preset-selector')?.addEventListener('change', (e) => {
            const presetName = e.target.value;
            if (presetName && presetName !== 'default') {
                this.apply3DPreset(presetName);
                this.showSuccessMessage(`Applied ${presetName} preset`);
            }
        });

        document.getElementById('reset-camera')?.addEventListener('click', () => {
            this.volumeViewer?.resetCamera();
            this.showSuccessMessage('Camera view reset');
        });

        document.getElementById('random-rotation')?.addEventListener('click', () => {
            this.volumeViewer?.applyRandomRotation();
            this.showSuccessMessage('Applied random rotation');
        });

        document.getElementById('enable-rotation')?.addEventListener('change', (e) => {
            this.volumeViewer?.setRotationEnabled(e.target.checked);
            this.showSuccessMessage(e.target.checked ? 'Rotation enabled' : 'Rotation disabled');
        });
        
        ['anterior', 'posterior', 'left', 'right', 'superior', 'inferior'].forEach(view => {
            document.getElementById(`view-${view}`)?.addEventListener('click', () => {
                this.volumeViewer?.setPresetView(view);
            });
        });

        ['x', 'y', 'z'].forEach(axis => {
            document.getElementById(`rotate-${axis}-pos`)?.addEventListener('click', () => {
                this.volumeViewer?.rotateAroundAxis(axis, 15);
            });
            document.getElementById(`rotate-${axis}-neg`)?.addEventListener('click', () => {
                this.volumeViewer?.rotateAroundAxis(axis, -15);
            });
        });

        window.addEventListener('resize', () => this.volumeViewer?.resize());

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    async handleFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length < 2) {
            this.showErrorMessage('Please upload at least 2 DICOM files from the same series.');
            return;
        }

        try {
            this.showLoadingMessage('Processing DICOM files...');
            await this.loadVolumeFromFiles(files);
        } catch (error) {
            this.showErrorMessage(`Failed to load DICOM files: ${error.message}`);
        }
    }

    async loadVolumeFromFiles(files) {
        const results = await this.dicomLoader.loadMultipleDicomFiles(files);
        if (results.successful.length < 2) throw new Error('Need at least 2 DICOM files');

        const imageIds = results.successful.map(res => res.imageId);
        const metadata = results.successful[0].metadata;

        await this.volumeViewer.displayVolume(imageIds, metadata);
        this.volumeViewer.setActiveTool('TrackballRotate');
        this.currentImages = results.successful;

        let message = `Successfully created 3D volume from ${results.successful.length} files`;
        if (results.failed.length > 0) {
            message += ` (${results.failed.length} failed)`;
        }

        this.showSuccessMessage(message);
    }

    setActiveTool(toolName, buttonElement) {
        this.updateToolButtonStates(buttonElement);

        let viewerTool = {
            Rotate: 'TrackballRotate',
            Pan: 'Pan',
            Zoom: 'Zoom'
        }[toolName];

        if (viewerTool) {
            this.volumeViewer?.setActiveTool(viewerTool);
        }
    }

    setVolumeOpacity(opacity) {
        this.volumeViewer?.setVolumeOpacity(opacity);
    }

    setRenderingMode(mode) {
        this.volumeViewer?.setRenderingMode(mode);
    }

    setWindowLevel(width, center) {
        this.volumeViewer?.setWindowLevel(width, center);
    }

    updateWindowLevelSliders(width, center) {
        const centerSlider = document.getElementById('window-center-slider');
        const widthSlider = document.getElementById('window-width-slider');
        const centerDisplay = document.getElementById('window-center-value');
        const widthDisplay = document.getElementById('window-width-value');
        
        if (centerSlider) centerSlider.value = center;
        if (widthSlider) widthSlider.value = width;
        if (centerDisplay) centerDisplay.textContent = center.toString();
        if (widthDisplay) widthDisplay.textContent = width.toString();
    }

    apply3DPreset(presetName) {
        const presets = {
  'ct-bone': {
                name: 'CT Bone',
                colorPoints: [
                    { value: -1000, color: [0, 0, 0, 0] },        // Air - completely transparent
                    { value: 200, color: [0.8, 0.6, 0.4, 0.1] },  // Bone start - light brown
                    { value: 800, color: [1.0, 0.9, 0.8, 0.3] },  // Cortical bone - ivory
                    { value: 2000, color: [1.0, 1.0, 1.0, 1.0] }  // Dense bone - white
                ],
                windowLevel: { width: 2000, center: 300 },
                opacity: 0.7
            },
            'ct-soft-tissue': {
                name: 'CT Soft Tissue',
                colorPoints: [
                    { value: -100, color: [0, 0, 0, 0] },          // Air/lung - transparent
                    { value: 0, color: [0.6, 0.4, 0.3, 0.2] },    // Water - brown
                    { value: 100, color: [0.9, 0.7, 0.6, 0.5] },  // Soft tissue - pink
                    { value: 200, color: [1.0, 0.8, 0.7, 0.8] }   // Dense tissue - light pink
                ],
                windowLevel: { width: 400, center: 50 },
                opacity: 0.6
            },
            'ct-lung': {
                name: 'CT Lung',
                colorPoints: [
                    { value: -1000, color: [0, 0, 0, 0] },         // Air - transparent
                    { value: -800, color: [0.2, 0.3, 0.6, 0.1] }, // Lung parenchyma - blue
                    { value: -300, color: [0.4, 0.6, 0.8, 0.3] }, // Airways - light blue
                    { value: 100, color: [0.8, 0.9, 1.0, 0.7] }   // Vessels/tissue - cyan
                ],
                windowLevel: { width: 1500, center: -600 },
                opacity: 0.5
            },
            'ct-angiography': {
                name: 'CT Angiography',
                colorPoints: [
                    { value: -100, color: [0, 0, 0, 0] },          // Background - transparent
                    { value: 100, color: [0.3, 0.1, 0.1, 0.1] },  // Low enhancement - dark red
                    { value: 300, color: [0.8, 0.2, 0.2, 0.4] },  // Vessels - red
                    { value: 500, color: [1.0, 0.4, 0.4, 0.9] }   // High enhancement - bright red
                ],
                windowLevel: { width: 600, center: 100 },
                opacity: 0.8
            },
            'mri-brain': {
                name: 'MRI Brain',
                colorPoints: [
                    { value: 0, color: [0, 0, 0, 0] },             // CSF - transparent
                    { value: 64, color: [0.2, 0.2, 0.4, 0.2] },   // Gray matter - dark blue
                    { value: 153, color: [0.6, 0.6, 0.8, 0.5] },  // White matter - blue-gray
                    { value: 255, color: [0.9, 0.9, 1.0, 0.8] }   // Bright areas - light gray
                ],
                windowLevel: { width: 255, center: 128 },
                opacity: 0.7
            },
            'pet-scan': {
                name: 'PET Scan',
                colorPoints: [
                    { value: 0, color: [0, 0, 0, 0] },             // No activity - transparent
                    { value: 1500, color: [0, 0, 1, 0.3] },       // Low activity - blue
                    { value: 3000, color: [0, 1, 0, 0.6] },       // Moderate activity - green
                    { value: 4000, color: [1, 1, 0, 0.8] },       // High activity - yellow
                    { value: 5000, color: [1, 0, 0, 1.0] }        // Maximum activity - red
                ],
                windowLevel: { width: 5000, center: 2500 },
                opacity: 0.9
            },
            'contrast-enhanced': {
                name: 'Contrast Enhanced',
                colorPoints: [
                    { value: -100, color: [0, 0, 0, 0] },          // Background - transparent
                    { value: 50, color: [0.1, 0.1, 0.3, 0.1] },   // Low enhancement - dark blue
                    { value: 200, color: [0.3, 0.5, 0.8, 0.4] },  // Moderate enhancement - blue
                    { value: 400, color: [0.7, 0.8, 1.0, 0.7] },  // High enhancement - light blue
                    { value: 600, color: [1.0, 1.0, 1.0, 1.0] }   // Maximum enhancement - white
                ],
                windowLevel: { width: 1000, center: 200 },
                opacity: 0.75
            }
        };

        const preset = presets[presetName];
        if (preset && this.volumeViewer) {
            // Apply color points and window level
            this.volumeViewer.apply3DPreset(preset);
            
            // Update opacity slider if exists
            const opacitySlider = document.getElementById('opacity-slider');
            if (opacitySlider) {
                opacitySlider.value = preset.opacity;
            }
            
            // Update opacity display if exists
            const opacityDisplay = document.getElementById('opacity-value');
            if (opacityDisplay) {
                opacityDisplay.textContent = Math.round(preset.opacity * 100) + '%';
            }

            // Update window level sliders if preset has window level
            if (preset.windowLevel) {
                this.updateWindowLevelSliders(preset.windowLevel.width, preset.windowLevel.center);
            }
        }
    }

    updateToolButtonStates(activeButton) {
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        activeButton?.classList.add('active');
    }

    handleKeyboardShortcuts(e) {
        if (!this.isInitialized) return;

        switch (e.key.toLowerCase()) {
            case 'r': e.preventDefault(); this.setActiveTool('Rotate', document.getElementById('rotate-tool')); break;
            case 'p': e.preventDefault(); this.setActiveTool('Pan', document.getElementById('pan-tool')); break;
            case 'z': e.preventDefault(); this.setActiveTool('Zoom', document.getElementById('zoom-tool')); break;
            case 'o': e.preventDefault(); document.getElementById('opacity-tool')?.click(); break;
            case 'f': e.preventDefault(); this.resetView(); break;
            case '1': e.preventDefault(); this.setRenderingMode('VR'); break;
            case '2': e.preventDefault(); this.setRenderingMode('MIP'); break;
            case '3': e.preventDefault(); this.setRenderingMode('MinIP'); break;
        }
    }

    resetView() {
        this.volumeViewer?.resetCamera();
        this.showSuccessMessage('3D view reset');
    }

    showLoadingMessage(msg) { this.showMessage(msg, 'loading'); }
    showSuccessMessage(msg) { this.showMessage(msg, 'success'); }
    showErrorMessage(msg) { this.showMessage(msg, 'error'); }

    showMessage(message, type = 'info') {
        document.querySelector('.app-message')?.remove();

        const el = document.createElement('div');
        el.className = `app-message ${type}`;
        el.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            font-size: 0.9rem;
            z-index: 2000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);`;

        el.textContent = message;
        if (type === 'loading') {
            el.innerHTML = `<div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="loading-spinner" style="width: 16px; height: 16px;"></div>
                                ${message}
                            </div>`;
            el.style.backgroundColor = '#3498db';
        } else if (type === 'success') {
            el.style.backgroundColor = '#27ae60';
        } else if (type === 'error') {
            el.style.backgroundColor = '#e74c3c';
        }

        document.body.appendChild(el);
        setTimeout(() => el.remove(), type === 'error' ? 5000 : 3000);
    }

    showAppLoading() {
        const el = document.createElement('div');
        el.id = 'app-loading';
        el.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;`;

        el.innerHTML = `
            <div style="text-align: center;">
                <div class="loading-spinner" style="margin: 0 auto 1rem; width: 40px; height: 40px;"></div>
                <p style="color: #667eea; font-size: 1.1rem; font-weight: 500;">Initializing Medical Imaging Tool...</p>
            </div>`;
        document.body.appendChild(el);
    }

    hideAppLoading() {
        document.getElementById('app-loading')?.remove();
    }

    destroy() {
        this.volumeViewer?.destroy();
        this.volumeViewer = null;
        this.dicomLoader = null;
        this.currentImages = [];
        this.isInitialized = false;
        console.log('App destroyed');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.medicalApp = new MedicalImagingApp();
        await window.medicalApp.init();
    } catch (err) {
        console.error('Initialization failed:', err);
    }
});
