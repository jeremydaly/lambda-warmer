const expect = require("chai").expect; // assertion library
const sinon = require("sinon"); // Require Sinon.js library

const lambda = require("../lib/lambda-service"); // Init Lambda Service

let stub; // init stub

describe("Lambda service", () => {
  beforeEach(function () {
    // Stub invoke
    stub = sinon.stub(lambda, "invoke");
  });

  afterEach(function () {
    stub.restore();
  });

  describe("invoke", () => {
    it("should invoke a lambda function with given params", () => {
      const params = {
        FunctionName: "test-function",
        InvocationType: "RequestResponse",
      };

      lambda.invoke(params);

      expect(stub.calledOnce).to.be.true;
      expect(stub.calledWith(params)).to.be.true;
    });
  });
});
