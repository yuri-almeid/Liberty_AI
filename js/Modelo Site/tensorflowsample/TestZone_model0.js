const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const WebSocket = require('ws');

let X = []; // Matriz das variáveis independentes
let Y = []; // Matriz das variáveis dependentes

let arrInput = [];
let q_train;

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
			history = data.history;
			AI_preprocessing_tk(history, periodo);
		} else if (stl === 'candles') {
			history = data.candles;

		} else { console.log('Falha na aquisição dos dados!') }
	};
}

function AI_preprocessing_tk(data, epochs_) {

	console.log('--------- PRE-PROCESSAMENTO DOS DADOS ---------')
  //console.log('Dados coletados: ', data)
  console.log('Dados coletados');
	let price = []; // dados de preços
	let parity = []; // dados de paridade
	let next = []; // dados da próxima paridade
	let epoch = []; // dados de epocas
	let datetime = []; // dados de data e hora
	let aux = []; // variável auxiliar
	let residu; // variavel auxiliar

	for (var i = 0; i < epochs_; i++) {
		// Coleta dados da entrada
		price[i] = data.prices[i];
		epoch[i] = data.times[i];
		datetime[i] = epochToJsDate(data.times[i])

		// Define paridade de cada dado
		aux[i] = parseInt(data.prices[i] * 10000, 10);
		//aux[i] = data.prices[i] * 10000;
		residu = aux[i] % 2;
		if (residu === 0) {
			//par
			parity[i] = 0;
		} else {
			//impar
			parity[i] = 1;
		}
	}

	for (i = 0; i < epochs_ - 1; i++) {
		next[i] = parity[i + 1];
	}
	next[epochs_ - 1] = 0; // ultimo valor não é correto

	// Apaga o ultimo item do array
	parity.pop();
	price.pop();
	epoch.pop();
	datetime.pop();
	next.pop();

	//console.log([price, aux, epoch, datetime, parity, next])
	// Plot no grafico
	//$w("#ativo").postMessage([epoch, price]);

	// Definindo parte dos dados que será usada para treino e parte dos dados que será usada para teste
	let training_set = 0.8; // Parcela de treino
	let test_set = 1 - training_set; // Parcela de teste
	q_train = parseInt(training_set * epochs_, 10);
	let q_test = epochs_ - q_train;
	//console.log(q_test,q_train);

	// Definindo matrizes dependentes e independentes
	let full_train = []; // Array com todos os dados do treinamento
	let price_train = []; // Array com preço para treinamento
	let epoch_train = []; // Array com epoca para treinamento
	let parity_train = []; // Array com paridade para treinamento
	let next_train = []; // Array com proximo valor para treinamento
	let price_test = []; // Array com preço para teste
	let epoch_test = []; // Array com epoca para teste
	let parity_test = []; // Array com paridade para teste
	let next_test = []; // Array com proximo valor para teste
	let j = 0; // Variável auxiliar

	for (i = 0; i < epochs_; i++) {
		if (i < q_train) {
			price_train[i] = price[i];
			epoch_train[i] = epoch[i];
			parity_train[i] = parity[i];
			next_train[i] = next[i];
			full_train[i] = [epoch_train[i], price_train[i], parity_train[i], next_train[i]]
		} else {
			price_test[j] = price[i];
			epoch_test[j] = epoch[i];
			parity_test[j] = parity[i];
      next_test[j] = next[i];
      //console.log("TESTE ", j, ': ',epoch_test[j] ,price_test[j] ,parity_test[j], next_test[j])
			j = j + 1;
		}
	}

	// Testando metodo de separação de variaveis focado em previsão

	for (i = 0; i < q_train; i++) {
		X.push(full_train[i]);
		Y.push(full_train[i + 1]);
  }
  Y.pop();
  Y.push([epoch_test[0], price_test[0], parity_test[0], next_test[0]])
  
  
  arrInput = [epoch_test[j], price_test[j], parity_test[j], next_test[j]];
  console.log("Fim do preprocessamento de dados")
  //return X
  main();
}


async function main(){

	let model = null;

  console.log(X);
	console.log(Y);
	
	
	const x = tf.tensor(X, [q_train, 4]);
	//console.log("ok");
	const y = tf.tensor(Y); 

	// 09.05.2019
	//const arrInput = [[26.68, 26.87, 26.92, 26.42]]; // 10.05.2019
	const input = tf.tensor(arrInput, [1, 4]);  
	
	let taxa = 1;
	while (taxa > 0.1) {
		/*
		model = tf.sequential();
		const inputLayer = tf.layers.dense({units: 16, inputShape: [4], activation: 'softmax'});
		const hiddenLayer = tf.layers.dense({units: 4, inputShape: [16], activation: 'softplus'});
		model.add(inputLayer);
		model.add(hiddenLayer);
		const learningRate = 0.005;
		const optimizer = tf.train.sgd(learningRate); 

		//console.log("ok");
		model.compile({loss:tf.losses.absoluteDifference , optimizer: optimizer});  


		for(let i=1; i<=1000; i++) {
			let train = await model.fit(x, y);
			taxa = parseFloat(train.history.loss[0]).toFixed(4);
			if (i % 100 == 0) console.log('taxa de erro: ', taxa);
			if (taxa <= 0.001) i = 1001;
		}
	}
	


	console.log("shit");
  let output = model.predict(input).round();
	//output.print;
	*/
	model = tf.sequential({
		layers: [
			tf.layers.dense({units: 8, inputShape: [4], activation: 'softmax'}),
			tf.layers.dense({units: 4, inputShape: [8], activation: 'softplus'}),
			//tf.layers.dense({units: 8, inputShape: [4], activation: 'softplus'}),
		]
	});
	model.compile({loss: tf.losses.meanSquaredError, optimizer: tf.train.adamax(0.01)});

	for(let i=1; i<=1000; i++) {
		let train = await model.fit(x, y);
		taxa = parseFloat(train.history.loss[0]).toFixed(4);
		if (i % 10 == 0) console.log('taxa de erro: ', taxa);
			if (taxa <= 0.001) i = 1001;
	}
}

let output = model.predict(input).round();
output.print();

}

get_history('R_50', 500, 'ticks');



