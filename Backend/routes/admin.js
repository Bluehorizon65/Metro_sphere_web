const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
//const { pool } = require("../db");

const JWT_TOKEN = "s3cr37";
const saltRounds = 10;

const adminRoute = Router();


adminRoute.post('/signin',async (req,res) => {
	const { username, password } = req.body;

	try{
		
		const result = await pool.query(
			'SELECT id,password FROM users WHERE username=$1 ',
			[username]
		);

		const user = result.rows[0];
		const hashed = user.password;

		const pass_comp = await bcrypt.compare(password,hashed);
		

		
		if (pass_comp){
			const user = result.rows[0];

			const token = jwt.sign({
				id: user.id.toString()
			},JWT_TOKEN);
			res.json({
				token
			});
		}
		else if (result.rows.length === 0){
			res.json({
				message: "invalid credentials"
			});
		}
	}
	catch (err){
		console.error(err);
		res.status(500).send('Server error');
	}
})

adminRoute.post('/register', async(req,res) => {
	const { username,password } = req.body;

	try{
		const hash_pass = await bcrypt.hash(password, saltRounds)

		const result = await pool.query(
			'INSERT INTO users(username,password) VALUES($1,$2)',
			[username,hash_pass]
		);
		res.status(201).send('Employee registered successfully');
	}
	catch(err){
		console.error(err);
		res.status(500).send('Server error');
	}
})

adminRoute.get('/employee',(req,res) => {
	res.json({
		message: "endpoint to see all the employees"
	})
})

module.exports = {
	adminRoute: adminRoute
}
