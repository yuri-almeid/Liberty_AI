
// Definindo variáveis gobais ------------------------------------------------------------
// Variáveis de configuração (Pode mexer)
//const symbol_ = 'frxEURCAD';        // Ativo
const symbol_ = 'frxEURCAD';             // Ativo
const data_size = 600;              // Quantidade de dados
const window_size = 20;             // Tamanho da média móvel
const n_layers = 4;                 // Número de camadas ocultas
const n_epochs = 4;                // Número de épocas de treinamento
const learning_rate = 0.02;         // Taxa de aprendizado
const training_size = 85;           // Tamanho da parcela de treino em %

// Plota definicoes
console.log('------------- LIBERTY AI -------------');
console.log("Ativo: ", symbol_);
console.log("Quantidade de dados: ", data_size);
console.log("Janela da SMA: ", window_size);
console.log("Numero de camadas ocultas: ", n_layers);
console.log("Numero de epocas: ", n_epochs);
console.log("Taxa de aprendizado: ", learning_rate);
console.log("Parcela de treinamento (%): ", training_size);

// Variáveis de dimensionamento (Não pode mexer)
const input_layer_shape  = window_size;                                               // Tamanho da camada de entrada
const input_layer_neurons = 100;                                                      // Quantidade de neurons da entrada
const rnn_input_layer_features = 10;                                                  // Quantidade de recurso da rede neural recorrente
const rnn_input_layer_timesteps = input_layer_neurons / rnn_input_layer_features;     // Quantidade de "Passos de tempo" da RNR
const rnn_input_shape  = [rnn_input_layer_features, rnn_input_layer_timesteps];       // Tamanho da camada de entrada da RNR
const rnn_output_neurons = 20;                                                        // Quantidade de neurônios da saída da RNR
const rnn_batch_size = window_size;                                                   // Tamanho do "lote" de dados
const output_layer_shape = rnn_output_neurons;                                        // Tamanho da camada de saída
const output_layer_neurons = 1;                                                       // Quantidade de Neurônios na camada de saída


// Função usada para mostrar apenas 10 valores do banco e mostrar o seu tamanho
function showData(data){
  // Cria variável auxiliar
  let newData = [];
  // Seleciona apenas os primeiros 10 valores
  for (i = 0; i < 10; i++){
    newData[i] = data[i];
  }
  // Plota no dados no console 
  console.log(newData);
  // Plota tamanho dos dados no console
  console.log(data.length);
}

// Função que faz conexão com a corretora e coleta o histórico do ativo
function getHistory(sym, periodo, stl) {
  console.log('------------- COLETA DE DADOS -------------');
  let history;
  // Cria canal com a corretora
	var ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
  //console.log(periodo);
  // Passa o período para inteiro
	periodo = parseInt(periodo, 10);
	//console.log(periodo);

  // Manda JSON para corretora
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
  
  // Função de evento de recebimento de dado da corretora
	ws.onmessage = function (msg) {
    // Recebe dados 
		var data = JSON.parse(msg.data);
		if (stl === 'ticks') {
      // Nessa condição o codigo não faz absolutamente nada
			history = data.history;
			//AI_preprocessing_tk(history, periodo);
		} else if (stl === 'candles') {
      // Manda dados recebidos pra funcao de preprocessamento de dados 
      history = data.candles;
      console.log("Dados Coletados com sucesso.");
      //console.log(history);
      dataPreprocessing(history);

		} else { console.log('Falha na aquisição dos dados!') }
	};  
}

// Função do preprocessamento dos dados
async function dataPreprocessing(data_raw){
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
    {name: 'Raw Data'},
    {values}, 
    {
      zoomToFit: true,
      xLabel: 'Time',
      yLabel: 'Close',
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
  showData(X);
  console.log("Matriz Y (label): ")
  showData(Y);

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
    {name: 'Simple Moving Average'}, 
    {values: [values, sma], series: ['Preco', 'SMA']}, 
    {
      zoomToFit: true,
      xLabel: 'Time',
      yLabel: 'Close',
      height: 300,
      width: 500
    }
  );

  console.log("Preprocessamento dos dados concluido.");
  
  // Chama funcao principal
  main(X,Y,epoch_, values, sma);
}

