const express = require("express");
const neo4j = require("neo4j-driver");

const connectionString = "bolt://localhost:7687";

const driver = neo4j.driver(connectionString);

async function init() {
  const app = express();

  app.get("/get", async (req, res) => {
    // get a session to interact with neo4j
    const session = driver.session();
    // now we pass query
    const result = await session.run(
      `
      MATCH path = shortestPath(
        (First:Person {name: $person1})-[*]-(Second:Person {name: $person2})
      )
      UNWIND nodes(path) as node
      RETURN coalesce(node.name, node.title) AS text;
    `,
      { person1: req.query.person1, person2: req.query.person2 }
    );

    console.log(result.records);
    res.json({
      status: "ok",
      path: result.records.map((record) => record.get("text")), // we will get text from each of the records
    });
    await session.close(); // tell the session we are done
  });

  const PORT = 3000;
  app.use(express.static("./static"));
  app.listen(PORT);
  console.log(`Listening on http://localhost:${PORT}`);
}

init();
