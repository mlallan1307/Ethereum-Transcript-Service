const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..', 'ether_contracts/build/contracts/')));

app.listen(3000, () => console.log('Listening on port 3000!'));
