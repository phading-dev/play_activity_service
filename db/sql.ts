import { Statement } from '@google-cloud/spanner/build/src/transaction';
import { Spanner, Database, Transaction } from '@google-cloud/spanner';
import { WatchSession, WATCH_SESSION, WatchedSeason, WATCHED_SEASON, WatchedEpisode, WATCHED_EPISODE, WatchLaterSeason, WATCH_LATER_SEASON } from './schema';
import { serializeMessage, deserializeMessage } from '@selfage/message/serializer';
import { MessageDescriptor } from '@selfage/message/descriptor';

export function insertWatchSessionStatement(
  data: WatchSession,
): Statement {
  return insertWatchSessionInternalStatement(
    data.watcherId,
    data.watchSessionId,
    data.createdTimeMs,
    data
  );
}

export function insertWatchSessionInternalStatement(
  watcherId: string,
  watchSessionId: string,
  createdTimeMs: number,
  data: WatchSession,
): Statement {
  return {
    sql: "INSERT WatchSession (watcherId, watchSessionId, createdTimeMs, data) VALUES (@watcherId, @watchSessionId, @createdTimeMs, @data)",
    params: {
      watcherId: watcherId,
      watchSessionId: watchSessionId,
      createdTimeMs: Spanner.float(createdTimeMs),
      data: Buffer.from(serializeMessage(data, WATCH_SESSION).buffer),
    },
    types: {
      watcherId: { type: "string" },
      watchSessionId: { type: "string" },
      createdTimeMs: { type: "float64" },
      data: { type: "bytes" },
    }
  };
}

export function deleteWatchSessionStatement(
  watchSessionWatcherIdEq: string,
  watchSessionWatchSessionIdEq: string,
): Statement {
  return {
    sql: "DELETE WatchSession WHERE (WatchSession.watcherId = @watchSessionWatcherIdEq AND WatchSession.watchSessionId = @watchSessionWatchSessionIdEq)",
    params: {
      watchSessionWatcherIdEq: watchSessionWatcherIdEq,
      watchSessionWatchSessionIdEq: watchSessionWatchSessionIdEq,
    },
    types: {
      watchSessionWatcherIdEq: { type: "string" },
      watchSessionWatchSessionIdEq: { type: "string" },
    }
  };
}

export interface GetWatchSessionRow {
  watchSessionData: WatchSession,
}

export let GET_WATCH_SESSION_ROW: MessageDescriptor<GetWatchSessionRow> = {
  name: 'GetWatchSessionRow',
  fields: [{
    name: 'watchSessionData',
    index: 1,
    messageType: WATCH_SESSION,
  }],
};

export async function getWatchSession(
  runner: Database | Transaction,
  watchSessionWatcherIdEq: string,
  watchSessionWatchSessionIdEq: string,
): Promise<Array<GetWatchSessionRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchSession.data FROM WatchSession WHERE (WatchSession.watcherId = @watchSessionWatcherIdEq AND WatchSession.watchSessionId = @watchSessionWatchSessionIdEq)",
    params: {
      watchSessionWatcherIdEq: watchSessionWatcherIdEq,
      watchSessionWatchSessionIdEq: watchSessionWatchSessionIdEq,
    },
    types: {
      watchSessionWatcherIdEq: { type: "string" },
      watchSessionWatchSessionIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetWatchSessionRow>();
  for (let row of rows) {
    resRows.push({
      watchSessionData: deserializeMessage(row.at(0).value, WATCH_SESSION),
    });
  }
  return resRows;
}

export function updateWatchSessionStatement(
  data: WatchSession,
): Statement {
  return updateWatchSessionInternalStatement(
    data.watcherId,
    data.watchSessionId,
    data.createdTimeMs,
    data
  );
}

export function updateWatchSessionInternalStatement(
  watchSessionWatcherIdEq: string,
  watchSessionWatchSessionIdEq: string,
  setCreatedTimeMs: number,
  setData: WatchSession,
): Statement {
  return {
    sql: "UPDATE WatchSession SET createdTimeMs = @setCreatedTimeMs, data = @setData WHERE (WatchSession.watcherId = @watchSessionWatcherIdEq AND WatchSession.watchSessionId = @watchSessionWatchSessionIdEq)",
    params: {
      watchSessionWatcherIdEq: watchSessionWatcherIdEq,
      watchSessionWatchSessionIdEq: watchSessionWatchSessionIdEq,
      setCreatedTimeMs: Spanner.float(setCreatedTimeMs),
      setData: Buffer.from(serializeMessage(setData, WATCH_SESSION).buffer),
    },
    types: {
      watchSessionWatcherIdEq: { type: "string" },
      watchSessionWatchSessionIdEq: { type: "string" },
      setCreatedTimeMs: { type: "float64" },
      setData: { type: "bytes" },
    }
  };
}

