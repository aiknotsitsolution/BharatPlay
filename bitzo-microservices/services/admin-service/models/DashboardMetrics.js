const mongoose = require("mongoose");
const connections = require("../config/connections");

const metricSchema = new mongoose.Schema(
  {
    createdAt: Date,
    status: String,
    event: String,
  },
  { strict: false },
);

const getModel = (connection, name, collection) =>
  connection.models[name] || connection.model(name, metricSchema, collection);

module.exports = {
  getContactRequestModel: () =>
    getModel(connections.authDB(), "DashboardContactRequest", "contactrequests"),
  getCopyrightCaseModel: () =>
    getModel(connections.copyrightDB(), "DashboardCopyrightCase", "copyrightcases"),
  getAdImpressionModel: () =>
    getModel(connections.playerAdDB(), "DashboardAdImpression", "adimpressions"),
};
