
var app = require('express')();
var http = require('http').createServer(app);

const port = process.env.PORT || 4567;

var cors = require("cors");
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200
};



var io = require('socket.io')(http, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT"],
      credentials: false
    }
  });

app.use(cors(corsOptions));
app.use(bodyParser.json());

var STATIC_CHANNELS = [{
    name: 'AFL',
    participants: 0,
    id: 1,
    sockets: []
}, {
    name: 'Premier League',
    participants: 0,
    id: 2,
    sockets: []
}, {
    name: 'Manchester Utd',
    participants: 0,
    id: 3,
    sockets: []
}];


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
})


http.listen(PORT, () => {
    console.log(`server is listening on port:${PORT}`);
});

io.on('connection', (socket) => {
    console.log('new client connected');
    socket.emit('connection', null);
    socket.on('channel-join', id => {
        console.log('channel join', id);
        STATIC_CHANNELS.forEach(c => {
            if (c.id === id) {
                if (c.sockets.indexOf(socket.id) == (-1)) {
                    c.sockets.push(socket.id);
                    c.participants++;
                    io.emit('channel', c);
                }
            } else {
                let index = c.sockets.indexOf(socket.id);
                if (index != (-1)) {
                    c.sockets.splice(index, 1);
                    c.participants--;
                    io.emit('channel', c);
                }
            }
        });

        return id;
    });
    socket.on('send-message', message => {
        io.emit('message', message);
    });

    socket.on('disconnect', () => {
        STATIC_CHANNELS.forEach(c => {
            let index = c.sockets.indexOf(socket.id);
            if (index != (-1)) {
                c.sockets.splice(index, 1);
                c.participants--;
                io.emit('channel', c);
            }
        });
    });

});


app.get('/getChannels', (req, res) => {
    res.json({
        channels: STATIC_CHANNELS
    })
});

if (process.env.NODE_ENV === 'production') {
    const path = require('path')
    app.use(express.static(path.join(__dirname, 'build')));
  
    app.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname, 'build', 'App.js'));
    });
  }