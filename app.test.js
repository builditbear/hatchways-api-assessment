const app = require("./app");
const supertest = require("supertest");
const { response } = require("./app");

test("Displays welcome message when root page is requested.", async () => {
  await supertest(app).get("/").expect("Welcome to our homepage!");
});

test("Returns JSON error message when tags query param is absent.", async () => {
  await supertest(app)
    .get("/api/posts")
    .query({ tags: [] })
    .expect(400)
    .then((res) => {
      expect(res.body.error).toBe("Tags parameter is required.");
    });
});

test("Returns JSON error message when sortBy parameter is invalid.", async () => {
  await supertest(app)
    .get("/api/posts")
    .query({ tags: ["science"], sortBy: "invalid parameter" })
    .expect(400)
    .then((res) => {
      expect(res.body.error).toBe("sortBy parameter is invalid.");
    });
});

test("Returns an array of posts sorted by value specified in sortBy parameter.", async () => {
  // await sortedCorrectly("id");
  await supertest(app)
    .get("/api/posts")
    .query({ tags: ["science"], sortBy: "id" })
    .expect(200)
    .then((res) => {
      for (let i = 1; i < res.body.length; i++) {
        expect(res.body[i].id < res.body[i - 1].id);
      }
    });

  // async function sortedCorrectly(sortParameter) {
  //   await supertest(app)
  //     .get("/api/posts")
  //     .query({ tags: ["science"], sortBy: sortParameter })
  //     .expect(200)
  //     .then((res) => {
  //       for (let i = 1; i < res.body.length; i++) {
  //         expect(res.body[i][sortParameter] < res.body[i - 1][sortParameter]);
  //       }
  //     });
  // }
});
