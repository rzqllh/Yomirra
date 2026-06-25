async function run() {
  const query = `
    query ($search: String) {
      Media (search: $search, type: MANGA) {
        averageScore
      }
    }
  `;
  const variables = { search: "Solo Leveling" };

  const url = "https://graphql.anilist.co";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables })
  };

  try {
    const res = await fetch(url, options);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
