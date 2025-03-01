import { PrimitiveType, MessageDescriptor } from '@selfage/message/descriptor';

export interface WatchEpisodeSession {
  watchSessionId?: string,
  watcherId?: string,
  seasonId?: string,
  episodeId?: string,
  watchTimeMs?: number,
  lastUpdatedTimeMs?: number,
}

export let WATCH_EPISODE_SESSION: MessageDescriptor<WatchEpisodeSession> = {
  name: 'WatchEpisodeSession',
  fields: [{
    name: 'watchSessionId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watcherId',
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
    name: 'watchTimeMs',
    index: 5,
    primitiveType: PrimitiveType.NUMBER,
  }, {
    name: 'lastUpdatedTimeMs',
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
