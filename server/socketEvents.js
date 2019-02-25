exports = module.exports = io => {
	//Set socket.io listeners.
	io.on('connection', socket => {
		socket.on('enter conversation', conversation => {
			socket.join(conversation);
		});

		socket.on('leave conversation', conversation => {
			socket.leave(conversation);
		});

		socket.on('new message', conversation => {
			io.sockets.in(conversation).emit('refresh messages', conversation);
		});
		socket.on('disconnect', () => {
			console.log('user disconnected');
		});
	});
};