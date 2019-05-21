const socket=io();
const $messageForm=document.querySelector("#message-form")
const $messageFormInput=$messageForm.querySelector("input")
const $messageFormButton=$messageForm.querySelector("button")
const $sendLocation=document.querySelector('#sendLocation');
const $messages=document.querySelector('#messages')
const $sidebar=document.querySelector(".chat__sidebar")
//templates
const $messageTemplate=document.querySelector('#message-template').innerHTML;
const $locationTemplate=document.querySelector('#location-template').innerHTML;
const $sidebarTemplate=document.querySelector('#sidebar-template').innerHTML;

document.querySelector("#send").addEventListener('click',(e)=>{
     e.preventDefault();
    var message=document.querySelector('#message').value;
    if(!message){
        alert('message is required');
        return
    }
     //we are disabling the form button until we get the response back
     $messageFormButton.setAttribute('disabled','disabled');
    socket.emit('sendMessage',message,(errorackmessage)=>{//this anonymous function is acknowledge function that runs 
        //only when the message is received and server sends acknowledgemnt by rrunning the ack function
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value="";
        $messageFormInput.focus();
        if(errorackmessage!=='delievered'){
            addUiForMessage(errorackmessage)
            console.log(errorackmessage);
            return false;
        }
        console.log('message delievered');
    });
    return false;
})
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})
socket.on('message',(message)=>{
    addUiForMessage(message);
    console.log(message);
    autoScroll()
})
const addUiForMessage = (message)=>{
    const html=Mustache.render($messageTemplate,{
         username:message.username,
         message:message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML("beforeend",html)
}
const autoScroll = ( )=>{
 //new message element
 $newMessage=$messages.lastElementChild
 //height of the new message standerd context and its margin
 //we will not hard code the margin because in future someone can change teh css
 //and te autoscrolling will brorke these decisions must be remembered while writing frontend js
 const $newMessageStyles=getComputedStyle($newMessage);
 const $newMessageMargin=parseInt($newMessageStyles.marginBottom);
 const newMessageHeight=$newMessage.offsetHeight+$newMessageMargin;
 //visible height is same the amount that is visible on the screen of the messages
 const visibleHeight=$messages.offsetHeight;
 //height of messages container
 const containerHeight=$messages.scrollHeight;
 //how far i have scrolled
 const scrollOffset=$messages.scrollTop + visibleHeight;
 if(containerHeight-newMessageHeight<=scrollOffset){
     $messages.scrollTop=$messages.scrollHeight;
 }



}

//server(emit)=>client(receive)=>client(acknowledge)to server
//client(emit)=>server(receive)=>server(acknowledge ) to client
$sendLocation.addEventListener('click',()=>{
    $sendLocation.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        alert('browser does not suppoert geolocation');
    }
    navigator.geolocation.getCurrentPosition((position)=>{
       const  locationurl=`https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
    socket.emit('sendLocation',locationurl,()=>{
        $sendLocation.removeAttribute('disabled');
        console.log('location shared');
    })
    })
})
socket.on('location',(location)=>{
    const html=Mustache.render($locationTemplate,{
        username:location.username,
        location:location.location,
        createdAt:moment(location.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML("beforeend",html)
    console.log(location);
    autoScroll();
})
socket.on('roomData',({room,users})=>{
console.log(room)
console.log(users)
const html=Mustache.render($sidebarTemplate,{room,
users})
$sidebar.innerHTML="";
$sidebar.insertAdjacentHTML('afterbegin',html)

})
socket.emit('join',{username,room},(error)=>{
if(error){
    alert(error)
    location.href='/'
}
})
