// Wrapper for MongoDB
// So we can host it on both replit (for development) and self-hosted
// this is confusing ngl

const monk = require('monk')

class Database {
  constructor(url) {
    this.db = monk(url || process.env.MONGO_URL || 'localhost/flag-clicked')
  }
  async get(key) {
    var collection = null;
    let base = key.split("-");
    
    if (base.length < 2) {
      if (!this.collections.main) {
        this.collections.main = this.db.get('main')
      }
      
      collection = this.collections.main
    } else {
      if (!this.collections[base[0]]) {
        this.collections[base[0]] = this.db.get(base[0])
      }
      collection = this.collections[base[0]]
      base.shift();
    }
    
    
    
    var data;
    try {
      data = await collection.findOne({
        __internalKey: { $regex: new RegExp(escapeRegExp(base.join('')), 'i') }
      })
    } catch(ex) {
      throw ex
    }
    
    return data.obj
  }
  async set(key, value) {
    var collection = null;
    let base = key.split("-");
    
    if (base.length < 2) {
      if (!this.collections.main) {
        this.collections.main = this.db.get('main')
      }
      
      collection = this.collections.main
    } else {
      if (!this.collections[base[0]]) {
        this.collections[base[0]] = this.db.get(base[0])
      }
      collection = this.collections[base[0]]
      base.shift();
    }
    
    let val = this.get(key);
    
    if (val) {
      await collection.update( { __internalKey: escapeRegExp(base.join('')) }, { $set: { obj: value } })
    } else {
      await collection.insert({ __internalKey: escapeRegExp(base.join('')), obj: value })
    }
  }
  async list(prefix) {
    var collection = null;
    let base = key.split("-");
    
    if (base.length < 2) {
      if (!this.collections.main) {
        this.collections.main = this.db.get('main')
      }
      
      collection = this.collections.main
    } else {
      if (!this.collections[base[0]]) {
        this.collections[base[0]] = this.db.get(base[0])
      }
      collection = this.collections[base[0]]
      base.shift();
    }
    
    return collection.list()
  }
  collections = {}
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


module.exports = Database
