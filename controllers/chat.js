"use strict";

const Conversation = require('../models/conversation');
const Message = require('../models/essage');
const User = require('../models/user');

exports.getConversations = (req, res, next) => {
	Conversation.find({participants: req.user._id})
	select('_id')
	.exec((err, conversations) => {
		if (err) {
			res.send({error: err});
			return next(err);
		}

		// Set up empty array to hold conversations + most recent message
		let fullConversations = [];

		conversations.forEach((conversation) => {
			Message.find({'conversationId': conversation._id})
			.sort('-createdAt')
			.limit(1)
			.populate({
				path: "author",
				select: "profile.firstName profile.lastName"
			})
			.exec((err, message) => {
				if (err) {
					res.send({error: err});
					return next(err);
				}
				fullConversations.push(message);
				if (fullConversations.length === conversations.length) {
					return res.status(200).json({conversations: fullConversations});
				}
			});
		});
	});
};


exports.getConversation = (req, res, next) => {
	Message.find({conversationId: req.params.conversationId})
	.select('createdAt body author') //ignores timeStamps
	.sort('-createdAt')
	.populate({
		path: 'author',
		select('profile.firstName profile.lastName')
	})
	.exec((err, messages) => {
		if (err) {
			res.send({error: err});
			return next(err);
		}
		res.status(200).json({conversation: messages});
	});
};

exports.newConversation = (req, res, next) => {
	if (!req.params.recipient) {
		res.status(422).send({error: 'Please choose a valid recipient for your message'});
		return next();
	}

	if (!req.body.composedMessage) {
		res.status(422).send({error: 'Please enter a message.'});
		return next();
	}

	const conversation = new Conversation({
		participants: [req.user._id, req.params.recipient]
	});

	conversation.save((err, newConversation) => {
		if (err) {
			res.send({error: err});
			return next(err);
		}

		const message = new Message({
			conversationId: newConversation._id,
			body: req.body.composedMessage,
			author: req.user._id
		});

		message.save((err, newMessage) => {
			if (err) {
				res.send({error: err});
				return next(err);
			}

			res.status(200).json({message: 'Conversation started!', conversationId: conversation._id});
			return next();
		});
	});
};

export.sendReply = (req, res, next) => {
	const reply  = new Message({
		conversationId = req.params.conversationId,
		body: req.body.composedMessage,
		author: req.user._id
	});

	reply.save((err, sentReply) => {
		if (err) {
			res.send({error: err});
			return next(err);
		}

		res.status(200).json({message: 'Reply successfully sent!'});
		return next();
	});
};


exports.deleteConversation = (req, res, next) => {
	Conversation.findOneAndRemove({
		$and: [
			{'_id': req.params.conversationId},
			{'participants': req.user._id}
		]
	})
	.exec(result => {
		res.status(200).json({
			message: 'Coversation was removed'
		});
		return next();
	})
	.then(e => {
		res.send({
			error: e
		});
		return next(e);
	});
};

exports.updateMessage = (req, res, next) => {
	Conversation.find({
		$and: [
			{'id': req.params.messageId},
			{'author': req.user._id}
		]
	})
	.exec()
	.then(message => {
		message.body = req.body.composedMessage;
		res.status(200).json({
			message: 'Message was updated'
		});
		return next();
	})
	.catch(e => {
		res.send({
			error: e;
		});
		return next(e);
	});
};