const EventEmitter = require('events');

class CharacteristicMock extends EventEmitter {
  constructor() {
    super();
    this.BATTERY_LEVEL_NORMAL = 1;
    this.BATTERY_LEVEL_LOW = 0;
  }
  setProps() { return this; }
  updateValue() { return this; }
}

class ServiceMock {
  setCharacteristic() { return this; }
  getCharacteristic(type) {
    return type;
  }
}

class ScannerMock extends EventEmitter {
  start() {}
}

const mockLogger = { debug() { }, error() { } };

class NobleMock extends EventEmitter {
  startScanning() {}
  stopScanning() {}
}

class PeripheralMock {
  constructor(event, address = '4c:65:a8:d0:ae:64', uuid = 'fe95') {
    this.id = '4c65a8d0ae65';
    this.address = address;
    this.rssi = -67;
    this.advertisement = {
      localName: 'MJ_HT_V1',
      serviceData: [{
        uuid,
        data: event,
      }],
    };
  }
}

module.exports = {
  CharacteristicMock,
  ServiceMock,
  ScannerMock,
  mockLogger,
  PeripheralMock,
  nobleMock: new NobleMock(),
};
