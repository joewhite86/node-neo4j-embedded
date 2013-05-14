package de.whitefrog;

import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.PropertyContainer;
import org.neo4j.graphdb.Relationship;

import java.util.ArrayList;
import java.util.Iterator;

public class Neo4jWrapper {
  public class Property {
    public String name;
    public Object value;
    public Property(String name, Object value) {
      this.name = name;
      this.value = value;
    }
  }
  public Property[] getNodeProperties(Node node) {
    ArrayList<Property> properties = new ArrayList<Property>();
    Iterator<String> iterator = node.getPropertyKeys().iterator();
    while(iterator.hasNext()) {
      String key = iterator.next();
      properties.add(new Property(key, node.getProperty(key)));
    }
    return properties.toArray(new Property[properties.size()]);
  }
  public String getType(Relationship relationship) {
    return relationship.getType().name();
  }
}
