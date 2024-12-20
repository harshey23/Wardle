//const {WebSocketServer} = require('ws');
import {WebSocketServer} from 'ws';
import http from 'http';
//const {http} = reqiure('http');

const server = http.createServer();

const webSockerServer = new WebSocketServer({server});
const port = 8000;

server.listen(port,()=>{console.log('listening on port ' ,port)});