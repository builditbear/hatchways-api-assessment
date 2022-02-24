/* Defines the client-side cache system and routes for our REST API server. 
   This logic is exported for actual server instantiation in server.js.
   The server instantiation logic was decoupled from the app's main logic to 
   allow for jest/supertest to run multiple server instances for efficient testing. */
const fetch = require("node-fetch");
const express = require("express");
const app = express();
const cache = require("memory-cache");

// Attempts to retrieve a given GET request by URL from cache.
// Otherwise, it stores the next response made for a given number of seconds in cache.
const cacheCheck = (storageDurationInSeconds) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cachedBody = cache.get(key);
    if (cachedBody) {
      return res.send(cachedBody);
    } else {
      /* If the requested URL isn't in our cache, redefine res.send to cache the response 
       before sending it out. Then pass it to the API as normal. */
      res.originalSend = res.send;
      res.send = (responseBody) => {
        cache.put(key, responseBody, storageDurationInSeconds * 1000);
        res.originalSend(responseBody);
      };
      next();
    }
  };
};

app.get("/", cacheCheck(1), (req, res) => {
  res.send("Welcome to our homepage!");
});

app.get("/api/ping", cacheCheck(1), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Your ping succeeded. Status code ${res.statusCode} was sent!`,
  });
});

app.use("/api/posts", (req, res, next) => {
  // Set defaults if no value is passed in for either optional query params.
  if (!req.query.sortBy) {
    req.query.sortBy = "id";
  }
  if (!req.query.direction) {
    req.query.direction = "asc";
  }
  next();
});

app.get("/api/posts", cacheCheck(1), async function (req, res) {
  // Retrieve and validate query parameters.
  if (!req.query.tags) {
    return res.status(400).json({ error: "Tags parameter is required." });
  }
  const tags = req.query.tags.split(",");
  const sortBy = req.query.sortBy;
  if (!["id", "reads", "likes", "popularity"].includes(sortBy)) {
    return res.status(400).json({ error: "sortBy parameter is invalid." });
  }
  const direction = req.query.direction;
  if (!["asc", "desc"].includes(direction)) {
    return res.status(400).json({ error: "direction parameter is invalid." });
  }

  // Retrieve and filter data from hatchways API.
  let blogPosts = [];
  for (const tag of tags) {
    // We can later check against this set to identify what posts are already in the posts array, thus filtering
    // out duplicates with an O(1) lookup time - no extra loops required!
    let blogPostIds = new Set(blogPosts.map((blogPost) => blogPost.id));
    // Get matching posts for the next tag.
    let response = await fetch(
      `https://api.hatchways.io/assessment/blog/posts?tag=${tag}`
    );
    let newBlogPosts = await response.json();
    // Merge incoming data with existing data, filtering out existing data in the process.
    blogPosts = [
      ...blogPosts,
      ...newBlogPosts.posts.filter(
        (newBlogPost) => !blogPostIds.has(newBlogPost.id)
      ),
    ];
  }

  // Sort blogPosts by the desired key and in the specified direction before sending it as the response.
  if (direction === "asc") {
    blogPosts = blogPosts.sort(
      (blogPostA, blogPostB) => blogPostA[sortBy] - blogPostB[sortBy]
    );
  } else if (direction === "desc") {
    blogPosts = blogPosts.sort(
      (blogPostA, blogPostB) => blogPostB[sortBy] - blogPostA[sortBy]
    );
  }
  // Send object wrapped array back to client.
  res.send({ posts: blogPosts });
});

module.exports = app;
