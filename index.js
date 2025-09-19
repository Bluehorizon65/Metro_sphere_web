const express = require('express')

const { pool } = require('./db')
const { adminRoute } = require('./routes/admin')
const { userRoute } = require('./routes/user')


const app = express()
app.use(express.json())

app.use("/user",userRoute);
app.use("/admin",adminRoute);


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
