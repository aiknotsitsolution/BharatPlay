// const mongoose = require('mongoose'); // Erase if already required

// // Declare the Schema of the Mongo model
// var categorySchema = new mongoose.Schema({
//     name: String
// });

// //Export the model
// module.exports = require("../../config/connections").categoryDB().model("Category", categorySchema);


const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  isMain: { type: Boolean, default: false }, // true = top-level main category
  isCreativeCorner: { type: Boolean, default: false },
  createdFromHashtag: { type: String }, // original hashtag if graduated
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Category', categorySchema);