var crc = require('crc');

function calcularChecksum(buffer) {
	var checksum = (~crc.crc16kermit(buffer, 0xffff)) & 0xffff;
	var buffer = Buffer.allocUnsafe(2);
	buffer.writeUInt16BE(checksum, 0);

	return buffer;
}

console.log(calcularChecksum([0x05, 0x01, 0x00, 0x01]));
console.log(calcularChecksum([0x05, 0x01, 0x00, 0x02]));
