/**
 * Transaction wrapper.
 */
function Transaction(tx) {
  this._tx = tx;
}

/**
 * Aquire a read lock on a node or relationship.
 * @param {Object} propertyContainer Entity to lock.
 */
Transaction.prototype.aquireReadLock = function(propertyContainer) {
  return this._tx.aquireReadLockSync(propertyContainer);
};

/**
 * Aquire a write lock on a node or relationship.
 * @param {Object} propertyContainer Entity to lock.
 */
Transaction.prototype.aquireWriteLock = function(propertyContainer) {
  return this._tx.aquireWriteLockSync(propertyContainer);
};

/**
 * Mark the transaction as failed.
 */
Transaction.prototype.failure = function() {
  return this._tx.failureSync();
};

/**
 * Finish the transaction. Either #failure or #success should be called before.
 * If the transaction failed, the transaction will be rolled back.
 */
Transaction.prototype.finish = function() {
  return this._tx.finishSync();
};

/**
 * Mark the transaction as successful.
 */
Transaction.prototype.success = function() {
  return this._tx.successSync();
};

module.exports = Transaction;