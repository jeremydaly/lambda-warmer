"use strict";

const expect = require("chai").expect; // assertion library
const sinon = require("sinon"); // Require Sinon.js library
const rewire = require("rewire"); // Rewire library

const lambda = require("../lib/lambda-service"); // Init Lambda Service

let stub;

describe("Target Tests", function () {
  beforeEach(function () {
    stub = sinon.stub(lambda, "invoke");

    process.env.AWS_LAMBDA_FUNCTION_NAME = "test-function";
    process.env.AWS_LAMBDA_FUNCTION_VERSION = "$LATEST";
  });

  afterEach(function () {
    stub.restore();
  });

  describe("Using default configuration", function () {
    it("should do nothing if there is no target in the event and the concurrency is 1 and function version is $LATEST", function (done) {
      let warmer = rewire("../index");
      stub.returns(true);

      let event = { warmer: true, concurrency: 1 };
      warmer(event, { log: false }).then((out) => {
        expect(stub.callCount).to.equal(0);
        expect(out).to.equal(true);
        done();
      });
    });

    it("should do nothing if there is no target in the event and the concurrency is 1 and function version is not $LATEST", function (done) {
      process.env.AWS_LAMBDA_FUNCTION_VERSION = "1";

      let warmer = rewire("../index");
      stub.returns(true);

      let event = { warmer: true, concurrency: 1 };
      warmer(event, { log: false }).then((out) => {
        expect(stub.callCount).to.equal(0);
        expect(out).to.equal(true);
        done();
      });
    });

    it("should invoke the same lambda if there is no target in the event and the concurrency is more than 1", function (done) {
      let warmer = rewire("../index");
      stub.returns(true);

      let event = { warmer: true, concurrency: 2 };
      warmer(event, { log: false }).then((out) => {
        expect(stub.callCount).to.equal(1);
        expect(stub.args[0][0].InvocationType).to.equal("RequestResponse");
        expect(stub.args[0][0].FunctionName).to.equal("test-function:$LATEST");
        expect(out).to.equal(true);
        done();
      });
    });

    describe("should invoke a different lambda", function (done) {
      it("if the target function name is different", function (done) {
        let warmer = rewire("../index");
        stub.returns(true);

        let event = { warmer: true, concurrency: 1, target: "other" };
        warmer(event, { log: false }).then((out) => {
          expect(stub.callCount).to.equal(1);
          expect(stub.args[0][0].InvocationType).to.equal("RequestResponse");
          expect(stub.args[0][0].FunctionName).to.equal("other");
          expect(out).to.equal(true);
          done();
        });
      });

      it("if the target function version is different", function (done) {
        let warmer = rewire("../index");
        stub.returns(true);

        let event = { warmer: true, concurrency: 1, target: "test-function:1" };
        warmer(event, { log: false }).then((out) => {
          expect(stub.callCount).to.equal(1);
          expect(stub.args[0][0].InvocationType).to.equal("RequestResponse");
          expect(stub.args[0][0].FunctionName).to.equal("test-function:1");
          expect(out).to.equal(true);
          done();
        });
      });

      it("if the current function is not $LATEST and the target is with no alias (i.e. $LATEST)", function (done) {
        process.env.AWS_LAMBDA_FUNCTION_VERSION = "1";
        let warmer = rewire("../index");
        stub.returns(true);

        let event = { warmer: true, concurrency: 1, target: "test-function" };
        warmer(event, { log: false }).then((out) => {
          expect(stub.callCount).to.equal(1);
          expect(stub.args[0][0].InvocationType).to.equal("RequestResponse");
          expect(stub.args[0][0].FunctionName).to.equal("test-function");
          expect(out).to.equal(true);
          done();
        });
      });
    });

    it("should return true with two lambda invocations", function (done) {
      let warmer = rewire("../index");
      stub.returns(true);

      let event = { warmer: true, concurrency: 2, target: "other" };
      warmer(event, { log: false }).then((out) => {
        expect(stub.callCount).to.equal(2);
        expect(stub.args[0][0].InvocationType).to.equal("Event");
        expect(stub.args[0][0].FunctionName).to.equal("other");
        expect(stub.args[1][0].InvocationType).to.equal("RequestResponse");
        expect(stub.args[1][0].FunctionName).to.equal("other");
        expect(out).to.equal(true);
        done();
      });
    });

    it("should return true with three lambda invocations", function (done) {
      let warmer = rewire("../index");
      stub.returns(true);

      let event = { warmer: true, concurrency: 3, target: "other" };
      warmer(event, { log: false }).then((out) => {
        expect(stub.callCount).to.equal(3);
        expect(stub.args[0][0].InvocationType).to.equal("Event");
        expect(stub.args[0][0].FunctionName).to.equal("other");
        expect(stub.args[1][0].InvocationType).to.equal("Event");
        expect(stub.args[1][0].FunctionName).to.equal("other");
        expect(stub.args[2][0].InvocationType).to.equal("RequestResponse");
        expect(stub.args[2][0].FunctionName).to.equal("other");
        expect(out).to.equal(true);
        done();
      });
    });
  });

  describe("Using modified configuration", function () {
    it("should return true with a single lambda invocation", function (done) {
      let warmer = rewire("../index");
      stub.returns(true);

      let event = { warmerX: true, concurrencyX: 1, targetX: "other" };
      warmer(event, {
        flag: "warmerX",
        concurrency: "concurrencyX",
        target: "targetX",
        log: false,
      }).then((out) => {
        expect(stub.callCount).to.equal(1);
        expect(stub.args[0][0].InvocationType).to.equal("RequestResponse");
        expect(stub.args[0][0].FunctionName).to.equal("other");
        expect(out).to.equal(true);
        done();
      });
    });

    it("should return true with two lambda invocations", function (done) {
      let warmer = rewire("../index");
      stub.returns(true);

      let event = { warmerX: true, concurrencyX: 2, targetX: "other" };
      warmer(event, {
        flag: "warmerX",
        concurrency: "concurrencyX",
        target: "targetX",
        log: false,
      }).then((out) => {
        expect(stub.callCount).to.equal(2);
        expect(stub.args[0][0].InvocationType).to.equal("Event");
        expect(stub.args[0][0].FunctionName).to.equal("other");
        expect(stub.args[1][0].InvocationType).to.equal("RequestResponse");
        expect(stub.args[1][0].FunctionName).to.equal("other");
        expect(out).to.equal(true);
        done();
      });
    });

    it("should return true with three lambda invocations", function (done) {
      let warmer = rewire("../index");
      stub.returns(true);

      let event = { warmerX: true, concurrencyX: 3, targetX: "other" };
      warmer(event, {
        flag: "warmerX",
        concurrency: "concurrencyX",
        target: "targetX",
        log: false,
      }).then((out) => {
        expect(stub.callCount).to.equal(3);
        expect(stub.args[0][0].InvocationType).to.equal("Event");
        expect(stub.args[0][0].FunctionName).to.equal("other");
        expect(stub.args[1][0].InvocationType).to.equal("Event");
        expect(stub.args[1][0].FunctionName).to.equal("other");
        expect(stub.args[2][0].InvocationType).to.equal("RequestResponse");
        expect(stub.args[2][0].FunctionName).to.equal("other");
        expect(out).to.equal(true);
        done();
      });
    });
  });

  describe("Lambda Invocation Errors", function () {
    it("should throw an error", function () {
      let warmer = rewire("../index");
      stub.throws(new Error("some error"));
      let event = { warmer: true, concurrency: 2, target: "other" };
      let error;

      try {
        warmer(event, { log: false });
      } catch (e) {
        error = e;
      }

      expect(error.message).to.equal("some error");
    });
  });
});
