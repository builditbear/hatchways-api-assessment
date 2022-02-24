/* Hatchways API Assessment by Brandon Chavez, completed on 02/24/22.

   Initializes a server instance based on logic in app.js. */
const app = require("./app");
const listeningPort = 3000;

app.listen(listeningPort, () => {
  console.log(`Server online and listening on port ${listeningPort}!`);
});
