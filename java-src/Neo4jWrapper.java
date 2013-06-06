import org.neo4j.cypher.javacompat.ExecutionResult;
import org.neo4j.cypher.javacompat.ExecutionEngine;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;
import org.neo4j.graphdb.factory.GraphDatabaseFactory;
import org.neo4j.graphdb.factory.HighlyAvailableGraphDatabaseFactory;
import org.neo4j.graphdb.index.UniqueFactory;
import org.neo4j.kernel.GraphDatabaseAPI;
import org.neo4j.kernel.HighlyAvailableGraphDatabase;
import org.neo4j.server.WrappingNeoServerBootstrapper;
import org.neo4j.server.configuration.ServerConfigurator;

import java.util.ArrayList;
import java.util.HashMap;
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
    GraphDatabaseService graphDb = new GraphDatabaseFactory()
        .newEmbeddedDatabaseBuilder(dir)
        .setConfig(properties)
        .newGraphDatabase();
    this.installShutdownHook(graphDb);
    return graphDb;
  }
  public GraphDatabaseService connectHA(String dir, Map<String, String> haConfig) {
    GraphDatabaseService graphDb = new HighlyAvailableGraphDatabaseFactory()
        .newHighlyAvailableDatabaseBuilder(dir)
        .setConfig(haConfig)
        .newGraphDatabase();
    this.installShutdownHook(graphDb);
    return graphDb;
  }
  public GraphDatabaseService connectHAWrapped(String dir, Map<String, String> haConfig, Map<String, Object> serverProperties) {
    GraphDatabaseAPI graphDb = (GraphDatabaseAPI) this.connectHA(dir, haConfig);

    ServerConfigurator config = new ServerConfigurator( graphDb );
    Iterator<String> iterator = serverProperties.keySet().iterator();
    while(iterator.hasNext()) {
      String key = iterator.next();
      config.configuration().setProperty(key, serverProperties.get(key));
    }

    new WrappingNeoServerBootstrapper( graphDb, config ).start();

    return graphDb;
  }
  public GraphDatabaseService connectWrapped(String dir, Map<String, String> properties, Map<String, Object> serverProperties) {
    GraphDatabaseAPI graphDb = (GraphDatabaseAPI) this.connect(dir, properties);

    ServerConfigurator config = new ServerConfigurator( graphDb );
    Iterator<String> iterator = serverProperties.keySet().iterator();
    while(iterator.hasNext()) {
      String key = iterator.next();
      config.configuration().setProperty(key, serverProperties.get(key));
    }

    new WrappingNeoServerBootstrapper( graphDb, config ).start();

    return graphDb;
  }

  public Node getOrCreate(final GraphDatabaseService graphDb, final String indexName, final String property, final Object value) {
    UniqueFactory<Node> factory = new UniqueFactory.UniqueNodeFactory(graphDb, indexName) {
      @Override
      protected void initialize( Node created, Map<String, Object> properties ) {
        created.setProperty(property, properties.get( property ) );
      }
    };
 
    return factory.getOrCreate(property, value);
  }

  public void installShutdownHook(final GraphDatabaseService graphDb) {
    Runtime.getRuntime().addShutdownHook( new Thread()
    {
      @Override
      public void run()
      {
        graphDb.shutdown();
      }
    } );
  }

  public Property[] getNodeProperties(final Node node) {
    ArrayList<Property> properties = new ArrayList<>();
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
  public Result query(final GraphDatabaseService graphDb, final String query, final Map<String, Object> params) {
    ArrayList<Object[]> results = new ArrayList<>();
    ArrayList<String> columnNames = new ArrayList<>();
    ExecutionEngine engine = new ExecutionEngine(graphDb);
    ExecutionResult result = engine.execute(query, params);

    Boolean firstRow = true;
    for(Map<String, Object> row : result) {
      ArrayList<Object> rowResult = new ArrayList<>();
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

  public static void main(String[] args) {
    Neo4jWrapper wrapper = new Neo4jWrapper();
    HashMap<String, String> haConfig = new HashMap<>();
    HashMap<String, Object> serverProperties = new HashMap<>();

    haConfig.put("ha.server_id", "3");
    haConfig.put("ha.initial_hosts", ":5001");
    haConfig.put("ha.server", ":6003");
    haConfig.put("ha.cluster_server", ":5003");
    haConfig.put("org.neo4j.server.database.mode", "HA");

    serverProperties.put("org.neo4j.server.webserver.port", "7676");
    serverProperties.put("org.neo4j.server.webserver.https.port", "7675");

    final GraphDatabaseService graphDb = wrapper.connectHA("test.db", haConfig);

    Runtime.getRuntime().addShutdownHook(new Thread() {
      @Override
      public void run() {
        graphDb.shutdown();
      }
    });
  }
}
