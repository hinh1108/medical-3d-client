# Medical 3D Volume Imaging Tool

Advanced 3D volume rendering application built with Cornerstone3D for medical imaging visualization.

![Medical 3D Volume Imaging Tool](https://github.com/user-attachments/assets/cc9ee35b-2cc0-44b2-8ccc-de966d79d36e)

## Overview

This is a comprehensive 3D volume imaging tool that transforms multiple DICOM files into interactive 3D volumes. Built with modern web technologies and Cornerstone3D, it provides advanced volume rendering capabilities for medical imaging applications.

## Features

### 3D Volume Rendering
- **Volume Viewport**: Advanced 3D volume rendering using Cornerstone3D VOLUME_3D viewport
- **Multiple Rendering Modes**: 
  - Volume Rendering (VR) - Standard volume rendering with opacity and color transfer functions
  - Maximum Intensity Projection (MIP) - Shows maximum intensity values along viewing rays
  - Minimum Intensity Projection (MinIP) - Shows minimum intensity values along viewing rays

### Interactive Tools
- **Rotate Tool**: 3D rotation of volume using mouse drag
- **Pan Tool**: 3D panning/translation of volume
- **Zoom Tool**: 3D zoom in/out functionality
- **Opacity Tool**: Real-time opacity adjustment with mouse interaction

### Volume Controls
- **Opacity Slider**: Real-time volume opacity adjustment (0-100%)
- **Rendering Mode Selector**: Switch between VR, MIP, and MinIP modes
- **Volume Information Panel**: Display of patient data, study information, and volume dimensions

### Keyboard Shortcuts
- `R` - Activate Rotate tool
- `P` - Activate Pan tool  
- `Z` - Activate Zoom tool
- `O` - Activate Opacity tool
- `F` - Reset camera view to default position
- `1` - Switch to Volume Rendering mode
- `2` - Switch to Maximum Intensity Projection mode
- `3` - Switch to Minimum Intensity Projection mode

## Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hinh1108/medical-3d-imaging-tool.git
cd medical-3d-imaging-tool
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with live reload
- `npm run build` - Build for production
- `npm start` - Alias for `npm run dev`
- `npm run serve` - Build and serve production build

## Usage

### Creating 3D Volumes

1. Click the "Upload DICOM Files (Multiple)" button
2. Select multiple DICOM files from the same series/study
3. The application will create a 3D volume from the images
4. Use the 3D tools to interact with the volume

### 3D Interaction

- **Mouse Controls**: 
  - Left click + drag for rotation/pan/zoom (depending on active tool)
  - Mouse wheel for zooming
  - Use tool buttons or keyboard shortcuts to switch tools

- **Volume Controls**:
  - Adjust opacity slider for volume transparency
  - Change rendering mode for different visualization styles
  - Reset view with 'F' key or reset button

## Project Structure

```
medical-3d-imaging-tool/
├── src/
│   ├── index.js              # Main application entry point
│   ├── volume-viewer-3d.js   # 3D volume viewer implementation
│   ├── volume-tools-3d.js    # 3D interaction tools
│   ├── dicom-loader.js       # DICOM file loading logic
│   ├── viewer.js             # Legacy 2D viewer (maintained for compatibility)
│   ├── tools-simple.js       # Legacy 2D tools (maintained for compatibility)
│   └── styles.css            # Application styling
├── dist/                     # Build output directory
├── webpack.config.js         # Webpack configuration
├── package.json              # Project dependencies and scripts
├── index.html                # HTML template
└── README.md                # This file
```

## Technical Implementation

### Core Components
- **VolumeViewer3D**: Main 3D volume rendering component using Cornerstone3D VOLUME_3D viewport
- **VolumeTools3D**: Advanced 3D interaction tools for volume manipulation  
- **DicomLoader**: DICOM file loading and parsing with Cornerstone3D integration
- **Responsive UI**: Modern interface optimized for 3D volume viewing

### Dependencies
- **@cornerstonejs/core**: Core Cornerstone3D library for medical imaging
- **@cornerstonejs/tools**: Advanced tools for medical image interaction
- **@cornerstonejs/dicom-image-loader**: DICOM file loading capabilities
- **dicom-parser**: DICOM file parsing library

## Development

### Adding New Features

1. **New 3D Tools**: Extend `volume-tools-3d.js` or create new tool modules
2. **Volume Rendering**: Enhance `volume-viewer-3d.js` for additional rendering options
3. **UI Components**: Add new controls to `index.html` and style in `styles.css`
4. **DICOM Processing**: Enhance `dicom-loader.js` for additional metadata extraction

### Debugging

- Open browser developer tools to see console logs
- Source maps are enabled for easier debugging
- Use browser's WebGL inspector for 3D rendering debugging

## Browser Requirements

- Modern browser with WebGL support
- Hardware acceleration recommended for optimal 3D performance
- Support for ES6+ JavaScript features

### Tested Browsers
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance Considerations

- **GPU Acceleration**: Ensure hardware acceleration is enabled
- **File Size**: Large DICOM series may require more memory
- **Browser Limits**: Check browser memory limits for large volumes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with DICOM files
5. Submit a pull request

## License

MIT License - feel free to use this for research and educational purposes.

## Notes

- This is a research/development tool - not intended for clinical use
- DICOM files are processed locally in the browser
- No data is sent to external servers
- For production use, add proper error handling and security measures

## Troubleshooting

### Common Issues

1. **Volume not creating**: Ensure you select multiple DICOM files from the same series
2. **Performance issues**: Try with smaller DICOM file sets first
3. **WebGL errors**: Ensure browser supports WebGL and hardware acceleration is enabled
4. **Tools not responding**: Check that volume is loaded before using 3D tools

### Getting Help

- Check the browser console for error messages
- Ensure all dependencies are properly installed
- Try with known-good DICOM test files
- Clear browser cache if experiencing issues
