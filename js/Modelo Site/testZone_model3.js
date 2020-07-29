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
  console.log("\n --------------- INICIO DO PREPROCESSAMENTO DE DADOS -----------------");
  console.log("Dados do tipo: ");
  console.log(data[0]);
  console.log("\n");

  let training_set = 0.8; // Parcela de treino
	//let test_set = 1 - training_set; // Parcela de teste
	q_train = parseInt(training_set * q_data, 10);
	let q_test = parseInt(q_data - q_train, 10);
  
  
  console.log('Parcela de treinamento: ', training_set*100, '%');
  console.log('Quantidade de dados para treinamento: ', q_train, '\n');

  let X = [];
  let Y = [];
  for(let i = 0; i < q_train; i++){
    let X_epoch, X_open, X_close, X_min, X_max;
    let Y_epoch, Y_open, Y_close, Y_min, Y_max;
    
    

  }




  process.exit()
}

get_history('R_100', 500, 'candles');
