const assert = require('assert');
const EventEmitter = require('events');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { describe, it, beforeEach } = require('mocha');

class CharacteristicMock {
  setProps() { return this; }
  updateValue() { return this; }
  on() { return this; }
}

class ServiceMock {
  setCharacteristic() { return this; }
  getCharacteristic() { return new CharacteristicMock(); }
}

class ScannerMock extends EventEmitter {
  start() {}
}

describe('accessory', () => {
  beforeEach(() => {
    this.mockLogger = { debug() { }, error() { } };

    proxyquire('../lib/accessory', {
      './scanner': {
        Scanner: ScannerMock,
      },
    });

    this.mockServices = {
      BatteryService: ServiceMock,
      HumiditySensor: ServiceMock,
      TemperatureSensor: ServiceMock,
      AccessoryInformation: ServiceMock,
    };
    this.mockCharacteristics = {
      BatteryLevel: CharacteristicMock,
      Manufacturer: CharacteristicMock,
      Model: CharacteristicMock,
      SerialNumber: CharacteristicMock,
      CurrentTemperature: CharacteristicMock,
      CurrentRelativeHumidity: CharacteristicMock,
    };
    this.mockHap = {
      Service: this.mockServices,
      Characteristic: this.mockCharacteristics,
    };
    // eslint-disable-next-line global-require
    const { MiHygrothermographAccessory } = require('../lib/accessory')(this.mockHap);
    this.MiHygrothermographAccessory = MiHygrothermographAccessory;
  });

  it('should update current temperature', () => {
    const accessory = new this.MiHygrothermographAccessory(this.mockLogger, {});
    accessory.scanner.emit('temperatureChange', 20.5, { address: '123', id: '123' });
    assert.equal(accessory.currentTemperature, 20.5);
    accessory.scanner.emit('temperatureChange', 25.5, { address: '123', id: '123' });
    assert.equal(accessory.currentTemperature, 25.5);
  });
  it('should update current humidity', () => {
    const accessory = new this.MiHygrothermographAccessory(this.mockLogger, {});
    accessory.scanner.emit('humidityChange', 30.5, { address: '123', id: '123' });
    assert.equal(accessory.currentHumidity, 30.5);
    accessory.scanner.emit('humidityChange', 35.5, { address: '123', id: '123' });
    assert.equal(accessory.currentHumidity, 35.5);
  });

  it('should update current battery level', () => {
    const accessory = new this.MiHygrothermographAccessory(this.mockLogger, {});
    accessory.scanner.emit('batteryChange', 90, { address: '123', id: '123' });
    assert.equal(accessory.currentBatteryLevel, 90);
    accessory.scanner.emit('batteryChange', 9, { address: '123', id: '123' });
    assert.equal(accessory.currentBatteryLevel, 9);
  });

  it('should receive error', () => {
    const spyLogger = sinon.spy(this.mockLogger, 'error');
    const accessory = new this.MiHygrothermographAccessory(this.mockLogger, {});
    accessory.scanner.emit('error', new Error('error'));
    assert(spyLogger.called);
  });
});
