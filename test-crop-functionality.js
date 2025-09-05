// Simple test to verify crop functionality
import { imageProcessor } from './src/services/imageProcessor';

async function testCrop() {
  console.log('🧪 Testing crop functionality...');

  try {
    // Mock image URI - replace with actual image path for testing
    const testImageUri = 'file:///path/to/test/image.jpg';

    // Test crop operation
    const cropData = {
      x: 100,
      y: 100,
      width: 200,
      height: 200,
    };

    console.log('📏 Crop parameters:', cropData);

    const result = await imageProcessor.processImage(testImageUri, [
      {
        type: 'crop',
        x: cropData.x,
        y: cropData.y,
        width: cropData.width,
        height: cropData.height,
      },
    ]);

    console.log('✅ Crop test successful!', result);
    return true;
  } catch (error) {
    console.error('❌ Crop test failed:', error.message);
    return false;
  }
}

// Export for use in app
export { testCrop };
