var net = require('net');
var moment = require('moment');
var bitwise = require('bitwise');
var crc = require('crc');

function calcularChecksum(buffer) {
	var checksum = (~crc.crc16kermit(buffer, 0xffff)) & 0xffff;
	var buffer = Buffer.allocUnsafe(2);
	buffer.writeUInt16BE(checksum, 0);

	return buffer;
}

var server = net.createServer((socket) => {

	console.log('cliente conectado');

	socket.on('data', (data) => {

		console.log(data);

		if(data.slice(0,2).readInt16BE() == 0x7878) {

			var packetLenght = data[2];
			var protocolNumber = data[3];
			var dados = data.slice(4, packetLenght - 1);

			console.log('tamanho (packetLenght): ' + packetLenght);
			console.log('número do protocolo (protocolo): ' + protocolNumber);


			// Login message
			if(protocolNumber == 0x01) {

				var terminalId = dados;

				console.log('Mensagem de login. Terminal id: ' + terminalId.toString('hex'));
				socket.write(new Buffer([0x78, 0x78, 0x05, 0x01, 0x00, 0x01, 0xD9, 0xDC, 0x0D, 0x0A]));
			}

			// GPS、LBS combined message
			if(protocolNumber == 0x12) {
				console.log('Mensagem gps');

				var gpsInfoLength = dados[6] >>> 4; // os quatro primeiros bits
				var satelliteQuantity = dados[6] & 0x0f; // os quatro últimos bits

				var dateTime = dados.slice(0, 6);
				var gpsInfo = dados.slice(6, 6 + gpsInfoLength);
				console.log(gpsInfo);


				var statusAndHeading = bitwise.readBuffer(gpsInfo.slice(10, 12));

				var realTimeGps = !! statusAndHeading[2];
				var differenceGps = ! realTimeGps;
				var gpsLocated = !! statusAndHeading[3];
				var oesteLongitude = !! statusAndHeading[4];
				var norteLatitude = !! statusAndHeading[5];

				var latitude = gpsInfo.slice(1, 5).readInt32BE() / 60.0 / 30000.0;
				var longitude = gpsInfo.slice(5, 9).readInt32BE() / 60.0 / 30000.0;
				var speed = gpsInfo[9];
				var posicaoDeFuncionamento = gpsInfo.slice(10, 12).readInt16BE() & 0x03ff;

 				if(!norteLatitude) {
					latitude = -latitude;
				}

				if(oesteLongitude) {
					longitude = -longitude;
				}

				var ano = dateTime[0] + 2000;
				var mes = dateTime[1];
				var dia = dateTime[2];
				var hora = dateTime[3];
				var minutos = dateTime[4];
				var segundos = dateTime[5];
				var dataEHora = moment([ano, mes, dia, hora, minutos, segundos]);

				console.log('gpsInfoLength:' + gpsInfoLength);
				console.log('satelliteQuantity: ' + satelliteQuantity);
				console.log('real time gps: ' + (realTimeGps ? 'sim' : 'não'));
				console.log('difference gps:' + (differenceGps ? 'sim' : 'não'));
				console.log('gps located: ' + (gpsLocated ? 'sim' : 'não'));
				console.log('oeste longitude: ' + (oesteLongitude ? 'sim' : 'não'));
				console.log('norte latitude: ' + (norteLatitude ? 'sim' : 'não'));

				console.log('latitude: ' + latitude);
				console.log('longitude: ' + longitude);
				console.log('speed: ' + speed + ' km/h');
				console.log('posição de funcionamento: ' + posicaoDeFuncionamento + 'º');

				console.log(dataEHora.format('DD/MM/YYYY HH:mm:ss'));

				socket.write('');
			}

			// Status message
			if(protocolNumber == 0x13) {
				console.log('Status message packet');

				console.log('terminal message ' + dados[0]);
				console.log('Voltage grade ' + dados[1]);
				console.log('gsm strength grade: ' + dados[2]);

				// socket.write(new Buffer([0x78, 0x78, 0x05, 0x13, 0x00, 0x01, 0x0D, 0x0A, 0x00, 0x11, 0x0D, 0x0A]));
			}
		} else {
			socket.end();
		}

		console.log('');
	});

	socket.on('end', function() {
		console.log('cliente desconectado');
	});

}).on('error', (err) => {
  throw err;
});


server.listen(8080, () => {
  console.log('opened server on', server.address());
});
