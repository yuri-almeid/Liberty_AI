const tf = require('@tensorflow/tfjs');
async function load() {
    const model = await tf.loadLayersModel('https://drive.google.com/file/d/13T-9-RfcFYDUxhCPxyOEUR0fe_CVsNdl/view?usp=sharing');
    console.log(model);
}

load();