package de.whitefrog;

import org.neo4j.cypher.javacompat.ExecutionResult;
import org.neo4j.cypher.javacompat.ExecutionEngine;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;

public class Neo4jWrapper {
  public String[] columnNames;

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
  public Object[][] query(GraphDatabaseService graphDb, String query, Map<String, Object> params) {
    ArrayList<Object[]> results = new ArrayList<Object[]>();
    ArrayList<String> columnNames = new ArrayList<String>();
    ExecutionEngine engine = new ExecutionEngine(graphDb);
    ExecutionResult result = engine.execute(query, params);

    Boolean firstRow = true;
    for(Map<String, Object> row : result) {
      ArrayList<Object> rowResult = new ArrayList<Object>();
      for(Map.Entry<String, Object> column : row.entrySet()) {
        if(firstRow) columnNames.add(column.getKey());
        rowResult.add(column.getValue());
      }
      results.add(rowResult.toArray(new Object[rowResult.size()]));
      firstRow = false;
    }
    this.columnNames = columnNames.toArray(new String[columnNames.size()]);

    return results.toArray(new Object[results.size()][]);
  }
}
