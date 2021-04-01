const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const { v4: uuidv4 } = require('uuid');
const app = express();

const port = process.env.PORT || 9000;

//initialize a http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });
let users = {}
wss.on("connection", ws => {
  ws.on("message", msg => {
      let data
      try { data = JSON.parse(msg); } catch (e){
          console.log("Invalid JSON")
          data = {}
      }
    const {type, name, offer, answer, candidate} = data
    console.log(data)
    switch (type) {
        case "login":

        if (users[name]) {
            sendTo(ws, {
                type: "login",
                success: false,
                message: "Username is unavailable"
            })
        } else {
            const id = uuidv4()
            const loggedIn = Object.values(
                users
                ).map(({id, name:userName}) => ({id, userName}))
        users[name] = ws
        ws.name = name
        ws.id = id
        sendTo(ws, {
            type: "login",
            success: true,
            users: loggedIn
        })
        sendToAll(users, "updateUsers", ws)
        }
        break
        
        case "offer":

        const offerRecipient = users[name]
        if (!!offerRecipient) {
            sendTo(offerRecipient, {
                type: "offer",
                offer,
                name: ws.name
            })
        } else {
            sendTo(ws, {
                type: "error",
                message: `User ${name} does not exist!`
            })
        }
        break
        
        case "answer":

        const answerRecipient = users[name]
        if (!!answerRecipient) {
            sendTo(answerRecipient, {
                type: "answer",
                answer,
            })
        } else {
            sendTo(ws, {
                type: "error",
                message: `User ${name} does not exist!`
            })
        }
        break
        
        default:
        sendTo(ws, {
            type: "error",
            message: "command not found "+type
        })
        break
    }
    
    });
    ws.send(JSON.stringify({
        type: "connect",
        message: "Why hello there i am your server today"
    }))
});

//start our server
server.listen(port, () => {
  console.log(`Signalling Server running on port: ${port}`);
});

const sendTo = (connection, message) => {
    connection.send(JSON.stringify(message))
}

const sendToAll = (clients, type, {id, name: userName}) => {
    Object.values(clients).forEach(client => {
        if (client.name !== userName){
            client.send(
                JSON.stringify({
                    type,
                    user: {id, userName}
                })
            )
        }
    })
}