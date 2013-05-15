package de.whitefrog;

import org.neo4j.cypher.javacompat.ExecutionResult;
import org.neo4j.cypher.javacompat.ExecutionEngine;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;
import org.neo4j.graphdb.factory.GraphDatabaseFactory;
import org.neo4j.kernel.GraphDatabaseAPI;
import org.neo4j.server.WrappingNeoServerBootstrapper;
import org.neo4j.server.configuration.ServerConfigurator;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;

public class Neo4jWrapper {
  public class Result {
    public String[] columnNames;
    public Object[][] result;
    public Result(String[] columnNames, Object[][] result) {
      this.columnNames = columnNames;
      this.result = result;
    }
  }

  public class Property {
    public String name;
    public Object value;
    public Property(String name, Object value) {
      this.name = name;
      this.value = value;
    }
  }
  public GraphDatabaseService connect(String dir, Map<String, String> properties) {
    return new GraphDatabaseFactory()
        .newEmbeddedDatabaseBuilder(dir)
        .setConfig(properties)
        .newGraphDatabase();
  }
  public GraphDatabaseService connectWrapped(String dir, Map<String, String> properties, Map<String, Object> serverProperties) {
    GraphDatabaseAPI graphdb = (GraphDatabaseAPI) connect(dir, properties);

    ServerConfigurator config;
    config = new ServerConfigurator( graphdb );
    // disable logging by default
    if(!serverProperties.containsKey("java.util.logging.ConsoleHandler.level"))
      serverProperties.put("java.util.logging.ConsoleHandler.level", "OFF");
    Iterator<String> iterator = serverProperties.keySet().iterator();
    while(iterator.hasNext()) {
      String key = iterator.next();
      config.configuration().setProperty(key, serverProperties.get(key));
    }

    WrappingNeoServerBootstrapper srv;
    srv = new WrappingNeoServerBootstrapper( graphdb, config );
    srv.start();

    return graphdb;
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
  public Result query(GraphDatabaseService graphDb, String query, Map<String, Object> params) {
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

    return new Result(
      columnNames.toArray(new String[columnNames.size()]),
      results.toArray(new Object[results.size()][])
    );
  }
}