// Funcão que cria e treina o modelo
async function aiModel(X, Y){
  console.log('--------- CRIACAO DO MODELO ---------');

  
  // Cria modelo
  const model = tf.sequential();
  // Cria e normaliza tensores de entradas
  //const {x, y} = await convertToTensor(X, Y);

  console.log("Tensores nao normalizados");
  const inputTensor = tf.tensor2d(X, [X.length, X[0].length]);
  //tf.print(inputTensor);
  const labelTensor = tf.tensor2d(Y, [Y.length, 1]).reshape([Y.length, 1]);
  tf.print(labelTensor);

  const inputMax = inputTensor.max();
  const inputMin = inputTensor.min();  
  const labelMax = labelTensor.max();
  const labelMin = labelTensor.min();
  const x = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
  const y = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));
  
  console.log("Tensores normalizados")
  //tf.print(x);
  tf.print(y);
  const max = labelMax;
  const min = labelMin;

  //console.log("Valor Minimo:");
  //tf.print(min);
  //console.log("Valor Maximo:");
  //tf.print(max);
  
  //tf.print();
  //tf.print(y.min());
  //const x = tf.tensor2d(X, [X.length, X[0].length]).div(tf.scalar(10));
  //const y = tf.tensor2d(Y, [Y.length, 1]).reshape([Y.length, 1]).div(tf.scalar(10));
  
  // Adiciona ao modelo a camada de entrada e redimensiona a uma RNR
  model.add(tf.layers.dense({units: input_layer_neurons, inputShape: [input_layer_shape]}));
  model.add(tf.layers.reshape({targetShape: rnn_input_shape}));
  
  // Cria camadas ocultas
  let lstm_cells = [];
  for (let index = 0; index < n_layers; index++) {
        lstm_cells.push(tf.layers.lstmCell({units: rnn_output_neurons}));
  }
  
  // Adiciona camadas ocultas ao modelo
  model.add(tf.layers.rnn({
    cell: lstm_cells,
    inputShape: rnn_input_shape,
    returnSequences: false
  }));
  
  // Cria camada de saída
  model.add(tf.layers.dense({units: output_layer_neurons, inputShape: [output_layer_shape]}));

  // Mostra resumo do modelo
  tfvis.show.modelSummary({name: 'Model Summary'}, model);

  console.log("Modelo:");
  console.log(model);

  
  // Compila o modelo para o treinamento
  model.compile({
    optimizer: tf.train.adam(learning_rate),
    loss: 'meanSquaredError'
  });
  console.log("Modelo Criado com Sucesso");

  console.log('--------- TREINAMENTO DO MODELO ---------');
  console.log("Aguarde o fim do treinamento.")
  // Treina o modelo
  const hist = await model.fit(x, y,
    { batchSize: rnn_batch_size, 
      epochs: n_epochs, 
      callbacks: tfvis.show.fitCallbacks(
        { name: 'Training Performance' },
        ['loss'], 
        { height: 200, 
          callbacks: ['onEpochEnd'] 
        }
      )
  });

  return { model: model, stats: hist, min: min, max: max};  
  
}

async function validate(X, Y, epochs, model, real, sma, max, min){
  // Validade model
  console.log('--------- VALIDACAO DO MODELO ---------');
  let val_train_x = X.slice(0, Math.floor(training_size / 100 * X.length));
  //console.log("Banco de treinamento (inputs):");
  //showData(val_train_x);
  let val_train_y = await makePredictions(val_train_x, model, max, min);
  console.log("Banco de treinamento (outputs):");
  showData(val_train_y);

  // validate on unseen
  let val_unseen_x = X.slice(Math.floor(training_size / 100 * X.length), X.length);
  //console.log("Banco de teste (inputs):");
  //showData(val_unseen_x);
  let val_unseen_y = await makePredictions(val_unseen_x, model, max, min );
  console.log("Banco de teste (outputs):");
  showData(val_unseen_y);
  //tf.print(val_unseen_y);


  
  // Plot da validação -----
  // Cria Json dos dados de treinamento
  let epoch_trainY = epochs.slice(0, Math.floor(training_size / 100 * X.length));
  let trainY_json = [];
  for (i = 0; i < epoch_trainY.length; i++){
    trainY_json[i] = {
      time : epoch_trainY[i],
      Y : val_train_y[i]
    }
  }
  const train_values = trainY_json.map(d => ({
    x: d.time, y: d.Y,
  }));

  // Cria Json dos dados de teste
  let epoch_validY = epochs.slice(Math.floor(training_size / 100 * X.length), X.length);
  let validY_json = [];
  for (i = 0; i < epoch_validY.length; i++){
    validY_json[i] = {
      time : epoch_validY[i],
      Y : val_unseen_y[i]
    }
  }
  const valid_values = validY_json.map(d => ({
    x: d.time, y: d.Y,
  }));




  tfvis.render.linechart(
    {name: 'Validation'}, 
    {values: [real, sma, train_values, valid_values], series: ['Original', 'SMA' ,'Train Data', 'Validate Data']}, 
    {
      zoomToFit: true,
      xLabel: 'Time',
      yLabel: 'Close',
      height: 300,
      width: 500
    }
  );

}


async function makePredictions(X, model, max, min)
{
  console.log("Fazendo predicao...");

  // Criando e normalizando tensor
  const XTensor = tf.tensor2d(X, [X.length, X[0].length]);
  const inputMax = XTensor.max();
  const inputMin = XTensor.min();  
  const x = XTensor.sub(inputMin).div(inputMax.sub(inputMin));
  //tf.print(max);
  //tf.print(min);
  //Fazendo predição
  const predictedResults = model.predict(x);
  //tf.print(predictedResults);

  const unNormPred = predictedResults.mul(max.sub(min)).add(min);

  //showData(unNormPred)
  //tf.print(unNormPred)
  
  const output = Array.from(unNormPred.dataSync());

  console.log("Predicao concluida:")
  //showData(output);
  //tf.print(output);
  return output;
}

async function main(X, Y, epochs, real, sma){

  // Chama função que cria e treina o modelo
  const result = await aiModel(X, Y);
  console.log('Modelo treinado com sucesso');

  // Chama função de validação do modelo
  await validate(X, Y, epochs, result.model, real, sma, result.max, result.min);

  // Salva modelo
  await result.model.save('downloads://my-model');

}



getHistory(symbol_, data_size, 'candles');



