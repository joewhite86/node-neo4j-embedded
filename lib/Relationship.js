var Node = require('./Node');

function Relationship(relationship) {
  'use strict';

  this._rel = relationship;
}

Relationship.prototype.delete = function() {
  'use strict';

  return this._rel.deleteSync();
};

Relationship.prototype.getEndNode = function() {
  'use strict';

  return new Node(this._rel.getEndNodeSync());
};

Relationship.prototype.getId = function() {
  'use strict';

  return this._rel.getIdSync().longValue;
};

Relationship.prototype.getProperty = function(name) {
  'use strict';

  return this._rel.getPropertySync(name);
};

Relationship.prototype.getStartNode = function() {
  'use strict';

  return new Node(this._rel.getStartNodeSync());
};

Relationship.prototype.getType = function() {
  'use strict';

  return this._rel.getTypeSync();
};

Relationship.prototype.setProperty = function(name, value) {
  'use strict';

  return this._rel.setPropertySync(name, value);
};

module.exports = Relationship;