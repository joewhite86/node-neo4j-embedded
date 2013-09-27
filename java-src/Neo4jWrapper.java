import org.neo4j.cypher.javacompat.ExecutionResult;
import org.neo4j.cypher.javacompat.ExecutionEngine;
import org.neo4j.cypher.javacompat.QueryStatistics;
import org.neo4j.graphdb.*;
import org.neo4j.graphdb.factory.GraphDatabaseFactory;
import org.neo4j.graphdb.factory.HighlyAvailableGraphDatabaseFactory;
import org.neo4j.graphdb.index.UniqueFactory;
import org.neo4j.kernel.GraphDatabaseAPI;
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

  public class _QueryStatistics {
    public boolean containsUpdates;
    public int deletedNodes;
    public int deletedRelationships;
    public int constraintsAdded;
    public int constraintsRemoved;
    public int indexesAdded;
    public int indexesRemoved;
    public int labelsAdded;
    public int labelsRemoved;
    public int nodesCreated;
    public int propertiesSet;
    public int relationshipsCreated;
    public _QueryStatistics(QueryStatistics queryStatistics) {
      this.containsUpdates = queryStatistics.containsUpdates();
      this.deletedNodes = queryStatistics.getDeletedNodes();
      this.deletedRelationships = queryStatistics.getDeletedRelationships();
      this.constraintsAdded = queryStatistics.getConstraintsAdded();
      this.constraintsRemoved = queryStatistics.getConstraintsRemoved();
      this.indexesAdded = queryStatistics.getIndexesAdded();
      this.indexesRemoved = queryStatistics.getIndexesRemoved();
      this.labelsAdded = queryStatistics.getLabelsAdded();
      this.labelsRemoved = queryStatistics.getLabelsRemoved();
      this.nodesCreated = queryStatistics.getNodesCreated();
      this.propertiesSet = queryStatistics.getPropertiesSet();
      this.relationshipsCreated = queryStatistics.getRelationshipsCreated();
    }
  }

  private QueryStatistics queryStatistics;

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
    for(String key: serverProperties.keySet()) {
      config.configuration().setProperty(key, serverProperties.get(key));
    }

    new WrappingNeoServerBootstrapper( graphDb, config ).start();

    return graphDb;
  }
  public GraphDatabaseService connectWrapped(String dir, Map<String, String> properties, Map<String, Object> serverProperties) {
    GraphDatabaseAPI graphDb = (GraphDatabaseAPI) this.connect(dir, properties);

    ServerConfigurator config = new ServerConfigurator( graphDb );
    for(String key: serverProperties.keySet()) {
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

  public String[] getNodeLabels(final Node node) {
    ArrayList<String> labels = new ArrayList<>();
    for(Label label: node.getLabels()) {
      labels.add(label.name());
    }
    return labels.toArray(new String[labels.size()]);
  }

  public Property[] getNodeProperties(final Node node) {
    ArrayList<Property> properties = new ArrayList<>();
    for(String key: node.getPropertyKeys()) {
      properties.add(new Property(key, node.getProperty(key)));
    }
    return properties.toArray(new Property[properties.size()]);
  }
  public Property[] getRelationshipProperties(final Relationship relationship) {
    ArrayList<Property> properties = new ArrayList<>();
    Iterator<String> iterator = relationship.getPropertyKeys().iterator();
    for(String key: relationship.getPropertyKeys()) {
      properties.add(new Property(key, relationship.getProperty(key)));
    }
    return properties.toArray(new Property[properties.size()]);
  }
  public String getType(Relationship relationship) {
    return relationship.getType().name();
  }
  public _QueryStatistics getQueryStatistics() {
    return new _QueryStatistics(this.queryStatistics);
  }
  public Result query(final GraphDatabaseService graphDb, final String query, final Map<String, Object> params) {
    ArrayList<Object[]> results = new ArrayList<>();
    ArrayList<String> columnNames = new ArrayList<>();

    try(Transaction tx = graphDb.beginTx()) {
      ExecutionEngine engine = new ExecutionEngine(graphDb);
      ExecutionResult result = engine.execute(query, params);
      this.queryStatistics = result.getQueryStatistics();

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
      tx.success();
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
