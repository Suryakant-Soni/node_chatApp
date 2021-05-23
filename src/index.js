const express = require('express')
const http = require('http')
const path = require('path')
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')
const {
    generateMessage,
    generateLocationMessage
} = require('./utils/message')

const {
    addUser,
    removeUser,
    getUser,
    getUsersInRooms
} = require('./utils/users')

const server = http.createServer(app)
const io = socketio(server)
//get port name
const port = process.env.PORT || 3000
// get the public folder path
const publicDirectoryPath = path.join(__dirname, '../public')
// give the folder name to express to serve static files from
app.use(express.static(publicDirectoryPath))

//fired at the time of new connection
io.on('connection', (socket) => {

    // when anyone joins a new room
    socket.on('join', (options, callback) => {
        const {error, user} = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('admin',`${user.username} has joined your room ${user.room}`))
        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUsersInRooms(user.room)
        })
        callback()
    })

    // socket.emit, io.emit, socket.braodcast.emit
    // io.to.emit - everyone in a room, socket.broadcast.to.emit - everyone in a room except socket

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profainity is not allowed')
        }
        //get the user name from users srray
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    //send message when a user disconnects to all others
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('admin', `${user.username} has left`))
        }
        io.to(user.room).emit('roomData',{  
            room : user.room,
            users : getUsersInRooms(user.room)
        })
    })

    socket.on('sendLocation', (position, callback) => {
        //get the user name from users srray
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, position.latitude, position.longitude))
        callback()
    })
})
//make the port to listen
server.listen(port, () => {
    console.log('server is up and running at port ${port}')
})