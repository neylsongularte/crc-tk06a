# crc-tk06a

gcc crc16.c -o ok && ./ok


## In nodejs:
```` js
var crc = require('crc');
console.log(((~crc.crc16kermit([0x05, 0x01, 0x00, 0x01], 0xffff)) & 0xffff).toString(16));
```
