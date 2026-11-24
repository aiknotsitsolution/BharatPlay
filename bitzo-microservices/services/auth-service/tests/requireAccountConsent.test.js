const requireAccountConsent = require("../middlewares/requireAccountConsent");

const evaluateConsent = (body) => {
  const req = { body };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();

  requireAccountConsent(req, res, next);

  return { res, next };
};

describe("account consent middleware", () => {
  test("requires explicit age confirmation", () => {
    const { res, next } = evaluateConsent({ termsAccepted: true });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "AGE_CONFIRMATION_REQUIRED" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("requires explicit terms acceptance", () => {
    const { res, next } = evaluateConsent({ ageConfirmed: true });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "TERMS_ACCEPTANCE_REQUIRED" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("continues only when both confirmations are true", () => {
    const { res, next } = evaluateConsent({
      ageConfirmed: true,
      termsAccepted: true,
    });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
