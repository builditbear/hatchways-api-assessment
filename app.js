const fetch = require("node-fetch");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Welcome to our homepage!");
});

// Route 1
app.get("/api/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: `Your ping succeeded. Status code ${res.statusCode} was sent!`,
  });
});

//Route 2
app.use("/api/posts", (req, res, next) => {
  // Set defaults if no value is passed in for eithero optional query params.
  if (!req.query.sortBy) {
    req.query.sortBy = "id";
  }
  if (!req.query.direction) {
    req.query.direction = "asc";
  }
  next();
});
//=====================================================================
app.get("/api/posts", async function (req, res) {
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
  //=====================================================================
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
  //=====================================================================
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
  // Send response
  res.send(blogPosts);
});

module.exports = app;
