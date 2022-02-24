const app = require("./app");
const listeningPort = 3000;

app.listen(listeningPort, () => {
  console.log(`Server online and listening on port ${listeningPort}!`);
});
