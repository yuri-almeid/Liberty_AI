import { sequential, tensor, layers, input as _input, train } from '@tensorflow/tfjs';
import { readFileSync } from 'fs';

let model = sequential();

async function treino() {
	let X = [];
	let Y = [];

	let arquivo1 = readFileSync('bitcoin01.csv', {encoding: 'utf8'});
	arquivo1 = arquivo1.toString().trim();

	const linhas1 = arquivo1.split('\r\n');

	for(let l=linhas1.length-1; l>=1; l--) {
		let celulas = linhas1[l].toString().split(';');

		const Fechamento = Number(celulas[1]);
		const Abertura   = Number(celulas[2]);
		const Maxima     = Number(celulas[3]);
		const Minima     = Number(celulas[4]);

		X.push([[Fechamento], [Abertura], [Maxima], [Minima]]);
	}

	let arquivo2 = readFileSync('bitcoin02.csv', {encoding: 'utf8'});
	arquivo2 = arquivo2.toString().trim();

	const linhas2 = arquivo2.split('\r\n');

	for(let l=linhas2.length-1; l>=1; l--) {
		let celulas = linhas2[l].toString().split(';');

		const Fechamento = Number(celulas[1]);
		const Abertura   = Number(celulas[2]);
		const Maxima     = Number(celulas[3]);
		const Minima     = Number(celulas[4]);

		Y.push([[Fechamento], [Abertura], [Maxima], [Minima]]);
	}

	const x = tensor(X);
	const y = tensor(Y);

	const rnn = layers.simpleRNN({units: 1, returnSequences: true, activation: 'linear'});
	const inputLayer = _input({shape: [X[0].length, 1]});
	rnn.apply(inputLayer);

	model.add(rnn);

	model.compile({loss: 'meanSquaredError', optimizer: train.adam(.001)});
	for(let i=1; i<=20000; i++) {
		await model.fit(x, y);
	}
}

async function predizer() {
	let X = [];

	let arquivo = readFileSync('bitcoin03.csv', {encoding: 'utf8'});
	arquivo = arquivo.toString().trim();

	const linhas = arquivo.split('\r\n');

	for(let l=linhas.length-1; l>=1; l--) {
		let celulas = linhas[l].toString().split(';');

		const Fechamento = Number(celulas[1]);
		const Abertura   = Number(celulas[2]);
		const Maxima     = Number(celulas[3]);
		const Minima     = Number(celulas[4]);

		X.push([[Fechamento], [Abertura], [Maxima], [Minima]]);
	}

	const input = tensor(X);

	const output = await model.predict(input).abs().arraySync();

	const hoje = new Date();
	console.log(`Data       - Fechamen - Abertura - Máxima   -   Minima`);
	console.log(`------------------------------------------------------`);
	for(let i=0; i<output.length; i++) {
		let data = new Date(hoje.setDate(hoje.getDate()+i));
		let dia = data.getDate();
		let mes = data.getMonth();
		let ano = data.getFullYear();
		let corrente = dia+'/'+mes+'/'+ano;

		const Fechamento = parseFloat(output[i][0]).toFixed(1);
		const Abertura   = parseFloat(output[i][1]).toFixed(1);
		const Maxima     = parseFloat(output[i][2]).toFixed(1);
		const Minima     = parseFloat(output[i][3]).toFixed(1);

		console.log(`${corrente.padEnd(10, ' ')} - ${Fechamento.padEnd(8, ' ')} - ${Abertura.padEnd(8, ' ')} - ${Maxima.padEnd(8, ' ')} - ${Minima.padStart(7, ' ')}`);	
	}
}

(async() => {
	await treino();
	await predizer();
})();
