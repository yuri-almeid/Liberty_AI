/*
function computeSMA(data,window_size){
    let r_avgs=[];
    let avg_prev=0;
    for(let i=0;i<data.length-window_size;i++){
         let curr_avg=0.00;
         let t=i+window_size;
         for(let j=i;j<t && j<=data.length;j++){
          curr_avg+=data[j]['price']/window_size;
         }
         let sma={
         set:data.slice(i,i+window_size),
         avg:curr_avg
         }
    r_avgs.push(sma);
    avg_prev=curr_avg;
    }
    return r_avgs;
  }

//train model
async trainModel(model_params,callback){

    let inputs=model_params['inputs'];  
    let outputs=model_params['outputs'];
    let trainingsize=model_params['input_trainingsize'];
    let window_size=model_params['input_windowsize'];
    let n_epochs=model_params['input_epoch'];
    let learning_rate=model_params['input_learningrate'];
    let n_layers=model_params['input_hiddenlayers'];

    const input_layer_shape=window_size;
    const input_layer_neurons=50;
    const rnn_input_layer_features=10;
    const rnn_input_layer_timesteps=input_layer_neurons/rnn_input_layer_features;
    const rnn_input_shape=[rnn_input_layer_features,rnn_input_layer_timesteps];
    const rnn_output_neurons=20;
    const rnn_batch_size=window_size;
    const output_layer_shape=rnn_output_neurons;
    const output_layer_neurons=1;

    let X=inputs.slice(0,Math.floor(trainingsize/100 *inputs.length));
    let Y=outputs.slice(0,Math.floor(trainingsize/100 * outputs.length));

    console.log(X);
    console.log(X.length+" "+X[0].length);

    const xs=tf.tensor2d(X,[X.length,X[0].length]).div(tf.scalar(10));
    const ys=tf.tensor2d(Y,[Y.length,1]).reshape([Y.length,1]).div(tf.scalar(10));
    const model=tf.sequential();

    model.add(tf.layers.dense({units:input_layer_neurons,inputShape:[input_layer_shape]}));
    model.add(tf.layers.reshape({targetShape:rnn_input_shape}));

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
    
    model.compile({
    optimizer: tf.train.adam(learning_rate),
    loss: 'meanSquaredError'
    });

    const hist = await model.fit(xs, ys,
    { batchSize: rnn_batch_size, epochs: n_epochs, callbacks: {
    onEpochEnd: async (epoch, log) => {
    callback(epoch, log, model_params);
    }
    }
    });

    // await model.save('localstorage://tfjs-stocks');
    // const model = await tf.loadLayersModel('localstorage://tfjs-stocks');
    // const hist = {};
    return { model: model, stats: hist };
}
*/

// Exemplo para extrair 'Laranja' e 'Limao' do array frutas
var bruto = [1,2,3,4,5,6,7,8,9,10];

slicer(bruto, 5);

// citricos contem ['Laranja','Limao']

function slicer(vec, number){
  let X = [];
  for(i = 0; i <= vec.length - number; i++){
    let aux = vec.slice(i, i + number);
    X.push(aux);
  }
  console.log(X);
}