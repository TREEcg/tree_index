# Requirements

1. [Node.js](https://nodejs.org/en/)
2. [Typescript](https://www.typescriptlang.org/)
3. [Docker](https://www.docker.com/)

# Provisioning

Because we offload a _lot_ of work to the database, we use [Scylla](https://www.scylladb.com/) instead of regular Cassandra database. A local Scylla database can be started using docker, see their [Docker Hub page](https://hub.docker.com/r/scylladb/scylla/) and their [Best Practices for Running Scylla on Docker page](https://docs.scylladb.com/operating-scylla/procedures/tips/best_practices_scylla_on_docker/).

**Note 1**: If, after running `docker logs some-scylla | tail`, you errors like:

> Could not setup Async I/O: Resource temporarily unavailable. The most common cause is not enough request capacity in /proc/sys/fs/aio-max-nr. Try increasing that number or reducing the amount of logical CPUs available for your application

You'll have to limit the amount of logical cores using `--smp`, e.g.:

`docker run --name some-scylla --hostname some-scylla -d scylladb/scylla --smp 4`

**Note 2**: By default, this container will consume all available memory. You can restrict its memory consumption using `--memory`, e.g.:

> `docker run --name some-scylla --hostname some-scylla -d scylladb/scylla --memory 8G`

## Setting up the tables

Start a `cqlsh` session:
`docker exec -it some-scylla cqlsh` 

And execute these statements:

```
CREATE KEYSPACE proto WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 1};

CREATE TABLE proto.streams ( 
  streamID text, 
  name text,
  properties text,
  status text,
  PRIMARY KEY ((streamID), name)
) WITH CLUSTERING ORDER BY (name ASC);

CREATE TABLE proto.streams_by_name ( 
  streamID text, 
  name text,
  properties text,
  status text,
  PRIMARY KEY ((name), streamID)
) WITH CLUSTERING ORDER BY (streamID ASC);

CREATE TABLE proto.fragmentations_by_stream ( 
  streamID text, 
  name text,
  shaclPath frozen<list<text>>,
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
  PRIMARY KEY ((streamID, fragmentName, bucketValue), eventTime, eventID)
) WITH CLUSTERING ORDER BY (eventTime ASC, eventID ASC);

CREATE TABLE proto.events_by_stream ( 
  streamID text, 
  eventTime timestamp,
  eventID text,
  eventData text,
  PRIMARY KEY (streamID, eventTime, eventID)
) WITH CLUSTERING ORDER BY (eventTime ASC, eventID ASC);

CREATE TABLE proto.state ( 
  key text, 
  value text,
  PRIMARY KEY (key)
);
```

# Server setup

1. Clone this repository wherever you want,
2. Run `npm install` to install its dependencies,
3. Check the Cassandra (i.e., Scylla) credentials in `src/config.ts` 
4. Run `tsc` to compile the Typescript to Javascript
5. Run `lib/app.js` to start the server

# API endpoints

## `GET /streams`

Request:

```bash
curl -X GET \
  http://localhost:3000/streams \
  -H 'cache-control: no-cache'
```

Response:

```json
[
    {
        "sourceURI": "https://streams.datapiloten.be/observations",
        "name": "observations",
        "properties": [
            {
                "text": "madeBySensor",
                "value": [
                    "http://www.w3.org/ns/sosa/madeBySensor"
                ]
            },
            {
                "text": "resultTime",
                "value": [
                    "http://www.w3.org/ns/sosa/resultTime"
                ]
            },
            {
                "text": "hasFeatureOfInterest - asWKT",
                "value": [
                    "http://www.w3.org/ns/sosa/hasFeatureOfInterest",
                    "http://www.opengis.net/ont/geosparql#asWKT"
                ]
            },
            {
                "text": "observedProperty",
                "value": [
                    "http://www.w3.org/ns/sosa/observedProperty"
                ]
            },
            {
                "text": "hasResult - numericValue",
                "value": [
                    "http://www.w3.org/ns/sosa/hasResult",
                    "http://qudt.org/1.1/schema/qudt#numericValue"
                ]
            },
            {
                "text": "hasResult - unit",
                "value": [
                    "http://www.w3.org/ns/sosa/hasResult",
                    "http://qudt.org/1.1/schema/qudt#unit"
                ]
            }
        ],
        "status": "LOADING"
    }
]
```

## `POST /streams`

Request:

```bash
curl -X POST \
  http://localhost:3000/streams \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'url=https%3A%2F%2Fstreams.datapiloten.be%2Fobservations&name=observations'
```

Response:

```json
{
    "status": "success",
    "url": "/streams/observations"
}
```

## `GET /streams/:streamName`

Request:

```
curl -X GET \
  http://localhost:3000/streams/observations \
  -H 'cache-control: no-cache'
```

Response:

```json
{
    "sourceURI": "https://streams.datapiloten.be/observations",
    "name": "observations",
    "properties": [
        {
            "text": "madeBySensor",
            "value": [
                "http://www.w3.org/ns/sosa/madeBySensor"
            ]
        },
        {
            "text": "resultTime",
            "value": [
                "http://www.w3.org/ns/sosa/resultTime"
            ]
        },
        {
            "text": "hasFeatureOfInterest - asWKT",
            "value": [
                "http://www.w3.org/ns/sosa/hasFeatureOfInterest",
                "http://www.opengis.net/ont/geosparql#asWKT"
            ]
        },
        {
            "text": "observedProperty",
            "value": [
                "http://www.w3.org/ns/sosa/observedProperty"
            ]
        },
        {
            "text": "hasResult - numericValue",
            "value": [
                "http://www.w3.org/ns/sosa/hasResult",
                "http://qudt.org/1.1/schema/qudt#numericValue"
            ]
        },
        {
            "text": "hasResult - unit",
            "value": [
                "http://www.w3.org/ns/sosa/hasResult",
                "http://qudt.org/1.1/schema/qudt#unit"
            ]
        }
    ],
    "status": "LOADING",
    "fragmentations": []
}
```

## `GET /streams/:streamName/fragmentations`

Request:

```bash
curl -X GET \
  http://localhost:3000/streams/observations/fragmentations/ \
  -H 'cache-control: no-cache'
```

Response:

```json
[
    {
        "kind": "XYZ_TILE",
        "streamID": "https://streams.datapiloten.be/observations",
        "shaclPath": [
            "http://www.opengis.net/ont/geosparql#asWKT"
        ],
        "name": "tiles",
        "params": {
            "minZoom": "13",
            "maxZoom": "15"
        },
        "status": "LOADING"
    }
]
```

## `POST /streams/:streamName/fragmentations`

Request:

```bash
curl -X POST \
  http://localhost:3000/streams/observations/fragmentations \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'name=tiles&property=http%3A%2F%2Fwww.opengis.net%2Font%2Fgeosparql%23asWKT&strategy=XYZ_TILE&minZoom=13&maxZoom=15'
```

Response:

```json
{
    "status": "success",
    "url": "/streams/observations/fragmentations/tiles"
}
```

## `GET /streams/:streamName/fragmentations/:fragmentName`

Request:

```bash
curl -X GET \
  http://localhost:3000/streams/observations/fragmentations/tiles \
  -H 'cache-control: no-cache'
```

Response:

```json
{
    "kind": "XYZ_TILE",
    "streamID": "https://streams.datapiloten.be/observations",
    "shaclPath": [
        "http://www.opengis.net/ont/geosparql#asWKT"
    ],
    "name": "tiles",
    "params": {
        "minZoom": "13",
        "maxZoom": "15"
    },
    "status": "LOADING"
}
```

## `POST /streams/:streamName/fragmentations/:fragmentName/enable`

Request:

```bash
curl -X POST \
  http://localhost:3000/streams/observations/fragmentations/tiles/enable \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d enabled=false
```

Response:

```json
{
    "status": "success"
}
```

