const tf = require('@tensorflow/tfjs');

const model = tf.sequential();
model.add(tf.layers.dense({units: 1, inputShape: [1], activation: 'sigmoid'}));
model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

const x = tf.tensor([1, 0], [2, 1]);
const y = tf.tensor([[0], [1]]);
const z = tf.tensor([1]);

model.fit(x, y, {epochs: 750}).then(() => {
	let output = model.predict(z).round();
	output.print();
});
