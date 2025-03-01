import { Statement } from '@google-cloud/spanner/build/src/transaction';
import { Spanner, Database, Transaction } from '@google-cloud/spanner';
import { WatchEpisodeSession, WATCH_EPISODE_SESSION, WatchLaterSeason, WATCH_LATER_SEASON } from './schema';
import { serializeMessage, deserializeMessage } from '@selfage/message/serializer';
import { MessageDescriptor } from '@selfage/message/descriptor';

export function insertWatchEpisodeSessionStatement(
  data: WatchEpisodeSession,
): Statement {
  return insertWatchEpisodeSessionInternalStatement(
    data.watchSessionId,
    data.watcherId,
    data.seasonId,
    data.episodeId,
    data.lastUpdatedTimeMs,
    data
  );
}

export function insertWatchEpisodeSessionInternalStatement(
  watchSessionId: string,
  watcherId: string,
  seasonId: string,
  episodeId: string,
  lastUpdatedTimeMs: number,
  data: WatchEpisodeSession,
): Statement {
  return {
    sql: "INSERT WatchEpisodeSession (watchSessionId, watcherId, seasonId, episodeId, lastUpdatedTimeMs, data) VALUES (@watchSessionId, @watcherId, @seasonId, @episodeId, @lastUpdatedTimeMs, @data)",
    params: {
      watchSessionId: watchSessionId,
      watcherId: watcherId,
      seasonId: seasonId,
      episodeId: episodeId,
      lastUpdatedTimeMs: Spanner.float(lastUpdatedTimeMs),
      data: Buffer.from(serializeMessage(data, WATCH_EPISODE_SESSION).buffer),
    },
    types: {
      watchSessionId: { type: "string" },
      watcherId: { type: "string" },
      seasonId: { type: "string" },
      episodeId: { type: "string" },
      lastUpdatedTimeMs: { type: "float64" },
      data: { type: "bytes" },
    }
  };
}

export function deleteWatchEpisodeSessionStatement(
  watchEpisodeSessionWatchSessionIdEq: string,
): Statement {
  return {
    sql: "DELETE WatchEpisodeSession WHERE (WatchEpisodeSession.watchSessionId = @watchEpisodeSessionWatchSessionIdEq)",
    params: {
      watchEpisodeSessionWatchSessionIdEq: watchEpisodeSessionWatchSessionIdEq,
    },
    types: {
      watchEpisodeSessionWatchSessionIdEq: { type: "string" },
    }
  };
}

export interface GetWatchEpisodeSessionRow {
  watchEpisodeSessionData: WatchEpisodeSession,
}

export let GET_WATCH_EPISODE_SESSION_ROW: MessageDescriptor<GetWatchEpisodeSessionRow> = {
  name: 'GetWatchEpisodeSessionRow',
  fields: [{
    name: 'watchEpisodeSessionData',
    index: 1,
    messageType: WATCH_EPISODE_SESSION,
  }],
};

export async function getWatchEpisodeSession(
  runner: Database | Transaction,
  watchEpisodeSessionWatchSessionIdEq: string,
): Promise<Array<GetWatchEpisodeSessionRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchEpisodeSession.data FROM WatchEpisodeSession WHERE (WatchEpisodeSession.watchSessionId = @watchEpisodeSessionWatchSessionIdEq)",
    params: {
      watchEpisodeSessionWatchSessionIdEq: watchEpisodeSessionWatchSessionIdEq,
    },
    types: {
      watchEpisodeSessionWatchSessionIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetWatchEpisodeSessionRow>();
  for (let row of rows) {
    resRows.push({
      watchEpisodeSessionData: deserializeMessage(row.at(0).value, WATCH_EPISODE_SESSION),
    });
  }
  return resRows;
}

export function updateWatchEpisodeSessionStatement(
  data: WatchEpisodeSession,
): Statement {
  return updateWatchEpisodeSessionInternalStatement(
    data.watchSessionId,
    data.watcherId,
    data.seasonId,
    data.episodeId,
    data.lastUpdatedTimeMs,
    data
  );
}

