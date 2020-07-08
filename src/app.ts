import EventStreamIngester from "./ingesters/EventStreamIngester";
import DummyStageStorage from "./state/DummyStateStorage";
const ingesterState = new DummyStageStorage("aaaa");
const x = new EventStreamIngester(ingesterState, 2000, "https://streams.datapiloten.be/sensors");
