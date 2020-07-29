const tf = require('@tensorflow/tfjs');
const WebSocket = require('ws');


var history;

// BACKEND --------------------------------------------------------------------------------

function epochToJsDate(ts) {
	// ts = epoch timestamp
	// returns date obj
	return new Date(ts * 1000);
}

function get_history(sym, periodo, stl) {
	var ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
	//console.log(periodo);
	periodo = parseInt(periodo, 10) + 1;
	//console.log(periodo);

	ws.onopen = function (evt) {
		ws.send(JSON.stringify({
			ticks_history: sym,
			adjust_start_time: 1,
			count: periodo,
			end: "latest",
			start: 1,
			style: stl
		}));
	};
	ws.onmessage = function (msg) {
		var data = JSON.parse(msg.data);
		if (stl === 'ticks') {
		} else if (stl === 'candles') {
      history = data.candles;
      preprocessing(history, periodo);

		} else { console.log('Falha na aquisição dos dados!') }
	};
}

function preprocessing(data, q_data){
  console.log("\n --------------- INICIO DO PREPROCESSAMENTO DE DADOS -----------------\n");
  console.log("Dados do tipo: ");
  console.log(data[0]);
  console.log("\n");

  // Definindo parcela de treino e teste
  let training_set = 0.8; // Parcela de treino
	//let test_set = 1 - training_set; // Parcela de teste
	q_train = parseInt(training_set * q_data, 10);
	let q_test = parseInt(q_data - q_train, 10);
  
  console.log('Parcela de treinamento: ', training_set*100, '%');
  console.log('Quantidade de dados para treinamento: ', q_train, '\n');

  // Definindo matrizes de variáveis dependentes e independentes
  let X = [];
  let Y = [];
  for(let i = 0; i < q_train; i++){
    let X_epoch, X_open, X_close, X_min, X_max;
    let Y_epoch, Y_open, Y_close, Y_min, Y_max;

    X_epoch = data[i].epoch;
    X_open = data[i].open;
    X_close = data[i].close;
    X_min = data[i].low;
    X_max = data[i].high;

    X.push([X_close, X_open, X_max, X_min]);

    Y_epoch = data[i + 1].epoch;
    Y_open = data[i + 1].open;
    Y_close = data[i + 1].close;
    Y_min = data[i + 1].low;
    Y_max = data[i + 1].high;

    Y.push([Y_close, Y_open, Y_max, Y_min]);
  }
  console.log('Fim do Preprocessamento de dados.')
  nnModel2(X, Y, q_train);
    
}

async function nnModel1(X, Y, q){
  console.log("\n ----------------------- INICIO DA RNA1 -----------------------");
  let model = null;

  const x = tf.tensor(X, [q, 4]);
  const y = tf.tensor(Y);

  let taxa = 1;
	while (taxa > 0.1) {
		model = tf.sequential();
		const inputLayer = tf.layers.dense({units: 8, inputShape: [4], optimizer: 'linear'});
    const hiddenLayer = tf.layers.dense({units: 4, inputShape: [8], optimizer: 'linear'});
    model.add(inputLayer);
    model.add(hiddenLayer);
    model.summary();
    model.compile({loss: tf.losses.meanSquaredError, optimizer: tf.train.sgd(.0005)});

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

	//let output = model.predict(z).round();
	//output.print();
  

  
  console.log('\n\n');
  process.exit()
}

async function nnModel2(X, Y, q){
  console.log("\n ----------------------- INICIO DA RNR -----------------------");
  let model = tf.sequential();
  const x = tf.tensor(X);
	const y = tf.tensor(Y);
  const rnn = tf.layers.simpleRNN({units: 1, returnSequences: true, activation: 'linear'});
	const inputLayer = tf.input({shape: [X[0].length, 1]});
	rnn.apply(inputLayer);

  model.add(rnn);
  console.log("\nSumário da rede:");
  model.summary();
  let taxa;
	model.compile({loss: 'meanSquaredError', optimizer: tf.train.sgd(.001)});
	for(let i=1; i<=20000; i++) {
    let train = await model.fit(x, y);
    taxa = parseFloat(train.history.loss[0]).toFixed(4);
			if(i%10==0)
				console.log(`taxa de erro: ${taxa}`);
	}  
}

get_history('R_100', 500, 'candles');

/*
(async() => {
	await treino();
	await predizer();
})();
*/