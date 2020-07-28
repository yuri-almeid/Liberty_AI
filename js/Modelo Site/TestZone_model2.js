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
	let q_train = parseInt(training_set * epochs_, 10);
	let q_test = epochs_ - q_train;
	//console.log(q_test,q_train);

	// Definindo matrizes dependentes e independentes
	let X = []; // Matriz das variáveis independentes
	let Y = []; // Matriz das variáveis dependentes
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
			X[i] = [epoch_train[i], price_train[i], parity_train[i]];
			Y[i] = [next_train[i]];
		} else {
			price_test[j] = price[i];
			epoch_test[j] = epoch[i];
			parity_test[j] = parity[i];
			next_test[j] = next[i];
			j = j + 1;
		}
	}


	// Definindo de fato as matrizes
	//X.push(epoch_train, price_train);
	//Y.push(parity_train);
	//console.log('\n');
	console.log('Pre-processamento de dados completo')
	//console.log('Variáveis Independentes: ', X);
  //console.log('Variáveis Dependentes: ', Y);
  
  //console.log(X.length);
  //console.log(Y.length);
  AI_ANN(X, Y, q_train, epoch_test, price_test, parity_test, next_test);
  
  


}

async function AI_ANN(X, Y, q_train, epoch_test, price_test, parity_test, next_test) {
	//console.log('\n');
	console.log('---------TREINAMENTO DA REDE NEURAL ARTIFICIAL ---------')
	let model = null;
	let taxa = 1;
	console.log('Treinamento Iniciado...')
	while (taxa > 0.1) {
		model = tf.sequential(); // Modelo de fluxo de dados da rede
		//console.log('dbg')
		const input = tf.input({shape: [2]});
		const dense1 = tf.layers.dense({units: 2, activation: 'tanh'}).apply(input);
		const dense2 = tf.layers.dense({units: 1, activation: 'sigmoid'}).apply(dense1);
		model = tf.model({inputs: input, outputs: dense2});
		//console.log('dbg')
		//model.add(inputLayer);
		//model.add(hiddenLayer);
		model.compile({ loss: 'meanSquaredError', optimizer: tf.train.rmsprop(.05) }); // 
		//console.log('dbg')

		const x = tf.tensor(X, [parseInt(q_train, 10), 3]);
		//console.log('dbg')
		const y = tf.tensor(Y);
		//console.log('dbg')

		//console.log("Tensores:");
		//console.log('x:', x.print(), '    y:', y.print())

		/*

		for (let i = 1; i <= 1000; i++) {
			let train = await model.fit(x, y);
      taxa = parseFloat(train.history.loss[0]).toFixed(4);
      //taxa = train.history.loss[0];
			if (i % 100 == 0) console.log('taxa de erro: ', taxa);
			if (taxa <= 0.001) i = 1001;
		}
	}
	*/
	model.fit(x, y, {epochs: 500}).then(() => {
		let output = model.predict(input).dataSync();
		output.print();
		output = ordenaDados(output);
	
		console.log(`PREÇO DAS COTAÇOES`);
		console.log(`Fechamento: R$ ${Number(output[0]).toFixed(2)}`);
		console.log(`Abertura:   R$ ${Number(output[1]).toFixed(2)}`);
		console.log(`Máxima:     R$ ${Number(output[2]).toFixed(2)}`);
		console.log(`Mínima:     R$ ${Number(output[3]).toFixed(2)}`);
	});
	

	console.log('\n');
	//model.weights.forEach(w => {
		//console.log(`nome do peso: ${w.name} - dimensionalidade: ${w.shape}`);
	//});
	console.log('\n');
	

}

// FRONTEND --------------------------------------------------------------------------------


get_history('R_50', 150, 'ticks');

function ordenaDados(array) {
	function sortNumber(a, b) {
		return (a - b);
	}

	let fechamento = array[0];
	let abertura   = array[1];
	let maxima     = array[2];
	let minima     = array[3];

	let cotacoes = [fechamento, abertura, maxima, minima];
	cotacoes = cotacoes.sort(sortNumber);

	let menor = cotacoes[0];
	let maior = cotacoes[3];

	if(fechamento<minima) fechamento = minima;
	if(abertura<minima) abertura = minima;
	if(maxima<minima) maxima = minima;
	minima = menor;

	if(fechamento>maxima) fechamento = maxima;
	if(abertura>maxima) abertura = maxima;
	if(minima>maxima) minima = maxima;
	maxima = maior;

	cotacoes = [fechamento, abertura, maxima, minima];
	return cotacoes;
}