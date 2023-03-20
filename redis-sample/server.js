const { promisify } = require("util"); // need it because redis driver does not return promise
const express = require("express");
const redis = require("redis");
const client = redis.createClient();

const rIncr = promisify(client.incr).bind(client);
const rGet = promisify(client.get).bind(client);
const rSetex = promisify(client.setex).bind(client);

// We will try to cache a slow function
function cache(key, ttl, slowFn) {
  return async function cachedFn(...props) {
    const cachedResponse = await rGet(key);
    // If we already have cahced response, return it
    if (cachedResponse) {
      console.log("Hurray, it is cached!");
      return cachedResponse;
    }

    const result = await slowFn(...props);
    // Whatever comes back from DB, set it to cache
    await rSetex(key, ttl, result);
    return result;
  };
}

async function verySlowQuery() {
  // Big ugly PostgreSQL query
  console.log("Oh no a very expensive query");

  const promise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Date().toUTCString());
    }, 5000);
  });

  return promise;
}

const cachedFn = cache("expensive_call", 10, verySlowQuery); // fresh response copy evey 10 secs

async function init() {
  const app = express();

  app.get("/pageview", async (req, res) => {
    const views = await rIncr("pageviews");

    res.json({
      status: "ok",
      views,
    });
  });

  app.get("/get", async (req, res) => {
    const data = await cachedFn();
    res
      .json({
        data,
        status: "ok",
      })
      .end();
  });

  const PORT = 3000;
  app.use(express.static("./static"));
  app.listen(PORT);

  console.log(`Running on http://localhost:${PORT}`);
}

init();
