const http = require('http'),
	path = require('path'),
	fs = require('fs-extra'),
	express = require('express'),
	errorhandler = require('errorhandler'),
	SMTPServer = require('smtp-server').SMTPServer,
	simpleParser = require("mailparser").simpleParser,
	socketio = require('socket.io'),
	email = require('./lib/email-lib'),
	emailRoutes = require('./routes/email-routes');

// app variables
const DIST_DIR = path.join(__dirname, '..', "dist"),
	HOST = process.argv[2] || '0.0.0.0',
	PORT = process.argv[3] || 3000,
	SMTP_PORT = process.argv[4] || 25,
	ENV = (process.argv[5] || 'production').toLowerCase();

// init server
const app = express();
app.set('port', PORT);
app.set('host', HOST);
app.set('env', ENV);

// webpack development environment
if (app.get('env') == 'development') {
	const webpack = require('webpack');
	const middleware = require('webpack-dev-middleware');
	const webpackConfig = require('../webpack.config.js');
	const compiler = webpack({ mode: 'development', ...webpackConfig });
	app.use(middleware(compiler, {
		publicPath: '/'
	}));
} else {
	// static routes
	app.use(express.static(DIST_DIR));
	app.get('/', function (req, res) {
		res.sendFile(path.join('../app', "index.html"));
	});
}

// email routes
app.use('/messages', emailRoutes);

// error handling middleware loaded last
app.use(errorhandler());

// create http server and listen on PORT
const server = http.createServer(app);
const io = socketio(server);

server.listen(PORT, HOST, function () {
	console.log(`testmail http server listening on port ${PORT}`);
});

io.on('connection', function (socket) {
	console.log('a user connected');
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
});

// create smtp server and listen on SMTP_PORT
const mailServer = new SMTPServer({
	disabledCommands: ['AUTH'],
	onData: function (stream, session, callback) {

		simpleParser(stream)
			.then(mail => {
				console.log("Received Email:", mail.from.text, mail.to.text, mail.subject);
				email.insertMail(mail);

				// emit mail to all connected clients
				io.emit('mail', email.shortform(mail));
			})
			.catch(err => {
				console.error(err);
			});

		stream.on('end', callback);
	},
	onRcptTo: function (address, session, callback) {
		return callback();
	}
});

mailServer.listen(SMTP_PORT, HOST, function () {
	console.log(`testmail smtp server listening on port ${SMTP_PORT}`);
});
