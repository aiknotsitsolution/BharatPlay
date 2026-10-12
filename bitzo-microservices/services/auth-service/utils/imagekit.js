const ImageKit = require('imagekit');

// Initialize ImageKit with your credentials
const imagekit = new ImageKit({

    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,   // Public API Key from your ImageKit dashboard
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT, // Your URL endpoint from the dashboard
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // Private API Key from your ImageKit dashboard
});

module.exports = imagekit;