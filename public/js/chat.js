const socket = io()

// dom elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('#idSendButton')
const $sendLocationButton = document.querySelector('#idSendButton')
const $messages = document.querySelector('#messages')
const $mapLinkDiv = document.querySelector('#idMapLink')

// parse the query from URL
const { username, room } =  Qs.parse(location.search, { ignoreQueryPrefix : true })

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //disable the button
    $messageFormButton.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage', e.target.elements.message.value, (error) => {
        //enables button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message Delivered')
    })
})

const auroScroll = () => {
        // New message element
        const $newMessage = $messages.lastElementChild

        //height of the new Message
        const newMessageStyles = getComputedStyle($newMessage)
        const newMessageMargin = parseInt(newMessageStyles.marginBottom)
        const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

        //Visible height
        const visibleHeight = $messages.offsetHeight

        // height of message container
        const containerHeight = $messages.scrollHeight

        // how far I have scrolled
        const scrollOffset = $messages.scrollTop + visibleHeight
        if (containerHeight - newMessageHeight <= scrollOffset) {
            $messages.scrollTop = $messages.scrollHeight
        }
}
const messageTemplate = document.querySelector('#message-template').innerHTML

socket.on('message', (objFromServer) => {
    const html = Mustache.render(messageTemplate, {
        username : objFromServer.username,
        message: objFromServer.text,
        createdAt: moment(objFromServer.createdAt ).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    auroScroll()
})

socket.on('locationMessage', (message) => {
    console.log('on.locationMessage', message)
    const mapLinkTemplate = document.querySelector('#location-template').innerHTML
    const mapHTML = Mustache.render(mapLinkTemplate, {
        username : message.username,
        url: message.url,
        createdAt : moment(message.createdAt ).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', mapHTML)
    auroScroll()
})

socket.on('roomData', ({room, users}) => {
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const html = Mustache.render(sidebarTemplate, {
    room,
    users
})
document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#idSendLocation').addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert('Navigator Geolocation not supported')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        socket.emit('sendLocation', {
            "latitude": position.coords.latitude,
            "longitude": position.coords.longitude
        }, () => {
            console.log('Location shared')
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})


socket.emit('join', { username, room }, (error) => {
if (error) {
    alert(error)
    location.href = '/'
} 
})