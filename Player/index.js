import PouchDB from 'pouchdb';

class Player {
  constructor (startingSystem) {
    this.currentSystem = startingSystem;
    this.systemDeltas = new PouchDB('systemDeltas');
  }
  visitSystem (systemId) {
    
  }
}

export default Player;
