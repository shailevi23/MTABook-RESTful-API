const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;

function User(name, id, email, password, date, status) {
	this.name = name;
	this.id = id;
	this.email = email;
	this.password = password;
	this.date = date;
	this.status = status;
}

const g_users = [new User("Root", 1, "admin@admin.com", "admin", new Date(), "actived")];

const g_status = ["created", "actived", "suspended", "deleted"];
const g_tokens = [];

function list_users(req, res) {
	// console.log(g_users)
	res.send(JSON.stringify(g_users));
}

function log_in(req, res) {
	const email = req.body.email;
	const password = req.body.password;

	const current_user = g_users.find(user => user.email == email);

	if (current_user) {
		bcrypt.compare(password, current_user.password, function (err, result) {
			if (result) {
				//get a token and send it instead of sending current user
				const token = jwt.sign({ current_user }, 'my_secret_key', { expiresIn: 60 * 10 });
				g_tokens[token] = true;
				res.send(JSON.stringify({ "token": token }));
			}
			else {
				// really bad request?
				res.status(StatusCodes.BAD_REQUEST);
				res.send("Wrong password");
				return;
			}
		});
	}
	else {
		// really bad request?
		res.status(StatusCodes.BAD_REQUEST);
		res.send("Didnt find user");
		return;
	}

}

function log_out(req, res) {

	jwt.verify(req.token, 'my_secret_key', function (err, result) {
		if (err) {
			res.status(StatusCodes.FORBIDDEN); // Forbidden
			res.send("No access")
			return;
		}
		else {
			// const current_user = result.current_user;
			// console.log(current_user);
			// res.cookie('jwt', '', { maxAge : 1});
			// const token = jwt.sign({current_user}, 'my_secret_key', {expiresIn: 1});
			g_tokens[req.token] = false;
			res.send(JSON.stringify("Log out succesfuly !"));
		}
	});
}

function register(req, res) {
	const name = req.body.name;
	const email = req.body.email;
	const password = req.body.password;

	if (!name) {
		res.status(StatusCodes.BAD_REQUEST);
		res.send("Missing name in request")
		return;
	}

	if (g_users.find(user => user.email === email)) {
		res.status(StatusCodes.BAD_REQUEST);
		res.send("Email already exists")
		return;
	}

	// Find max id 
	let max_id = 0;
	g_users.forEach(
		item => { max_id = Math.max(max_id, item.id) }
	)

	const new_id = max_id + 1;
	bcrypt.hash(password, saltRounds, function (err, hash) {
		const newUser = new User(name, new_id, email, hash, new Date(), "created");
		g_users.push(newUser);
	});

	res.send(JSON.stringify(g_users));
}

function verifyToken(req, res, next) {
	// Get auth header value
	const bearerHeader = req.headers['authorization'];
	// Check if bearer is undefined
	if (typeof bearerHeader !== 'undefined') {
		// Split at the space
		const bearer = bearerHeader.split(' ');
		// Get token from array
		const bearerToken = bearer[1];
		// Set the token
		req.token = bearerToken;
		// Next middleware
		next();
	} else {
		// Forbidden
		res.sendStatus(403);
	}

}

function check_validation_token(req, res, next) {
	jwt.verify(req.token, 'my_secret_key', function (err, result) {
		if (err) {
			res.status(StatusCodes.FORBIDDEN); // Forbidden
			res.send("No access")
			return;
		}
		else {
			if (g_tokens[req.token]) {
				req.body.user = result.current_user;
				next();
			}
			else {
				res.send(JSON.stringify("You have to log in !"));
			}

		}
	});
}

module.exports = {g_users, verifyToken, check_validation_token, list_users, log_in, log_out, register};