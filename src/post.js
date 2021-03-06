const StatusCodes = require('http-status-codes').StatusCodes;
const g_posts = []
const posts_file = './files/posts.json';
const db = require('./database.js');

function Post(message, id, date, user_id) {
	this.message = message;
	this.id = id;
	this.date = date;
	this.user_id = user_id;
	this.status = 'published';
}

db.read_data(g_posts, posts_file).then(
	() => { }
).catch(reason => console.log('Failure:' + reason))


function publish_post(req, res) {
	const text = req.body.text;
	const user_status = req.body.user.status;

	if (!text) {
		res.status(StatusCodes.BAD_REQUEST);
		res.send("Missing text in request")
		return;
	}

	// Find max id 
	let max_id = 0;
	g_posts.forEach(
		item => { max_id = Math.max(max_id, item.id) }
	)

	const new_id = max_id + 1;

	const new_post = new Post(text, new_id, new Date(), req.body.user.id);
	g_posts.push(new_post);

	db.write_file(g_posts, posts_file);


	res.send(JSON.stringify(new_post));
}

function get_posts(req, res) {
	const posts = g_posts.filter(post => post.status == "published");
	res.send(JSON.stringify(posts));
}

function delete_post(req, res) {
	let writer;
	let post_exist = false;

	for (let i = 0; i < g_posts.length; i++) {
		if (g_posts[i].id == req.body.post) {
			writer = g_posts[i].user_id;
			if (g_posts[i].status != "deleted") {
				post_exist = true;
			}
		}
	}

	if (!post_exist) {
		res.status(StatusCodes.BAD_REQUEST);
		res.send("Post not exists");
		return;
	}

	if (req.body.user.id != writer) {
		res.status(StatusCodes.UNAUTHORIZED);
		res.send("No access")
		return;
	}
	else {
		for (let i = 0; i < g_posts.length; i++) {
			if (g_posts[i].id == req.body.post) {
				g_posts[i].status = "deleted";
			}
		}
		db.write_file(g_posts, posts_file);
		res.send(JSON.stringify("You delete the post successfuly !"));
	}
}

module.exports = { posts_file, g_posts, publish_post, get_posts, delete_post };