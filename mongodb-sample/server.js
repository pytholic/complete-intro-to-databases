const express = require("express");
const { MongoClient } = require("mongodb"); // "{}" are used because we are pulling it out of mongodb

const connectionString = "mongodb://localhost:27017"; // default conenction string for mongodb

async function init() {
  const client = new MongoClient(connectionString, {
    useUnifiedTopology: true,
  });
  await client.connect(); // this will connect to mongo from our node-server

  // Create an express app
  const app = express();

  app.get("/get", async (req, res) => {
    const db = await client.db("adoption");
    const collection = db.collection("pets");

    const pets = await collection
      .find(
        {
          $text: { $search: req.query.search },
        },
        { _id: false }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(10)
      .toArray(); // because we don't want an iterator

    res.json({ status: "ok", pets: pets }).end();
  });

  const PORT = 3000;
  // Serve our files
  app.use(express.static("./static"));
  app.listen(PORT); // starts listening on localhost:3000
  console.log(`Running on http://localhost:${PORT}`);
}

init();
