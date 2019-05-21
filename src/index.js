const express=require('express');
const http=require('http');
const path=require('path');
const app =express();
const socketio=require('socket.io');
const server=http.createServer(app);
const io= socketio(server);
const Filter=require('bad-words');
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')
let count=0;
//this is the event based server mechanism
//server(emit)=>client(receive)=>countUpdated
//client(emit)=>server(receive)=>increment
io.on('connection',(socket)=>{
    console.log("new web socket connection");
   
    socket.on("join",({username,room},ackcallback)=>{
       
    const {error,user}=addUser({
        id:socket.id,
        username,
        room
    })
    if(error){
    return ackcallback(error);
    }
      socket.join(user.room)
      socket.emit('message',generateMessage('welcome'));
      socket.broadcast.to(user.room).emit('message',generateMessage(` ${user.username} has connected`));
      //some kind of events 
      //socket.emit(),io.emit(),socket.broadcast.emit()
      //io.to.emit() it emits a event to everybody specific to the present in the current room  
      //io.to.emit() it will not send themessage to the other room people
      //socket.broadcast.to(room).emit() it will send the message to all the users but not the client and the 
      //other users that are not present in the room
      io.to(user.room).emit('roomData',{
          room:user.room,
          users:getUsersInRoom(user.room)
      })
      ackcallback()
    })
    socket.on('sendMessage',(message,acknowledgeCallback)=>{
        const filter=new Filter();
        const hindiBadWords=['madarchod','behanchod','bc','mc','chod','londa','chut','kameena',
    'kutta','harami','suar','lund','land',];
    filter.addWords(...hindiBadWords);
        if(filter.isProfane(message)){
            return acknowledgeCallback(generateMessage('profanity is not allowed !'))
        }
     const user=getUser(socket.id);
     io.to(user.room).emit('message',generateMessage(user.username,message));
     acknowledgeCallback('delievered');//this function runs to tell the client message got delievered
    })
    //connection and disconnect are the built in events 
    //we do not need to create these events from the client
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage(`${user.username} has  disconnected`));
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        });
    //this is to get the location and broadcast it foe all the user
    socket.on('sendLocation',(location,ackcallback)=>{
        const user=getUser(socket.id);
        io.to(user.room).emit('location',generateLocationMessage(user.username,location));
        ackcallback();
    })
})

const port=process.env.PORT||5500 ;
const publicDirectoryPath=path.join(__dirname,"../public");
app.use(express.static(publicDirectoryPath));
server.listen(port,()=>{
    console.log('your chat app has been started on port :'+port);
})