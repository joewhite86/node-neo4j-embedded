function Transaction(tx) {
  this._tx = tx;
}

Transaction.prototype.aquireReadLock = function(propertyContainer) {
  return this._tx.aquireReadLockSync(propertyContainer);
};

Transaction.prototype.aquireWriteLock = function(propertyContainer) {
  return this._tx.aquireWriteLockSync(propertyContainer);
};

Transaction.prototype.failure = function() {
  return this._tx.failureSync();
};

Transaction.prototype.finish = function() {
  return this._tx.finishSync();
};

Transaction.prototype.success = function() {
  return this._tx.successSync();
};

module.exports = Transaction;