export function insertWatchedSeasonStatement(
  data: WatchedSeason,
): Statement {
  return insertWatchedSeasonInternalStatement(
    data.watcherId,
    data.seasonId,
    data.updatedTimeMs,
    data
  );
}

export function insertWatchedSeasonInternalStatement(
  watcherId: string,
  seasonId: string,
  updatedTimeMs: number,
  data: WatchedSeason,
): Statement {
  return {
    sql: "INSERT WatchedSeason (watcherId, seasonId, updatedTimeMs, data) VALUES (@watcherId, @seasonId, @updatedTimeMs, @data)",
    params: {
      watcherId: watcherId,
      seasonId: seasonId,
      updatedTimeMs: Spanner.float(updatedTimeMs),
      data: Buffer.from(serializeMessage(data, WATCHED_SEASON).buffer),
    },
    types: {
      watcherId: { type: "string" },
      seasonId: { type: "string" },
      updatedTimeMs: { type: "float64" },
      data: { type: "bytes" },
    }
  };
}

export function deleteWatchedSeasonStatement(
  watchedSeasonWatcherIdEq: string,
  watchedSeasonSeasonIdEq: string,
): Statement {
  return {
    sql: "DELETE WatchedSeason WHERE (WatchedSeason.watcherId = @watchedSeasonWatcherIdEq AND WatchedSeason.seasonId = @watchedSeasonSeasonIdEq)",
    params: {
      watchedSeasonWatcherIdEq: watchedSeasonWatcherIdEq,
      watchedSeasonSeasonIdEq: watchedSeasonSeasonIdEq,
    },
    types: {
      watchedSeasonWatcherIdEq: { type: "string" },
      watchedSeasonSeasonIdEq: { type: "string" },
    }
  };
}

export interface GetWatchedSeasonRow {
  watchedSeasonData: WatchedSeason,
}

export let GET_WATCHED_SEASON_ROW: MessageDescriptor<GetWatchedSeasonRow> = {
  name: 'GetWatchedSeasonRow',
  fields: [{
    name: 'watchedSeasonData',
    index: 1,
    messageType: WATCHED_SEASON,
  }],
};

export async function getWatchedSeason(
  runner: Database | Transaction,
  watchedSeasonWatcherIdEq: string,
  watchedSeasonSeasonIdEq: string,
): Promise<Array<GetWatchedSeasonRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchedSeason.data FROM WatchedSeason WHERE (WatchedSeason.watcherId = @watchedSeasonWatcherIdEq AND WatchedSeason.seasonId = @watchedSeasonSeasonIdEq)",
    params: {
      watchedSeasonWatcherIdEq: watchedSeasonWatcherIdEq,
      watchedSeasonSeasonIdEq: watchedSeasonSeasonIdEq,
    },
    types: {
      watchedSeasonWatcherIdEq: { type: "string" },
      watchedSeasonSeasonIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetWatchedSeasonRow>();
  for (let row of rows) {
    resRows.push({
      watchedSeasonData: deserializeMessage(row.at(0).value, WATCHED_SEASON),
    });
  }
  return resRows;
}

export function updateWatchedSeasonStatement(
  data: WatchedSeason,
): Statement {
  return updateWatchedSeasonInternalStatement(
    data.watcherId,
    data.seasonId,
    data.updatedTimeMs,
    data
  );
}

export function updateWatchedSeasonInternalStatement(
  watchedSeasonWatcherIdEq: string,
  watchedSeasonSeasonIdEq: string,
  setUpdatedTimeMs: number,
  setData: WatchedSeason,
): Statement {
  return {
    sql: "UPDATE WatchedSeason SET updatedTimeMs = @setUpdatedTimeMs, data = @setData WHERE (WatchedSeason.watcherId = @watchedSeasonWatcherIdEq AND WatchedSeason.seasonId = @watchedSeasonSeasonIdEq)",
    params: {
      watchedSeasonWatcherIdEq: watchedSeasonWatcherIdEq,
      watchedSeasonSeasonIdEq: watchedSeasonSeasonIdEq,
      setUpdatedTimeMs: Spanner.float(setUpdatedTimeMs),
      setData: Buffer.from(serializeMessage(setData, WATCHED_SEASON).buffer),
    },
    types: {
      watchedSeasonWatcherIdEq: { type: "string" },
      watchedSeasonSeasonIdEq: { type: "string" },
      setUpdatedTimeMs: { type: "float64" },
      setData: { type: "bytes" },
    }
  };
}

