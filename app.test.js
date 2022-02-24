const app = require("./app");
const supertest = require("supertest");
const { response } = require("./app");

describe("Query Param Validation", () => {
  it("returns a JSON error message when tags query param is absent.", async () => {
    await supertest(app)
      .get("/api/posts")
      .query({ tags: [] })
      .expect(400)
      .then((res) => {
        expect(res.body.error).toBe("Tags parameter is required.");
      });
  });

  it("returns a JSON error message when sortBy parameter is invalid.", async () => {
    await supertest(app)
      .get("/api/posts")
      .query({ tags: "science", sortBy: "invalid parameter" })
      .expect(400)
      .then((res) => {
        expect(res.body.error).toBe("sortBy parameter is invalid.");
      });
  });

  it("returns a JSON error message when direction parameter is invalid.", async () => {
    await supertest(app)
      .get("/api/posts")
      .query({ tags: "science", direction: "invalid parameter" })
      .expect(400)
      .then((res) => {
        expect(res.body.error).toBe("direction parameter is invalid.");
      });
  });
});

describe("Sorting Behavior", () => {
  it("returns an array of posts sorted by id when specified by sortBy query param.", async () => {
    const response = await supertest(app)
      .get("/api/posts")
      .query({ tags: "science", sortBy: "id" })
      .expect(200)
      .then((res) => {
        for (let i = 1; i < res.body.length; i++) {
          expect(res.body[i].id).toBeGreaterThan(res.body[i - 1].id);
        }
      });
  });

  it("returns an array of posts sorted by reads when specified by sortBy query param.", async () => {
    const response = await supertest(app)
      .get("/api/posts")
      .query({ tags: "science", sortBy: "reads" })
      .expect(200)
      .then((res) => {
        for (let i = 1; i < res.body.length; i++) {
          expect(res.body[i].reads).toBeGreaterThanOrEqual(
            res.body[i - 1].reads
          );
        }
      });
  });

  it("returns an array of posts sorted by likes when specified by sortBy query param.", async () => {
    const response = await supertest(app)
      .get("/api/posts")
      .query({ tags: "science", sortBy: "likes" })
      .expect(200)
      .then((res) => {
        for (let i = 1; i < res.body.length; i++) {
          expect(res.body[i].likes).toBeGreaterThanOrEqual(
            res.body[i - 1].likes
          );
        }
      });
  });

  it("returns an array of posts sorted by popularity when specified by sortBy query param.", async () => {
    const response = await supertest(app)
      .get("/api/posts")
      .query({ tags: "science", sortBy: "popularity" })
      .expect(200)
      .then((res) => {
        for (let i = 1; i < res.body.length; i++) {
          expect(res.body[i].popularity).toBeGreaterThanOrEqual(
            res.body[i - 1].popularity
          );
        }
      });
  });

  /* Note that it is unecessary to test for ascending order as the previous tests in this section have already checked that the array is always sorted in ascending
     order by default as a side effect. */
  it("returns an array sorted in descending order instead of ascending if specified by direction query param.", async () => {
    await supertest(app)
      .get("/api/posts")
      .query({ tags: "science", direction: "desc" })
      .expect(200)
      .then((res) => {
        for (let i = 1; i < res.body.length; i++) {
          expect(res.body[i].id).toBeLessThan(res.body[i - 1].id);
        }
      });
  });
});

describe("Multiple Tag Handling", () => {
  it("returns an array without duplicate blog posts when multiple tags are specified.", async () => {
    await supertest(app)
      .get("/api/posts")
      .query({ tags: "science,health" })
      .expect(200)
      .then((res) => {
        /* Since the returned array is known to be sorted in increasing order by default, the id's can be guaranteed to be unique 
         so long as no two adjacent values are equal. */
        for (let i = 1; i < res.body.length; i++) {
          expect(res.body[i].id).not.toBe(res.body[i - 1].id);
        }
      });
  });
  it("returns an array where each blog post has at least one of the tags specified by query param.", async () => {
    await supertest(app)
      .get("/api/posts")
      .query({ tags: "science,health" })
      .expect(200)
      .then((res) => {
        for (let i = 0; i < res.body.length; i++) {
          expect(
            res.body[i].tags.includes("science") ||
              res.body[i].tags.includes("health")
          ).toBeTruthy();
        }
      });
  });
});