export function updateWatchEpisodeSessionInternalStatement(
  watchEpisodeSessionWatchSessionIdEq: string,
  setWatcherId: string,
  setSeasonId: string,
  setEpisodeId: string,
  setLastUpdatedTimeMs: number,
  setData: WatchEpisodeSession,
): Statement {
  return {
    sql: "UPDATE WatchEpisodeSession SET watcherId = @setWatcherId, seasonId = @setSeasonId, episodeId = @setEpisodeId, lastUpdatedTimeMs = @setLastUpdatedTimeMs, data = @setData WHERE (WatchEpisodeSession.watchSessionId = @watchEpisodeSessionWatchSessionIdEq)",
    params: {
      watchEpisodeSessionWatchSessionIdEq: watchEpisodeSessionWatchSessionIdEq,
      setWatcherId: setWatcherId,
      setSeasonId: setSeasonId,
      setEpisodeId: setEpisodeId,
      setLastUpdatedTimeMs: Spanner.float(setLastUpdatedTimeMs),
      setData: Buffer.from(serializeMessage(setData, WATCH_EPISODE_SESSION).buffer),
    },
    types: {
      watchEpisodeSessionWatchSessionIdEq: { type: "string" },
      setWatcherId: { type: "string" },
      setSeasonId: { type: "string" },
      setEpisodeId: { type: "string" },
      setLastUpdatedTimeMs: { type: "float64" },
      setData: { type: "bytes" },
    }
  };
}

export function insertWatchLaterSeasonStatement(
  data: WatchLaterSeason,
): Statement {
  return insertWatchLaterSeasonInternalStatement(
    data.watcherId,
    data.seasonId,
    data.addedTimeMs,
    data
  );
}

export function insertWatchLaterSeasonInternalStatement(
  watcherId: string,
  seasonId: string,
  addedTimeMs: number,
  data: WatchLaterSeason,
): Statement {
  return {
    sql: "INSERT WatchLaterSeason (watcherId, seasonId, addedTimeMs, data) VALUES (@watcherId, @seasonId, @addedTimeMs, @data)",
    params: {
      watcherId: watcherId,
      seasonId: seasonId,
      addedTimeMs: Spanner.float(addedTimeMs),
      data: Buffer.from(serializeMessage(data, WATCH_LATER_SEASON).buffer),
    },
    types: {
      watcherId: { type: "string" },
      seasonId: { type: "string" },
      addedTimeMs: { type: "float64" },
      data: { type: "bytes" },
    }
  };
}

export function deleteWatchLaterSeasonStatement(
  watchLaterSeasonWatcherIdEq: string,
  watchLaterSeasonSeasonIdEq: string,
): Statement {
  return {
    sql: "DELETE WatchLaterSeason WHERE (WatchLaterSeason.watcherId = @watchLaterSeasonWatcherIdEq AND WatchLaterSeason.seasonId = @watchLaterSeasonSeasonIdEq)",
    params: {
      watchLaterSeasonWatcherIdEq: watchLaterSeasonWatcherIdEq,
      watchLaterSeasonSeasonIdEq: watchLaterSeasonSeasonIdEq,
    },
    types: {
      watchLaterSeasonWatcherIdEq: { type: "string" },
      watchLaterSeasonSeasonIdEq: { type: "string" },
    }
  };
}

export interface GetWatchLaterSeasonRow {
  watchLaterSeasonData: WatchLaterSeason,
}

export let GET_WATCH_LATER_SEASON_ROW: MessageDescriptor<GetWatchLaterSeasonRow> = {
  name: 'GetWatchLaterSeasonRow',
  fields: [{
    name: 'watchLaterSeasonData',
    index: 1,
    messageType: WATCH_LATER_SEASON,
  }],
};

export async function getWatchLaterSeason(
  runner: Database | Transaction,
  watchLaterSeasonWatcherIdEq: string,
  watchLaterSeasonSeasonIdEq: string,
): Promise<Array<GetWatchLaterSeasonRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchLaterSeason.data FROM WatchLaterSeason WHERE (WatchLaterSeason.watcherId = @watchLaterSeasonWatcherIdEq AND WatchLaterSeason.seasonId = @watchLaterSeasonSeasonIdEq)",
    params: {
      watchLaterSeasonWatcherIdEq: watchLaterSeasonWatcherIdEq,
      watchLaterSeasonSeasonIdEq: watchLaterSeasonSeasonIdEq,
    },
    types: {
      watchLaterSeasonWatcherIdEq: { type: "string" },
      watchLaterSeasonSeasonIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetWatchLaterSeasonRow>();
  for (let row of rows) {
    resRows.push({
      watchLaterSeasonData: deserializeMessage(row.at(0).value, WATCH_LATER_SEASON),
    });
  }
  return resRows;
}

export function updateWatchLaterSeasonStatement(
  data: WatchLaterSeason,
): Statement {
  return updateWatchLaterSeasonInternalStatement(
    data.watcherId,
    data.seasonId,
    data.addedTimeMs,
    data
  );
}

