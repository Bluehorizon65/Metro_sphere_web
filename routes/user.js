const { Router } = require('express'); 
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const JWT_TOKEN = "s3cr37";

const userRoute = Router();

userRoute.post('/signin',async (req,res) => {
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

module.exports = {
	userRoute: userRoute
}
