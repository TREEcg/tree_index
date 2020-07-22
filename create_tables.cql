DROP KEYSPACE IF EXISTS proto;

CREATE KEYSPACE proto WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 1};

CREATE TABLE proto.streams ( 
  streamID text, 
  name text,
  timeProperty frozen<list<text>>,
  properties text,
  status text,
  PRIMARY KEY (streamID),
);

CREATE TABLE proto.streams_by_name ( 
  streamID text, 
  name text,
  timeProperty frozen<list<text>>,
  properties text,
  status text,
  PRIMARY KEY (name),
);

CREATE TABLE proto.fragmentations_by_stream ( 
  streamID text, 
  name text,
  shaclPath frozen<list<text>>,
  propertyLabel text,
  kind text,
  params text,
  status text,
  PRIMARY KEY (streamID, name)
);

CREATE TABLE proto.buckets_by_fragmentation ( 
  streamID text, 
  fragmentName text,
  value text,
  count counter,
  PRIMARY KEY (streamID, fragmentName, value)
);

CREATE TABLE proto.events_by_bucket ( 
  streamID text, 
  fragmentName text,
  bucketValue text, 
  eventID text,
  eventData text,
  eventTime timestamp,
  level smallint,
  PRIMARY KEY ((streamID, fragmentName, bucketValue), eventTime, eventID)
) WITH CLUSTERING ORDER BY (eventTime ASC, eventID ASC);

CREATE INDEX ON proto.events_by_bucket ( KEYS ( level ) );

CREATE TABLE proto.events_by_stream ( 
  streamID text, 
  eventTime timestamp,
  eventID text,
  eventData text,
  level smallint,
  PRIMARY KEY (streamID, eventTime, eventID)
) WITH CLUSTERING ORDER BY (eventTime ASC, eventID ASC);

CREATE INDEX ON proto.events_by_stream ( KEYS ( level ) );

CREATE TABLE proto.state ( 
  key text, 
  value text,
  PRIMARY KEY (key)
);
