const tf = require('@tensorflow/tfjs');

// modelo testando otimizador
async function NeuralNetwork1() {
	let model = null;

	const x = tf.tensor([[1], [2], [3], [4]]);
	const y = tf.tensor([[9], [18], [27], [36]]);
	const z = tf.tensor([[5], [6], [7], [8]]);

	let taxa = 1;
	while(taxa>0.1) {
		model = tf.sequential();
		model.add(tf.layers.dense({units: 1, inputShape: [1]}));
		model.compile({loss: tf.losses.meanSquaredError, optimizer: tf.train.rmsprop(.05)});

		for(let i=1; i<=1000; i++) {
			let train = await model.fit(x, y);
      taxa = parseFloat(train.history.loss[0]).toFixed(4);
			if (i % 10 == 0) console.log('taxa de erro: ', taxa);
      //console.log(taxa);
		}
	}

	let output = model.predict(z).round();
	output.print();
}

// modelo aplicando hiddenlayers
async function NeuralNetwork2() {
	let model = null;

	const x = tf.tensor([[0, 0], [0, 1], [1, 0], [1, 1]]);
	const y = tf.tensor([[0], [1], [1], [0]]);
	const z = tf.tensor([[0, 0], [0, 1], [1, 0], [1, 1]]);

	let taxa = 1;
	while(taxa>0.1) {
		const input = tf.input({shape: [2]});
		const dense1 = tf.layers.dense({units: 2, activation: 'tanh'}).apply(input);
		const dense2 = tf.layers.dense({units: 1, activation: 'sigmoid'}).apply(dense1);
		model = tf.model({inputs: input, outputs: dense2});

		model.compile({loss: tf.losses.meanSquaredError, optimizer: tf.train.rmsprop(.05)});

		for(let i=1; i<=1000; i++) {
			let train = await model.fit(x, y);
			taxa = parseFloat(train.history.loss[0]).toFixed(4);
			if(i%10==0) console.log(`taxa de erro: ${taxa}`);
			if(taxa==0) {
				i=1001;
				console.log(`taxa de erro: 0.0000`);
			}
		}
	}

	let output = model.predict(z).round();
	output.print();
}

// Modelo testando HL de outra forma
async function NeuralNetwork3() {
	let model = null;

	const x = tf.tensor([[0, 0], [0, 1], [1, 0], [1, 1]]);
	const y = tf.tensor([[0], [1], [1], [0]]);
	const z = tf.tensor([[0, 0], [0, 1], [1, 0], [1, 1]]);

	let taxa = 1;
	while(taxa>0.1) {
		model = tf.sequential({
			layers: [
				tf.layers.dense({units: 2, inputShape: [2], activation: 'tanh'}),
				tf.layers.dense({units: 1, inputShape: [2], activation: 'sigmoid'})
			]
		});
		model.compile({loss: tf.losses.meanSquaredError, optimizer: tf.train.rmsprop(.05)});

		for(let i=1; i<=1000; i++) {
			let train = await model.fit(x, y);
			taxa = parseFloat(train.history.loss[0]).toFixed(4);
			if(i%10==0)
				console.log(`taxa de erro: ${taxa}`);
		}
	}

	let output = model.predict(z).round();
	output.print();
}

// Modelo plot do bias
async function NeuralNetwork4() {
	let model = null;

	const x = tf.tensor([
		[0, 0],
		[0, 1],
		[1, 0],
		[1, 1]
	]);
	const y = tf.tensor([
		[0],
		[1],
		[1],
		[0]
	]);
	const z = tf.tensor([
		[1, 0],
		[0, 1],
		[0, 0],
		[1, 1]
	]);

	let taxa = 1;
	while (taxa > 0.1) {
		model = tf.sequential();
		const inputLayer = tf.layers.dense({units: 8, inputShape: [4]});
	const hiddenLayer = tf.layers.dense({units: 4, inputShape: [8]});
	model.add(inputLayer);
	model.add(hiddenLayer);
	model.compile({loss: tf.losses.absoluteDifference, optimizer: tf.train.sgd(.00005)});

		for (let i = 1; i <= 1000; i++) {
			let train = await model.fit(x, y);
			taxa = parseFloat(train.history.loss[0]).toFixed(4);
			if (i % 10 == 0) console.log('taxa de erro: ', taxa);
			if (taxa <= 0.001) i = 1001;
		}
	}

	console.log('----------------------------------------------------------');
	model.weights.forEach(w => {
		console.log(`nome do peso: ${w.name} - dimensionalidade: ${w.shape}`);
	});
	console.log('----------------------------------------------------------');

	let output = model.predict(z).round();
	output.print();
}

NeuralNetwork3();
