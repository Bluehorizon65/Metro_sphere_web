const express = require('express')
const jwt = require('jsonwebtoken')

const { pool } = require('./db')
const { adminRoute } = require('./routes/admin')
const { userRoute } = require('./routes/user')

const JWT_TOKEN = "s3cr37";

const app = express()
app.use(express.json())

app.use("/user",userRoute);
app.use("/admin",adminRoute);


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
