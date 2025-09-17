const express = require('express')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

const JWT_TOKEN = "s3cr37";

const app = express()
app.use(express.json())


const pool = new Pool({
  user: 'myuser',       
  host: 'localhost',
  database: 'mydb',     
  password: 'mypassword', 
  port: 5432,
});


app.post('/login',async (req, res) => {
	const { username, password } = req.body;

	try {
		const userResult = await pool.query(
			'SELECT * FROM users WHERE username=$1 AND password=$2',
			[username, password]
		);
		
		if (userResult.rows.length > 0){
			const user = userResult.rows[0];

			const token = jwt.sign(
				{id: user.id.toString()},
				JWT_TOKEN
			);

			res.json({token});

			res.send(token)
		}


	}
	catch (err) {
		console.error(err);
		res.status(500).send('Server error');
  }
});

app.post('/register',async (req,res) => {
	const { username, password } = req.body;

	try {
		const userResult = await pool.query(
			'INSERT INTO users(username,password) VALUES ($1,$2)',
			[username,password]
		);
		res.status(201).send('User registered successfully');
	}
	catch (err) {
		console.error(err);
		res.status(500).send('Server error');
  }
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
