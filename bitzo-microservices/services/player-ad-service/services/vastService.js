const axios = require("axios");

async function fetchVast(network) {
  try {
    const response = await axios.get(network.vastUrl, {
      timeout: network.timeout || 5000,
      headers: {
        Accept:
          "application/xml, text/xml, */*",
      },
    });

    if (!response.data) {
      return null;
    }

    const xml = response.data.toString();

    if (!xml.includes("<VAST")) {
      return null;
    }

    return {
      xml,
      vastUrl: network.vastUrl,
    };
  } catch (error) {
    console.error(
      `VAST request failed: ${network.name}`,
      error.message
    );

    return null;
  }
}

module.exports = {
  fetchVast,
};