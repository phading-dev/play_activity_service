import { PrimitiveType, MessageDescriptor } from '@selfage/message/descriptor';

export interface WatchSession {
  watcherId?: string,
  watchSessionId?: string,
  seasonId?: string,
  episodeId?: string,
  createdTimeMs?: number,
}

export let WATCH_SESSION: MessageDescriptor<WatchSession> = {
  name: 'WatchSession',
  fields: [{
    name: 'watcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'seasonId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'episodeId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'createdTimeMs',
    index: 5,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export interface WatchedSeason {
  watcherId?: string,
  seasonId?: string,
  latestEpisodeId?: string,
  latestEpisodeIndex?: number,
  latestWatchSessionId?: string,
  updatedTimeMs?: number,
}

export let WATCHED_SEASON: MessageDescriptor<WatchedSeason> = {
  name: 'WatchedSeason',
  fields: [{
    name: 'watcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'seasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'latestEpisodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'latestEpisodeIndex',
    index: 4,
    primitiveType: PrimitiveType.NUMBER,
  }, {
    name: 'latestWatchSessionId',
    index: 5,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'updatedTimeMs',
    index: 6,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export interface WatchedEpisode {
  watcherId?: string,
  seasonId?: string,
  episodeId?: string,
  episodeIndex?: number,
  latestWatchSessionId?: string,
  updatedTimeMs?: number,
}

export let WATCHED_EPISODE: MessageDescriptor<WatchedEpisode> = {
  name: 'WatchedEpisode',
  fields: [{
    name: 'watcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'seasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'episodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'episodeIndex',
    index: 4,
    primitiveType: PrimitiveType.NUMBER,
  }, {
    name: 'latestWatchSessionId',
    index: 5,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'updatedTimeMs',
    index: 6,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export interface WatchLaterSeason {
  watcherId?: string,
  seasonId?: string,
  addedTimeMs?: number,
}

export let WATCH_LATER_SEASON: MessageDescriptor<WatchLaterSeason> = {
  name: 'WatchLaterSeason',
  fields: [{
    name: 'watcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'seasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'addedTimeMs',
    index: 3,
    primitiveType: PrimitiveType.NUMBER,
  }],
};
