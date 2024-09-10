const express = require('express');
const app = express();

const PORT = process.env.PORT || 5500;

app.get('/', (req, res) => {
  res.send('Hello, Heroku!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