export function updateWatchLaterSeasonInternalStatement(
  watchLaterSeasonWatcherIdEq: string,
  watchLaterSeasonSeasonIdEq: string,
  setAddedTimeMs: number,
  setData: WatchLaterSeason,
): Statement {
  return {
    sql: "UPDATE WatchLaterSeason SET addedTimeMs = @setAddedTimeMs, data = @setData WHERE (WatchLaterSeason.watcherId = @watchLaterSeasonWatcherIdEq AND WatchLaterSeason.seasonId = @watchLaterSeasonSeasonIdEq)",
    params: {
      watchLaterSeasonWatcherIdEq: watchLaterSeasonWatcherIdEq,
      watchLaterSeasonSeasonIdEq: watchLaterSeasonSeasonIdEq,
      setAddedTimeMs: Spanner.float(setAddedTimeMs),
      setData: Buffer.from(serializeMessage(setData, WATCH_LATER_SEASON).buffer),
    },
    types: {
      watchLaterSeasonWatcherIdEq: { type: "string" },
      watchLaterSeasonSeasonIdEq: { type: "string" },
      setAddedTimeMs: { type: "float64" },
      setData: { type: "bytes" },
    }
  };
}

export interface ListWatchEpisodeSessionsRow {
  watchEpisodeSessionData: WatchEpisodeSession,
}

export let LIST_WATCH_EPISODE_SESSIONS_ROW: MessageDescriptor<ListWatchEpisodeSessionsRow> = {
  name: 'ListWatchEpisodeSessionsRow',
  fields: [{
    name: 'watchEpisodeSessionData',
    index: 1,
    messageType: WATCH_EPISODE_SESSION,
  }],
};

export async function listWatchEpisodeSessions(
  runner: Database | Transaction,
  watchEpisodeSessionWatcherIdEq: string,
  watchEpisodeSessionLastUpdatedTimeMsLt: number,
  limit: number,
): Promise<Array<ListWatchEpisodeSessionsRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchEpisodeSession.data FROM WatchEpisodeSession WHERE (WatchEpisodeSession.watcherId = @watchEpisodeSessionWatcherIdEq AND WatchEpisodeSession.lastUpdatedTimeMs < @watchEpisodeSessionLastUpdatedTimeMsLt) ORDER BY WatchEpisodeSession.lastUpdatedTimeMs DESC LIMIT @limit",
    params: {
      watchEpisodeSessionWatcherIdEq: watchEpisodeSessionWatcherIdEq,
      watchEpisodeSessionLastUpdatedTimeMsLt: Spanner.float(watchEpisodeSessionLastUpdatedTimeMsLt),
      limit: limit.toString(),
    },
    types: {
      watchEpisodeSessionWatcherIdEq: { type: "string" },
      watchEpisodeSessionLastUpdatedTimeMsLt: { type: "float64" },
      limit: { type: "int64" },
    }
  });
  let resRows = new Array<ListWatchEpisodeSessionsRow>();
  for (let row of rows) {
    resRows.push({
      watchEpisodeSessionData: deserializeMessage(row.at(0).value, WATCH_EPISODE_SESSION),
    });
  }
  return resRows;
}

export interface ListWatchEpisodeSessionsBySeasonRow {
  watchEpisodeSessionData: WatchEpisodeSession,
}

export let LIST_WATCH_EPISODE_SESSIONS_BY_SEASON_ROW: MessageDescriptor<ListWatchEpisodeSessionsBySeasonRow> = {
  name: 'ListWatchEpisodeSessionsBySeasonRow',
  fields: [{
    name: 'watchEpisodeSessionData',
    index: 1,
    messageType: WATCH_EPISODE_SESSION,
  }],
};

export async function listWatchEpisodeSessionsBySeason(
  runner: Database | Transaction,
  watchEpisodeSessionWatcherIdEq: string,
  watchEpisodeSessionSeasonIdEq: string,
  watchEpisodeSessionLastUpdatedTimeMsLt: number,
  limit: number,
): Promise<Array<ListWatchEpisodeSessionsBySeasonRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchEpisodeSession.data FROM WatchEpisodeSession WHERE (WatchEpisodeSession.watcherId = @watchEpisodeSessionWatcherIdEq AND WatchEpisodeSession.seasonId = @watchEpisodeSessionSeasonIdEq AND WatchEpisodeSession.lastUpdatedTimeMs < @watchEpisodeSessionLastUpdatedTimeMsLt) ORDER BY WatchEpisodeSession.lastUpdatedTimeMs DESC LIMIT @limit",
    params: {
      watchEpisodeSessionWatcherIdEq: watchEpisodeSessionWatcherIdEq,
      watchEpisodeSessionSeasonIdEq: watchEpisodeSessionSeasonIdEq,
      watchEpisodeSessionLastUpdatedTimeMsLt: Spanner.float(watchEpisodeSessionLastUpdatedTimeMsLt),
      limit: limit.toString(),
    },
    types: {
      watchEpisodeSessionWatcherIdEq: { type: "string" },
      watchEpisodeSessionSeasonIdEq: { type: "string" },
      watchEpisodeSessionLastUpdatedTimeMsLt: { type: "float64" },
      limit: { type: "int64" },
    }
  });
  let resRows = new Array<ListWatchEpisodeSessionsBySeasonRow>();
  for (let row of rows) {
    resRows.push({
      watchEpisodeSessionData: deserializeMessage(row.at(0).value, WATCH_EPISODE_SESSION),
    });
  }
  return resRows;
}

