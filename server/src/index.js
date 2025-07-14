const express = require("express");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const port = 8004;

app.get("/", (req, res) => {
  res.status(200).json({ message: "chat" });
});

let allUsers = [];

// add users in the room
app.post("/add", (req, res) => {
  console.log(req.body);
  const { username, latitude, longitude } = req.body;
  const userData = {
    id: uuidv4(),
    username: username,
    latitude: latitude,
    longitude: longitude,
  };
  console.log(`adding user: ${JSON.stringify(userData)}`);
  allUsers.push(userData);

  res.status(200).json({ message: "user added successfully" });
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
