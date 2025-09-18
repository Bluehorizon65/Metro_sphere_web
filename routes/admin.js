const { Router } = require('express');
const adminRoute = Router();

adminRoute.post('/signin',(req,res) => {
	res.json({
		message : "admin signin Endpoint"
	})
})

adminRoute.post('/register',(req,res) => {
	res.json({
		message: 'endpoint to register new employees'
	})
})

adminRoute.get('/employee',(req,res) => {
	res.json({
		message: "endpoint to see all the employees"
	})
})

module.exports = {
	adminRoute: adminRoute
}
