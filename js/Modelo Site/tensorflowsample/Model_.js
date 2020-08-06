
// Definindo variáveis gobais
const window_size = 4;
const n_layers = 4;
const n_epochs = 15;
const learning_rate = 0.01;

const input_layer_shape  = window_size;
const input_layer_neurons = 100;
const rnn_input_layer_features = 10;
const rnn_input_layer_timesteps = input_layer_neurons / rnn_input_layer_features;
const rnn_input_shape  = [rnn_input_layer_features, rnn_input_layer_timesteps];
const rnn_output_neurons = 20;
const rnn_batch_size = window_size;
const output_layer_shape = rnn_output_neurons;
const output_layer_neurons = 1;



function getHistory(sym, periodo, stl) {
  console.log('------------- COLETA DE DADOS -------------');
  let history;
	var ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
	//console.log(periodo);
	periodo = parseInt(periodo, 10);
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
			//AI_preprocessing_tk(history, periodo);
		} else if (stl === 'candles') {
      history = data.candles;
      console.log("Dados Coletados com sucesso.");
      //console.log(history);
      dataPreprocessing(history);

		} else { console.log('Falha na aquisição dos dados!') }
	};
}

function dataPreprocessing(data_raw){
  console.log('--------- PRE-PROCESSAMENTO DOS DADOS ---------');
  // Criação das Matrizes X e Y
  let X = [];
  let Y = [];
  
  // Coleta dados de fechamento do banco de dados bruto
  let close_ = [];
  let epoch_ = [];
  for(i = 0; i < data_raw.length; i++){
    close_.push(parseFloat(data_raw[i].close, 5));
    epoch_.push(data_raw[i].epoch)
  }

  // Plot dos dados brutos
  const values = data_raw.map(d => ({
    x: d.epoch,
    y: d.close,
  }));
  tfvis.render.linechart(
    {name: 'Dados Brutos'},
    {values}, 
    {
      zoomToFit: true,
      xLabel: 'Data',
      yLabel: 'Fechamento',
      height: 300,
      width: 500
    }
  );
  
  // Cria o vetor X
  for (i = 0; i <= close_.length - window_size; i++){
    var aux = close_.slice(i, i + window_size);
    X.push(aux);
  }

  // Calcula média móvel de cada elemento X
  const arrAvg = arr => arr.reduce((a,b) => a + b, 0)/arr.length;
  for (i = 0; i < X.length; i++){
    aux = arrAvg(X[i]);
    Y.push(parseFloat(aux.toFixed(5)));
  }
  console.log("Matriz X (input): ")
  console.log(X);
  console.log("Matriz Y (label): ")
  console.log(Y);

  // Plot da média móvel -----
  // Cria Json
  let Y_json = [];
  for (i = 0; i < Y.length; i++){
    Y_json[i] = {
      epoch : epoch_[i],
      Y : Y[i]
    }
  }
  ///console.log(Y_json)
  const sma = Y_json.map(d => ({
    x: d.epoch, y: d.Y,
  }));
  tfvis.render.linechart(
    {name: 'Media movel'}, 
    {values: [values, sma], series: ['Preco', 'SMA']}, 
    {
      zoomToFit: true,
      xLabel: 'Data',
      yLabel: 'Fechamento',
      height: 300,
      width: 500
    }
  );

  console.log("Preprocessamento dos dados concluido.");
  
  // Chama funcao principal
  const model = await aiModel(X, Y);

  console.log('Modelo treinado com sucesso');

}


async function aiModel(X, Y){
  console.log('--------- CRIACAO DO MODELO ---------');

  const model = tf.sequential();
  const x = tf.tensor2d(X, [X.length, X[0].length]).div(tf.scalar(10));
  const y = tf.tensor2d(Y, [Y.length, 1]).reshape([Y.length, 1]).div(tf.scalar(10));
  
  model.add(tf.layers.dense({units: input_layer_neurons, inputShape: [input_layer_shape]}));
  model.add(tf.layers.reshape({targetShape: rnn_input_shape}));
  
  let lstm_cells = [];
  for (let index = 0; index < n_layers; index++) {
        lstm_cells.push(tf.layers.lstmCell({units: rnn_output_neurons}));
  }
  
  model.add(tf.layers.rnn({
    cell: lstm_cells,
    inputShape: rnn_input_shape,
    returnSequences: false
  }));
  
  model.add(tf.layers.dense({units: output_layer_neurons, inputShape: [output_layer_shape]}));

  tfvis.show.modelSummary({name: 'Sumario do Modelo'}, model);

  console.log("Modelo Criado com Sucesso");

  
  console.log('--------- TREINAMENTO DO MODELO ---------');
  
  model.compile({
    optimizer: tf.train.adam(learning_rate),
    loss: 'meanSquaredError'
  });

  const hist = await model.fit(x, y,
    { batchSize: rnn_batch_size, 
      epochs: n_epochs, 
      callbacks: tfvis.show.fitCallbacks(
        { name: 'Performance de Treinamento' },
        ['loss'], 
        { height: 200, 
          callbacks: ['onEpochEnd'] 
        }
      )
  });

  return { model: model, stats: hist };  
  
}


getHistory('frxAUDCAD', 300, 'candles');



