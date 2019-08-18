const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(bodyParser.json());

app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);


app.listen(PORT, HOST, () => {
    console.log(`Listening on port ${PORT} on ${HOST}!`);
});