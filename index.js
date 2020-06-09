const webSocketsServerPort = 1597
const webSocketsServer = require('websocket').server
const http = require('http')
const uuid = require('uuid')

const server = http.createServer()
server.listen(webSocketsServerPort)
console.log('Listening on server 1597')

const wsServer = new webSocketsServer({
  httpServer: server
})

const clients = {}

wsServer.on('request', (req) => {
  var userID = uuid()
  console.log((new Date()) + ' Recieved a new connection from origin ' + req.origin + '.')

  const connection = req.accept(null, req.origin)
  clients[userID] = connection
  console.log(`connected: ${userID} in ${Object.getOwnPropertyNames(clients)}`)

  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      for(key in clients){
        clients[key].sendUTF(message.utf8Data);
        console.log('sent Message to :', clients[key])
      }
    }

  })
})
