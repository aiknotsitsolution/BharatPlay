jest.mock("../models/usermodel", () => ({
  findById: jest.fn(),
}));
jest.mock("../services/accountDeletionService", () => ({
  deleteUserAccountData: jest.fn(),
}));
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const User = require("../models/usermodel");
const { deleteUserAccountData } = require("../services/accountDeletionService");
const { OAuth2Client } = require("google-auth-library");
const { deleteMyAccount } = require("../controller/accountDeletionController");

const account = {
  _id: "507f1f77bcf86cd799439011",
  email: "member@example.com",
  password: bcrypt.hashSync("correct-password", 4),
  googleId: "google-account-sub",
};

const makeResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

const makeRequest = (overrides = {}) => ({
  user: { id: account._id },
  body: {
    confirmEmail: account.email,
    password: "correct-password",
    confirmations: {
      content: true,
      account: true,
      permanent: true,
    },
    ...overrides,
  },
});

describe("deleteMyAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(account),
    });
    deleteUserAccountData.mockResolvedValue(undefined);
  });

  test("requires all acknowledgements and exact account email", async () => {
    const response = makeResponse();

    await deleteMyAccount(
      makeRequest({
        confirmEmail: "other@example.com",
      }),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(deleteUserAccountData).not.toHaveBeenCalled();
  });

  test("deletes only after password reauthentication and confirmations", async () => {
    const response = makeResponse();

    await deleteMyAccount(makeRequest(), response);

    expect(deleteUserAccountData).toHaveBeenCalledWith(account._id);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  test("supports verified Google reauthentication", async () => {
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    const verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => ({
        email: account.email,
        email_verified: true,
        sub: account.googleId,
      }),
    });
    OAuth2Client.mockImplementation(() => ({ verifyIdToken }));
    const response = makeResponse();

    await deleteMyAccount(
      makeRequest({ password: "", googleCredential: "google-id-token" }),
      response,
    );

    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: "google-id-token",
      audience: ["test-client-id"],
    });
    expect(deleteUserAccountData).toHaveBeenCalledWith(account._id);
    expect(response.status).toHaveBeenCalledWith(200);
  });
});