export interface ListWatchEpisodeSessionsByEpisodeRow {
  watchEpisodeSessionData: WatchEpisodeSession,
}

export let LIST_WATCH_EPISODE_SESSIONS_BY_EPISODE_ROW: MessageDescriptor<ListWatchEpisodeSessionsByEpisodeRow> = {
  name: 'ListWatchEpisodeSessionsByEpisodeRow',
  fields: [{
    name: 'watchEpisodeSessionData',
    index: 1,
    messageType: WATCH_EPISODE_SESSION,
  }],
};

export async function listWatchEpisodeSessionsByEpisode(
  runner: Database | Transaction,
  watchEpisodeSessionWatcherIdEq: string,
  watchEpisodeSessionSeasonIdEq: string,
  watchEpisodeSessionEpisodeIdEq: string,
  watchEpisodeSessionLastUpdatedTimeMsLt: number,
  limit: number,
): Promise<Array<ListWatchEpisodeSessionsByEpisodeRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchEpisodeSession.data FROM WatchEpisodeSession WHERE (WatchEpisodeSession.watcherId = @watchEpisodeSessionWatcherIdEq AND WatchEpisodeSession.seasonId = @watchEpisodeSessionSeasonIdEq AND WatchEpisodeSession.episodeId = @watchEpisodeSessionEpisodeIdEq AND WatchEpisodeSession.lastUpdatedTimeMs < @watchEpisodeSessionLastUpdatedTimeMsLt) ORDER BY WatchEpisodeSession.lastUpdatedTimeMs DESC LIMIT @limit",
    params: {
      watchEpisodeSessionWatcherIdEq: watchEpisodeSessionWatcherIdEq,
      watchEpisodeSessionSeasonIdEq: watchEpisodeSessionSeasonIdEq,
      watchEpisodeSessionEpisodeIdEq: watchEpisodeSessionEpisodeIdEq,
      watchEpisodeSessionLastUpdatedTimeMsLt: Spanner.float(watchEpisodeSessionLastUpdatedTimeMsLt),
      limit: limit.toString(),
    },
    types: {
      watchEpisodeSessionWatcherIdEq: { type: "string" },
      watchEpisodeSessionSeasonIdEq: { type: "string" },
      watchEpisodeSessionEpisodeIdEq: { type: "string" },
      watchEpisodeSessionLastUpdatedTimeMsLt: { type: "float64" },
      limit: { type: "int64" },
    }
  });
  let resRows = new Array<ListWatchEpisodeSessionsByEpisodeRow>();
  for (let row of rows) {
    resRows.push({
      watchEpisodeSessionData: deserializeMessage(row.at(0).value, WATCH_EPISODE_SESSION),
    });
  }
  return resRows;
}

export interface ListWatchLaterSeasonsRow {
  watchLaterSeasonData: WatchLaterSeason,
}

export let LIST_WATCH_LATER_SEASONS_ROW: MessageDescriptor<ListWatchLaterSeasonsRow> = {
  name: 'ListWatchLaterSeasonsRow',
  fields: [{
    name: 'watchLaterSeasonData',
    index: 1,
    messageType: WATCH_LATER_SEASON,
  }],
};

export async function listWatchLaterSeasons(
  runner: Database | Transaction,
  watchLaterSeasonWatcherIdEq: string,
  watchLaterSeasonAddedTimeMsLt: number,
  limit: number,
): Promise<Array<ListWatchLaterSeasonsRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchLaterSeason.data FROM WatchLaterSeason WHERE (WatchLaterSeason.watcherId = @watchLaterSeasonWatcherIdEq AND WatchLaterSeason.addedTimeMs < @watchLaterSeasonAddedTimeMsLt) ORDER BY WatchLaterSeason.addedTimeMs DESC LIMIT @limit",
    params: {
      watchLaterSeasonWatcherIdEq: watchLaterSeasonWatcherIdEq,
      watchLaterSeasonAddedTimeMsLt: Spanner.float(watchLaterSeasonAddedTimeMsLt),
      limit: limit.toString(),
    },
    types: {
      watchLaterSeasonWatcherIdEq: { type: "string" },
      watchLaterSeasonAddedTimeMsLt: { type: "float64" },
      limit: { type: "int64" },
    }
  });
  let resRows = new Array<ListWatchLaterSeasonsRow>();
  for (let row of rows) {
    resRows.push({
      watchLaterSeasonData: deserializeMessage(row.at(0).value, WATCH_LATER_SEASON),
    });
  }
  return resRows;
}
