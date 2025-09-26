const express = require('express');
const cors = require('cors'); // <-- import cors

const { pool } = require('./db');
const { adminRoute } = require('./routes/admin');
const { userRoute } = require('./routes/user');
const { semanticRoute } = require('./routes/semantic');

const app = express();

// Add CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // optional, if you need cookies
}));

app.use(express.json());

app.use("/user", userRoute);
app.use("/admin", adminRoute);
app.use("/semantic", semanticRoute);

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
