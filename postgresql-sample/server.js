const express = require("express");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:mysecretpassword@localhost:5432/message_boards",
});

async function init() {
  const app = express();

  app.get("/get", async (req, res) => {
    const client = await pool.connect(); // we will get a client back from the pool
    // we will do two queries, one for commen and one for board
    const [commentRes, boardRes] = await Promise.all([
      client.query(
        "SELECT * FROM comments NATURAL LEFT JOIN rich_content WHERE board_id = $1",
        [req.query.search]
        // [req.query.search]  will be placed at $1 place
        // this is called a parametrized query
      ),
      client.query("SELECT * FROM boards WHERE board_id = $1", [
        req.query.search,
      ]),
    ]);

    // send response back to the client
    res.json({
      status: "ok",
      board: boardRes.rows[0] || {},
      posts: commentRes.rows,
    });
  });

  const PORT = 3000;
  app.use(express.static("./static"));
  app.listen(PORT);

  console.log(`Running on http://localhost:${PORT}`);
}

init();