export function insertWatchedEpisodeStatement(
  data: WatchedEpisode,
): Statement {
  return insertWatchedEpisodeInternalStatement(
    data.watcherId,
    data.seasonId,
    data.episodeId,
    data.updatedTimeMs,
    data
  );
}

export function insertWatchedEpisodeInternalStatement(
  watcherId: string,
  seasonId: string,
  episodeId: string,
  updatedTimeMs: number,
  data: WatchedEpisode,
): Statement {
  return {
    sql: "INSERT WatchedEpisode (watcherId, seasonId, episodeId, updatedTimeMs, data) VALUES (@watcherId, @seasonId, @episodeId, @updatedTimeMs, @data)",
    params: {
      watcherId: watcherId,
      seasonId: seasonId,
      episodeId: episodeId,
      updatedTimeMs: Spanner.float(updatedTimeMs),
      data: Buffer.from(serializeMessage(data, WATCHED_EPISODE).buffer),
    },
    types: {
      watcherId: { type: "string" },
      seasonId: { type: "string" },
      episodeId: { type: "string" },
      updatedTimeMs: { type: "float64" },
      data: { type: "bytes" },
    }
  };
}

export function deleteWatchedEpisodeStatement(
  watchedEpisodeWatcherIdEq: string,
  watchedEpisodeSeasonIdEq: string,
  watchedEpisodeEpisodeIdEq: string,
): Statement {
  return {
    sql: "DELETE WatchedEpisode WHERE (WatchedEpisode.watcherId = @watchedEpisodeWatcherIdEq AND WatchedEpisode.seasonId = @watchedEpisodeSeasonIdEq AND WatchedEpisode.episodeId = @watchedEpisodeEpisodeIdEq)",
    params: {
      watchedEpisodeWatcherIdEq: watchedEpisodeWatcherIdEq,
      watchedEpisodeSeasonIdEq: watchedEpisodeSeasonIdEq,
      watchedEpisodeEpisodeIdEq: watchedEpisodeEpisodeIdEq,
    },
    types: {
      watchedEpisodeWatcherIdEq: { type: "string" },
      watchedEpisodeSeasonIdEq: { type: "string" },
      watchedEpisodeEpisodeIdEq: { type: "string" },
    }
  };
}

export interface GetWatchedEpisodeRow {
  watchedEpisodeData: WatchedEpisode,
}

export let GET_WATCHED_EPISODE_ROW: MessageDescriptor<GetWatchedEpisodeRow> = {
  name: 'GetWatchedEpisodeRow',
  fields: [{
    name: 'watchedEpisodeData',
    index: 1,
    messageType: WATCHED_EPISODE,
  }],
};

export async function getWatchedEpisode(
  runner: Database | Transaction,
  watchedEpisodeWatcherIdEq: string,
  watchedEpisodeSeasonIdEq: string,
  watchedEpisodeEpisodeIdEq: string,
): Promise<Array<GetWatchedEpisodeRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchedEpisode.data FROM WatchedEpisode WHERE (WatchedEpisode.watcherId = @watchedEpisodeWatcherIdEq AND WatchedEpisode.seasonId = @watchedEpisodeSeasonIdEq AND WatchedEpisode.episodeId = @watchedEpisodeEpisodeIdEq)",
    params: {
      watchedEpisodeWatcherIdEq: watchedEpisodeWatcherIdEq,
      watchedEpisodeSeasonIdEq: watchedEpisodeSeasonIdEq,
      watchedEpisodeEpisodeIdEq: watchedEpisodeEpisodeIdEq,
    },
    types: {
      watchedEpisodeWatcherIdEq: { type: "string" },
      watchedEpisodeSeasonIdEq: { type: "string" },
      watchedEpisodeEpisodeIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetWatchedEpisodeRow>();
  for (let row of rows) {
    resRows.push({
      watchedEpisodeData: deserializeMessage(row.at(0).value, WATCHED_EPISODE),
    });
  }
  return resRows;
}

export function updateWatchedEpisodeStatement(
  data: WatchedEpisode,
): Statement {
  return updateWatchedEpisodeInternalStatement(
    data.watcherId,
    data.seasonId,
    data.episodeId,
    data.updatedTimeMs,
    data
  );
}

