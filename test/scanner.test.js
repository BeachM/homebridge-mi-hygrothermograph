const assert = require("assert");
const { describe, it, beforeEach, afterEach } = require("mocha");
const proxyquire = require("proxyquire").noCallThru();
const sinon = require("sinon");
const { PeripheralMock, ParseMock, nobleMock, mockLogger } = require("./mocks");
const { EventTypes, SERVICE_DATA_UUID } = require("../lib/parser");

const { Scanner } = proxyquire("../lib/scanner", {
  noble: nobleMock
});

describe("scanner", () => {
  const sensorData = {
    temperatureAndHumidity: Buffer.from(
      "5020aa01b064aed0a8654c0d1004d9006001",
      "hex"
    ),
    humidity: Buffer.from("5020aa01a164aed0a8654c0610025d01", "hex"),
    temperature: Buffer.from("5020aa01a664aed0a8654c041002d900", "hex"),
    battery: Buffer.from("5020aa014e64aed0a8654c0a10015d", "hex"),
    illuminance: Buffer.from("71209800a764aed0a8654c0d0710030e0000", "hex"),
    moisture: Buffer.from("71209800a864aed0a8654c0d08100112", "hex"),
    fertility: Buffer.from("71209800a564aed0a8654c0d091002b800", "hex")
  };

  beforeEach(() => {
    this.scanner = new Scanner(mockLogger);
  });

  afterEach(() => {
    nobleMock.removeAllListeners();
  });

  it("should discover temperature event", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("temperatureChange", eventSpy);
    const peripheral = new PeripheralMock(sensorData.temperature);
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.calledWith(21.7));
  });

  it("should discover humidity event", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("humidityChange", eventSpy);
    const peripheral = new PeripheralMock(sensorData.humidity);
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.calledWith(34.9));
  });

  it("should discover humidity & temperature event", () => {
    const humidityEventSpy = sinon.spy();
    const temperatureEventSpy = sinon.spy();
    this.scanner.on("humidityChange", humidityEventSpy);
    this.scanner.on("temperatureChange", temperatureEventSpy);
    const peripheral = new PeripheralMock(sensorData.temperatureAndHumidity);
    nobleMock.emit("discover", peripheral);
    assert(temperatureEventSpy.calledWith(21.7));
    assert(humidityEventSpy.calledWith(35.2));
  });

  it("should discover battery event", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("batteryChange", eventSpy);
    const peripheral = new PeripheralMock(sensorData.battery);
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.calledWith(93));
  });

  it("should discover illuminance event", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("illuminanceChange", eventSpy);
    const peripheral = new PeripheralMock(sensorData.illuminance);
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.calledWith(14));
  });

  it("should discover moisture event", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("moistureChange", eventSpy);
    const peripheral = new PeripheralMock(sensorData.moisture);
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.calledWith(18));
  });

  it("should discover fertility event", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("fertilityChange", eventSpy);
    const peripheral = new PeripheralMock(sensorData.fertility);
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.calledWith(184));
  });

  it("should not discover all peripherals with defined address", () => {
    const eventSpy = sinon.spy();
    const wrongPeripheral = new PeripheralMock(
      sensorData.temperatureAndHumidity,
      "cdb"
    );
    const correctPeripheral = new PeripheralMock(
      sensorData.temperatureAndHumidity,
      "abc"
    );
    const scanner = new Scanner(mockLogger, "ABC");
    scanner.on("temperatureChange", eventSpy);
    nobleMock.emit("discover", wrongPeripheral);
    assert(eventSpy.notCalled);
    nobleMock.emit("discover", correctPeripheral);
    assert(eventSpy.calledWith(21.7));
  });

  it("should discard wrongs uuids", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("temperatureChange", eventSpy);
    const peripheral = new PeripheralMock(
      sensorData.temperature,
      "123",
      "deadbeef"
    );
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.notCalled);
  });

  it("should handle parse errors", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("temperatureChange", eventSpy);
    const peripheral = new PeripheralMock(Buffer.from("deadbeefed", "hex"));
    assert.throws(() => nobleMock.emit("discover", peripheral));
  });

  it("should emit errors", () => {
    const eventSpy = sinon.spy();
    this.scanner.on("error", eventSpy);
    const peripheral = new PeripheralMock(Buffer.from("deadbeefed", "hex"));
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.calledWith(sinon.match.instanceOf(Error)));
  });

  it("should start scanning", () => {
    const startScanningStub = sinon.stub(nobleMock, "startScanning");
    const stopScanningStub = sinon.stub(nobleMock, "stopScanning");

    this.scanner.start();
    nobleMock.emit("stateChange", "poweredOn");
    assert(startScanningStub.called);
    nobleMock.emit("stateChange", "poweredOff");
    assert(stopScanningStub.called);
  });

  it("should handle unknown event type", () => {
    const mockedScanner = proxyquire("../lib/scanner", {
      noble: nobleMock,
      "./parser": {
        Parser: ParseMock,
        SERVICE_DATA_UUID,
        EventTypes
      }
    });
    const scanner = new mockedScanner.Scanner(mockLogger);
    scanner.start();
    const peripheral = new PeripheralMock(
      Buffer.from("5020aa01a164aed0a8654c0610025d01", "hex")
    );
    assert.throws(() => nobleMock.emit("discover", peripheral), Error);
    const eventSpy = sinon.spy();
    scanner.on("error", eventSpy);
    nobleMock.emit("discover", peripheral);
    assert(eventSpy.calledWith(sinon.match.instanceOf(Error)));
  });

  it("should log on scanStart", () => {
    const spyDebugLogger = sinon.spy(mockLogger, "debug");
    new Scanner(mockLogger, "ABC");
    nobleMock.emit("scanStart");
    assert(spyDebugLogger.called);
    spyDebugLogger.restore();
  });

  it("should log on scanStop", () => {
    const spyDebugLogger = sinon.spy(mockLogger, "debug");
    new Scanner(mockLogger, "ABC");
    nobleMock.emit("scanStop");
    assert(spyDebugLogger.called);
    spyDebugLogger.restore();
  });

  it("should log on warning", () => {
    const spyInfoLogger = sinon.spy(mockLogger, "info");
    new Scanner(mockLogger, "ABC");
    nobleMock.emit("warning", "some warning");
    assert(spyInfoLogger.called);
    spyInfoLogger.restore();
  });
});
