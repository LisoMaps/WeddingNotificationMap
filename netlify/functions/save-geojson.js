exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  const { features, sha } = JSON.parse(event.body);
  const geojson = { type: "FeatureCollection", features };
  const content = Buffer.from(JSON.stringify(geojson, null, 2)).toString("base64");

  const res = await fetch(
    "https://api.github.com/repos/LisoMaps/WeddingNotificationMap/contents/data/HousesToNotify.geojson",
    {
      method: "PUT",
      headers: {
        Authorization: "token " + process.env.GITHUB_TOKEN,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update notification status",
        content,
        sha,
        branch: "main",
      }),
    }
  );

  const body = await res.json();
  return {
    statusCode: res.ok ? 200 : res.status,
    body: JSON.stringify(body),
  };
};
