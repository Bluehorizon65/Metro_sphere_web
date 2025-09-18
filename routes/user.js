const { Router } = require('express') 

const userRoute = Router();

userRoute.post('/signin',(req,res) => {
	res.json({
		message: "Signin Endpoint"
	})
})

module.exports = {
	userRoute: userRoute
}
