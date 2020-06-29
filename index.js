const webSocketsServerPort = 1597
const webSocketsServer = require('websocket').server
const http = require('http')
const { v4: uuidv4 } = require('uuid')

const server = http.createServer()
server.listen(webSocketsServerPort)
console.log('Listening on server 1597')

const wsServer = new webSocketsServer({
  httpServer: server
})

const clients = []

wsServer.on('request', (req) => {
  var userID = uuidv4()
  // console.log((new Date()) + ' Recieved a new connection from origin ' + req.origin + '.')

  const connection = req.accept(null, req.origin)
  clients.push({connection, userID})
  connection.sendUTF(JSON.stringify({payload: {userID}}))
  // console.log(`connected: ${userID} in ${Object.getOwnPropertyNames(clients)}`)

  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      // console.log('Received Message: ' + message.utf8Data);
      let payload = JSON.parse(message.utf8Data).payload
      console.log(payload)

      if (payload.start && payload.players.length === 0){
        let client = clients.find(c => c.userID === payload.userID)
        client.gameData = {numOfPlayers: payload.numOfPlayers, players: payload.players}
        client.user = payload.user
        client._id = payload._id

        // gather all clients that are missing players
        let playersMissingPlayers = clients.filter(cl => cl.gameData.numOfPlayers > cl.gameData.players.length && cl._id !== client._id)

        if (playersMissingPlayers.length === 0){
          // if there is no room_id, create on
          client.gameData.roomID = uuidv4()
          client.gameData.players.push({user: client.user, userID: client.userID})

          client.connection.sendUTF(JSON.stringify({payload: {players: client.gameData.players, roomID: client.gameData.roomID, numOfPlayers: client.gameData.numOfPlayers}}))
        } else {
          // select from the beginning of that array
          let chosenPlayer = playersMissingPlayers[0]
          // otherwise, add room_id
          client.gameData.roomID = chosenPlayer.gameData.roomID
          // update all players with player data
          chosenPlayer.gameData.players.push({user: client.user, userID: client.userID})
          chosenPlayer.connection.sendUTF(JSON.stringify({payload: {players: chosenPlayer.gameData.players, roomID: chosenPlayer.gameData.roomID, numOfPlayers: chosenPlayer.gameData.numOfPlayers}}))

          clients.forEach(cl => {
            if (cl.userID !== chosenPlayer.userID && cl.gameData.roomID === chosenPlayer.gameData.roomID){
              if (cl.userID === client.userID){
                cl.gameData.players = [...chosenPlayer.gameData.players]
              } else {
                cl.gameData.players.push({user: client.user, userID: client.userID})
              }
              // send a message to all members of the room
              cl.connection.sendUTF(JSON.stringify({payload: {players: chosenPlayer.gameData.players, roomID: chosenPlayer.gameData.roomID, numOfPlayers: chosenPlayer.gameData.numOfPlayers}}))
            }
          })
        }
      }
      // clients.forEach(client => {
        // client.connection.sendUTF(message.utf8Data);
        // console.log(message.utf8Data)
        // console.log(message.utf8Data.payload)
        // console.log('sent Message to :', clients[key])
      // })
    }

  })
  connection.on('close', function(reasonCode, description) {
    console.log("--------")
    console.log("hmmm?")
    console.log(reasonCode)
    console.log(description)
    let clientIndex = clients.findIndex(cl => cl.userID === userID)
    console.log(clients.length)
    clients.splice(clientIndex, 1)
    // remove client from list once disconnected
    console.log(clients.length)
  })
})
