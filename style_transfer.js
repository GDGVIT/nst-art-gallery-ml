const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;
const path = require('path');

class StyleTransfer {
  constructor() {
    this.styleNet = null;
    this.transformNet = null;
  }

  async loadModels() {
    if (!this.styleNet || !this.transformNet) {
      console.log('Loading models...');
      this.styleNet = await tf.loadGraphModel('file://./saved_model_style_inception_js/model.json'); // TODO add option to load different models
      this.transformNet = await tf.loadGraphModel('file://./saved_model_transformer_js/model.json');
      console.log('Models loaded successfully');
    }
  }

  async stylizeImage(contentPath, stylePath, outputPath, styleRatio = 1.0) {
    await this.loadModels();

    const content = await this.loadImage(contentPath);
    const style = await this.loadImage(stylePath);

    const stylized = await tf.tidy(() => {
      const contentTensor = this.preprocessImage(content);
      const styleTensor = this.preprocessImage(style);

      let bottleneck = this.styleNet.predict(styleTensor);
      
      if (styleRatio !== 1.0) {
        const identityBottleneck = this.styleNet.predict(contentTensor);
        bottleneck = this.interpolateBottleneck(identityBottleneck, bottleneck, styleRatio);
      }

      return this.transformNet.predict([contentTensor, bottleneck]).squeeze();
    });

    await this.saveImage(stylized, outputPath);
    tf.dispose([content, style, stylized]);
  }

  async combineStyles(contentPath, style1Path, style2Path, outputPath, styleRatio = 0.5) {
    await this.loadModels();

    const content = await this.loadImage(contentPath);
    const style1 = await this.loadImage(style1Path);
    const style2 = await this.loadImage(style2Path);

    const stylized = await tf.tidy(() => {
      const contentTensor = this.preprocessImage(content);
      const style1Tensor = this.preprocessImage(style1);
      const style2Tensor = this.preprocessImage(style2);

      const bottleneck1 = this.styleNet.predict(style1Tensor);
      const bottleneck2 = this.styleNet.predict(style2Tensor);

      const combinedBottleneck = this.interpolateBottleneck(bottleneck1, bottleneck2, styleRatio);

      return this.transformNet.predict([contentTensor, combinedBottleneck]).squeeze();
    });

    await this.saveImage(stylized, outputPath);
    tf.dispose([content, style1, style2, stylized]);
  }

  async loadImage(imagePath) {
    const imageBuffer = await fs.readFile(imagePath);
    const tfImage = tf.node.decodeImage(imageBuffer);
    return tfImage;
  }

  preprocessImage(image) {
    return image.toFloat().div(tf.scalar(255)).expandDims();
  }

  interpolateBottleneck(bottleneck1, bottleneck2, ratio) {
    return tf.tidy(() => {
      const scaledBottleneck1 = bottleneck1.mul(tf.scalar(1 - ratio));
      const scaledBottleneck2 = bottleneck2.mul(tf.scalar(ratio));
      return scaledBottleneck1.add(scaledBottleneck2);
    });
  }

  async saveImage(tensor, outputPath) {
    const [height, width] = tensor.shape;
    const normalizedTensor = tensor.mul(255).cast('int32');
    const uint8Array = await tf.node.encodeJpeg(normalizedTensor);
    await fs.writeFile(outputPath, uint8Array);
  }
}

module.exports = StyleTransfer;
//TODO: Refactor for prod