export function updateWatchedEpisodeInternalStatement(
  watchedEpisodeWatcherIdEq: string,
  watchedEpisodeSeasonIdEq: string,
  watchedEpisodeEpisodeIdEq: string,
  setUpdatedTimeMs: number,
  setData: WatchedEpisode,
): Statement {
  return {
    sql: "UPDATE WatchedEpisode SET updatedTimeMs = @setUpdatedTimeMs, data = @setData WHERE (WatchedEpisode.watcherId = @watchedEpisodeWatcherIdEq AND WatchedEpisode.seasonId = @watchedEpisodeSeasonIdEq AND WatchedEpisode.episodeId = @watchedEpisodeEpisodeIdEq)",
    params: {
      watchedEpisodeWatcherIdEq: watchedEpisodeWatcherIdEq,
      watchedEpisodeSeasonIdEq: watchedEpisodeSeasonIdEq,
      watchedEpisodeEpisodeIdEq: watchedEpisodeEpisodeIdEq,
      setUpdatedTimeMs: Spanner.float(setUpdatedTimeMs),
      setData: Buffer.from(serializeMessage(setData, WATCHED_EPISODE).buffer),
    },
    types: {
      watchedEpisodeWatcherIdEq: { type: "string" },
      watchedEpisodeSeasonIdEq: { type: "string" },
      watchedEpisodeEpisodeIdEq: { type: "string" },
      setUpdatedTimeMs: { type: "float64" },
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

export interface ListWatchSessionsRow {
  watchSessionData: WatchSession,
}

export let LIST_WATCH_SESSIONS_ROW: MessageDescriptor<ListWatchSessionsRow> = {
  name: 'ListWatchSessionsRow',
  fields: [{
    name: 'watchSessionData',
    index: 1,
    messageType: WATCH_SESSION,
  }],
};

export async function listWatchSessions(
  runner: Database | Transaction,
  watchSessionWatcherIdEq: string,
  watchSessionCreatedTimeMsLt: number,
  limit: number,
): Promise<Array<ListWatchSessionsRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchSession.data FROM WatchSession WHERE (WatchSession.watcherId = @watchSessionWatcherIdEq AND WatchSession.createdTimeMs < @watchSessionCreatedTimeMsLt) ORDER BY WatchSession.createdTimeMs DESC LIMIT @limit",
    params: {
      watchSessionWatcherIdEq: watchSessionWatcherIdEq,
      watchSessionCreatedTimeMsLt: Spanner.float(watchSessionCreatedTimeMsLt),
      limit: limit.toString(),
    },
    types: {
      watchSessionWatcherIdEq: { type: "string" },
      watchSessionCreatedTimeMsLt: { type: "float64" },
      limit: { type: "int64" },
    }
  });
  let resRows = new Array<ListWatchSessionsRow>();
  for (let row of rows) {
    resRows.push({
      watchSessionData: deserializeMessage(row.at(0).value, WATCH_SESSION),
    });
  }
  return resRows;
}

export interface ListWatchedSeasonsRow {
  watchedSeasonData: WatchedSeason,
}

export let LIST_WATCHED_SEASONS_ROW: MessageDescriptor<ListWatchedSeasonsRow> = {
  name: 'ListWatchedSeasonsRow',
  fields: [{
    name: 'watchedSeasonData',
    index: 1,
    messageType: WATCHED_SEASON,
  }],
};

export async function listWatchedSeasons(
  runner: Database | Transaction,
  watchedSeasonWatcherIdEq: string,
  watchedSeasonUpdatedTimeMsLt: number,
  limit: number,
): Promise<Array<ListWatchedSeasonsRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchedSeason.data FROM WatchedSeason WHERE (WatchedSeason.watcherId = @watchedSeasonWatcherIdEq AND WatchedSeason.updatedTimeMs < @watchedSeasonUpdatedTimeMsLt) ORDER BY WatchedSeason.updatedTimeMs DESC LIMIT @limit",
    params: {
      watchedSeasonWatcherIdEq: watchedSeasonWatcherIdEq,
      watchedSeasonUpdatedTimeMsLt: Spanner.float(watchedSeasonUpdatedTimeMsLt),
      limit: limit.toString(),
    },
    types: {
      watchedSeasonWatcherIdEq: { type: "string" },
      watchedSeasonUpdatedTimeMsLt: { type: "float64" },
      limit: { type: "int64" },
    }
  });
  let resRows = new Array<ListWatchedSeasonsRow>();
  for (let row of rows) {
    resRows.push({
      watchedSeasonData: deserializeMessage(row.at(0).value, WATCHED_SEASON),
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
