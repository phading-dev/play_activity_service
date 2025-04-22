import { Spanner, Database, Transaction } from '@google-cloud/spanner';
import { Statement } from '@google-cloud/spanner/build/src/transaction';
import { PrimitiveType, MessageDescriptor } from '@selfage/message/descriptor';

export function insertWatchSessionStatement(
  args: {
    watcherId: string,
    watchSessionId: string,
    seasonId?: string,
    episodeId?: string,
    createdTimeMs?: number,
  }
): Statement {
  return {
    sql: "INSERT WatchSession (watcherId, watchSessionId, seasonId, episodeId, createdTimeMs) VALUES (@watcherId, @watchSessionId, @seasonId, @episodeId, @createdTimeMs)",
    params: {
      watcherId: args.watcherId,
      watchSessionId: args.watchSessionId,
      seasonId: args.seasonId == null ? null : args.seasonId,
      episodeId: args.episodeId == null ? null : args.episodeId,
      createdTimeMs: args.createdTimeMs == null ? null : Spanner.float(args.createdTimeMs),
    },
    types: {
      watcherId: { type: "string" },
      watchSessionId: { type: "string" },
      seasonId: { type: "string" },
      episodeId: { type: "string" },
      createdTimeMs: { type: "float64" },
    }
  };
}

export function deleteWatchSessionStatement(
  args: {
    watchSessionWatcherIdEq: string,
    watchSessionWatchSessionIdEq: string,
  }
): Statement {
  return {
    sql: "DELETE WatchSession WHERE (WatchSession.watcherId = @watchSessionWatcherIdEq AND WatchSession.watchSessionId = @watchSessionWatchSessionIdEq)",
    params: {
      watchSessionWatcherIdEq: args.watchSessionWatcherIdEq,
      watchSessionWatchSessionIdEq: args.watchSessionWatchSessionIdEq,
    },
    types: {
      watchSessionWatcherIdEq: { type: "string" },
      watchSessionWatchSessionIdEq: { type: "string" },
    }
  };
}

export interface GetWatchSessionRow {
  watchSessionWatcherId?: string,
  watchSessionWatchSessionId?: string,
  watchSessionSeasonId?: string,
  watchSessionEpisodeId?: string,
  watchSessionCreatedTimeMs?: number,
}

export let GET_WATCH_SESSION_ROW: MessageDescriptor<GetWatchSessionRow> = {
  name: 'GetWatchSessionRow',
  fields: [{
    name: 'watchSessionWatcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionWatchSessionId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionSeasonId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionEpisodeId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionCreatedTimeMs',
    index: 5,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function getWatchSession(
  runner: Database | Transaction,
  args: {
    watchSessionWatcherIdEq: string,
    watchSessionWatchSessionIdEq: string,
  }
): Promise<Array<GetWatchSessionRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchSession.watcherId, WatchSession.watchSessionId, WatchSession.seasonId, WatchSession.episodeId, WatchSession.createdTimeMs FROM WatchSession WHERE (WatchSession.watcherId = @watchSessionWatcherIdEq AND WatchSession.watchSessionId = @watchSessionWatchSessionIdEq)",
    params: {
      watchSessionWatcherIdEq: args.watchSessionWatcherIdEq,
      watchSessionWatchSessionIdEq: args.watchSessionWatchSessionIdEq,
    },
    types: {
      watchSessionWatcherIdEq: { type: "string" },
      watchSessionWatchSessionIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetWatchSessionRow>();
  for (let row of rows) {
    resRows.push({
      watchSessionWatcherId: row.at(0).value == null ? undefined : row.at(0).value,
      watchSessionWatchSessionId: row.at(1).value == null ? undefined : row.at(1).value,
      watchSessionSeasonId: row.at(2).value == null ? undefined : row.at(2).value,
      watchSessionEpisodeId: row.at(3).value == null ? undefined : row.at(3).value,
      watchSessionCreatedTimeMs: row.at(4).value == null ? undefined : row.at(4).value.value,
    });
  }
  return resRows;
}

export function insertWatchedSeasonStatement(
  args: {
    watcherId: string,
    seasonId: string,
    latestEpisodeId?: string,
    latestWatchSessionId?: string,
    updatedTimeMs?: number,
  }
): Statement {
  return {
    sql: "INSERT WatchedSeason (watcherId, seasonId, latestEpisodeId, latestWatchSessionId, updatedTimeMs) VALUES (@watcherId, @seasonId, @latestEpisodeId, @latestWatchSessionId, @updatedTimeMs)",
    params: {
      watcherId: args.watcherId,
      seasonId: args.seasonId,
      latestEpisodeId: args.latestEpisodeId == null ? null : args.latestEpisodeId,
      latestWatchSessionId: args.latestWatchSessionId == null ? null : args.latestWatchSessionId,
      updatedTimeMs: args.updatedTimeMs == null ? null : Spanner.float(args.updatedTimeMs),
    },
    types: {
      watcherId: { type: "string" },
      seasonId: { type: "string" },
      latestEpisodeId: { type: "string" },
      latestWatchSessionId: { type: "string" },
      updatedTimeMs: { type: "float64" },
    }
  };
}

export function deleteWatchedSeasonStatement(
  args: {
    watchedSeasonWatcherIdEq: string,
    watchedSeasonSeasonIdEq: string,
  }
): Statement {
  return {
    sql: "DELETE WatchedSeason WHERE (WatchedSeason.watcherId = @watchedSeasonWatcherIdEq AND WatchedSeason.seasonId = @watchedSeasonSeasonIdEq)",
    params: {
      watchedSeasonWatcherIdEq: args.watchedSeasonWatcherIdEq,
      watchedSeasonSeasonIdEq: args.watchedSeasonSeasonIdEq,
    },
    types: {
      watchedSeasonWatcherIdEq: { type: "string" },
      watchedSeasonSeasonIdEq: { type: "string" },
    }
  };
}

export interface GetWatchedSeasonRow {
  watchedSeasonWatcherId?: string,
  watchedSeasonSeasonId?: string,
  watchedSeasonLatestEpisodeId?: string,
  watchedSeasonLatestWatchSessionId?: string,
  watchedSeasonUpdatedTimeMs?: number,
}

export let GET_WATCHED_SEASON_ROW: MessageDescriptor<GetWatchedSeasonRow> = {
  name: 'GetWatchedSeasonRow',
  fields: [{
    name: 'watchedSeasonWatcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedSeasonSeasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedSeasonLatestEpisodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedSeasonLatestWatchSessionId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedSeasonUpdatedTimeMs',
    index: 5,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function getWatchedSeason(
  runner: Database | Transaction,
  args: {
    watchedSeasonWatcherIdEq: string,
    watchedSeasonSeasonIdEq: string,
  }
): Promise<Array<GetWatchedSeasonRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchedSeason.watcherId, WatchedSeason.seasonId, WatchedSeason.latestEpisodeId, WatchedSeason.latestWatchSessionId, WatchedSeason.updatedTimeMs FROM WatchedSeason WHERE (WatchedSeason.watcherId = @watchedSeasonWatcherIdEq AND WatchedSeason.seasonId = @watchedSeasonSeasonIdEq)",
    params: {
      watchedSeasonWatcherIdEq: args.watchedSeasonWatcherIdEq,
      watchedSeasonSeasonIdEq: args.watchedSeasonSeasonIdEq,
    },
    types: {
      watchedSeasonWatcherIdEq: { type: "string" },
      watchedSeasonSeasonIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetWatchedSeasonRow>();
  for (let row of rows) {
    resRows.push({
      watchedSeasonWatcherId: row.at(0).value == null ? undefined : row.at(0).value,
      watchedSeasonSeasonId: row.at(1).value == null ? undefined : row.at(1).value,
      watchedSeasonLatestEpisodeId: row.at(2).value == null ? undefined : row.at(2).value,
      watchedSeasonLatestWatchSessionId: row.at(3).value == null ? undefined : row.at(3).value,
      watchedSeasonUpdatedTimeMs: row.at(4).value == null ? undefined : row.at(4).value.value,
    });
  }
  return resRows;
}

export function updateWatchedSeasonStatement(
  args: {
    watchedSeasonWatcherIdEq: string,
    watchedSeasonSeasonIdEq: string,
    setLatestEpisodeId?: string,
    setLatestWatchSessionId?: string,
    setUpdatedTimeMs?: number,
  }
): Statement {
  return {
    sql: "UPDATE WatchedSeason SET latestEpisodeId = @setLatestEpisodeId, latestWatchSessionId = @setLatestWatchSessionId, updatedTimeMs = @setUpdatedTimeMs WHERE (WatchedSeason.watcherId = @watchedSeasonWatcherIdEq AND WatchedSeason.seasonId = @watchedSeasonSeasonIdEq)",
    params: {
      watchedSeasonWatcherIdEq: args.watchedSeasonWatcherIdEq,
      watchedSeasonSeasonIdEq: args.watchedSeasonSeasonIdEq,
      setLatestEpisodeId: args.setLatestEpisodeId == null ? null : args.setLatestEpisodeId,
      setLatestWatchSessionId: args.setLatestWatchSessionId == null ? null : args.setLatestWatchSessionId,
      setUpdatedTimeMs: args.setUpdatedTimeMs == null ? null : Spanner.float(args.setUpdatedTimeMs),
    },
    types: {
      watchedSeasonWatcherIdEq: { type: "string" },
      watchedSeasonSeasonIdEq: { type: "string" },
      setLatestEpisodeId: { type: "string" },
      setLatestWatchSessionId: { type: "string" },
      setUpdatedTimeMs: { type: "float64" },
    }
  };
}

export function insertWatchedEpisodeStatement(
  args: {
    watcherId: string,
    seasonId: string,
    episodeId: string,
    latestWatchSessionId?: string,
    updatedTimeMs?: number,
  }
): Statement {
  return {
    sql: "INSERT WatchedEpisode (watcherId, seasonId, episodeId, latestWatchSessionId, updatedTimeMs) VALUES (@watcherId, @seasonId, @episodeId, @latestWatchSessionId, @updatedTimeMs)",
    params: {
      watcherId: args.watcherId,
      seasonId: args.seasonId,
      episodeId: args.episodeId,
      latestWatchSessionId: args.latestWatchSessionId == null ? null : args.latestWatchSessionId,
      updatedTimeMs: args.updatedTimeMs == null ? null : Spanner.float(args.updatedTimeMs),
    },
    types: {
      watcherId: { type: "string" },
      seasonId: { type: "string" },
      episodeId: { type: "string" },
      latestWatchSessionId: { type: "string" },
      updatedTimeMs: { type: "float64" },
    }
  };
}

export function deleteWatchedEpisodeStatement(
  args: {
    watchedEpisodeWatcherIdEq: string,
    watchedEpisodeSeasonIdEq: string,
    watchedEpisodeEpisodeIdEq: string,
  }
): Statement {
  return {
    sql: "DELETE WatchedEpisode WHERE (WatchedEpisode.watcherId = @watchedEpisodeWatcherIdEq AND WatchedEpisode.seasonId = @watchedEpisodeSeasonIdEq AND WatchedEpisode.episodeId = @watchedEpisodeEpisodeIdEq)",
    params: {
      watchedEpisodeWatcherIdEq: args.watchedEpisodeWatcherIdEq,
      watchedEpisodeSeasonIdEq: args.watchedEpisodeSeasonIdEq,
      watchedEpisodeEpisodeIdEq: args.watchedEpisodeEpisodeIdEq,
    },
    types: {
      watchedEpisodeWatcherIdEq: { type: "string" },
      watchedEpisodeSeasonIdEq: { type: "string" },
      watchedEpisodeEpisodeIdEq: { type: "string" },
    }
  };
}

export interface GetWatchedEpisodeRow {
  watchedEpisodeWatcherId?: string,
  watchedEpisodeSeasonId?: string,
  watchedEpisodeEpisodeId?: string,
  watchedEpisodeLatestWatchSessionId?: string,
  watchedEpisodeUpdatedTimeMs?: number,
}

export let GET_WATCHED_EPISODE_ROW: MessageDescriptor<GetWatchedEpisodeRow> = {
  name: 'GetWatchedEpisodeRow',
  fields: [{
    name: 'watchedEpisodeWatcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedEpisodeSeasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedEpisodeEpisodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedEpisodeLatestWatchSessionId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedEpisodeUpdatedTimeMs',
    index: 5,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function getWatchedEpisode(
  runner: Database | Transaction,
  args: {
    watchedEpisodeWatcherIdEq: string,
    watchedEpisodeSeasonIdEq: string,
    watchedEpisodeEpisodeIdEq: string,
  }
): Promise<Array<GetWatchedEpisodeRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchedEpisode.watcherId, WatchedEpisode.seasonId, WatchedEpisode.episodeId, WatchedEpisode.latestWatchSessionId, WatchedEpisode.updatedTimeMs FROM WatchedEpisode WHERE (WatchedEpisode.watcherId = @watchedEpisodeWatcherIdEq AND WatchedEpisode.seasonId = @watchedEpisodeSeasonIdEq AND WatchedEpisode.episodeId = @watchedEpisodeEpisodeIdEq)",
    params: {
      watchedEpisodeWatcherIdEq: args.watchedEpisodeWatcherIdEq,
      watchedEpisodeSeasonIdEq: args.watchedEpisodeSeasonIdEq,
      watchedEpisodeEpisodeIdEq: args.watchedEpisodeEpisodeIdEq,
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
      watchedEpisodeWatcherId: row.at(0).value == null ? undefined : row.at(0).value,
      watchedEpisodeSeasonId: row.at(1).value == null ? undefined : row.at(1).value,
      watchedEpisodeEpisodeId: row.at(2).value == null ? undefined : row.at(2).value,
      watchedEpisodeLatestWatchSessionId: row.at(3).value == null ? undefined : row.at(3).value,
      watchedEpisodeUpdatedTimeMs: row.at(4).value == null ? undefined : row.at(4).value.value,
    });
  }
  return resRows;
}

export function updateWatchedEpisodeStatement(
  args: {
    watchedEpisodeWatcherIdEq: string,
    watchedEpisodeSeasonIdEq: string,
    watchedEpisodeEpisodeIdEq: string,
    setLatestWatchSessionId?: string,
    setUpdatedTimeMs?: number,
  }
): Statement {
  return {
    sql: "UPDATE WatchedEpisode SET latestWatchSessionId = @setLatestWatchSessionId, updatedTimeMs = @setUpdatedTimeMs WHERE (WatchedEpisode.watcherId = @watchedEpisodeWatcherIdEq AND WatchedEpisode.seasonId = @watchedEpisodeSeasonIdEq AND WatchedEpisode.episodeId = @watchedEpisodeEpisodeIdEq)",
    params: {
      watchedEpisodeWatcherIdEq: args.watchedEpisodeWatcherIdEq,
      watchedEpisodeSeasonIdEq: args.watchedEpisodeSeasonIdEq,
      watchedEpisodeEpisodeIdEq: args.watchedEpisodeEpisodeIdEq,
      setLatestWatchSessionId: args.setLatestWatchSessionId == null ? null : args.setLatestWatchSessionId,
      setUpdatedTimeMs: args.setUpdatedTimeMs == null ? null : Spanner.float(args.setUpdatedTimeMs),
    },
    types: {
      watchedEpisodeWatcherIdEq: { type: "string" },
      watchedEpisodeSeasonIdEq: { type: "string" },
      watchedEpisodeEpisodeIdEq: { type: "string" },
      setLatestWatchSessionId: { type: "string" },
      setUpdatedTimeMs: { type: "float64" },
    }
  };
}

export function insertWatchLaterSeasonStatement(
  args: {
    watcherId: string,
    seasonId: string,
    addedTimeMs?: number,
  }
): Statement {
  return {
    sql: "INSERT WatchLaterSeason (watcherId, seasonId, addedTimeMs) VALUES (@watcherId, @seasonId, @addedTimeMs)",
    params: {
      watcherId: args.watcherId,
      seasonId: args.seasonId,
      addedTimeMs: args.addedTimeMs == null ? null : Spanner.float(args.addedTimeMs),
    },
    types: {
      watcherId: { type: "string" },
      seasonId: { type: "string" },
      addedTimeMs: { type: "float64" },
    }
  };
}

export function deleteWatchLaterSeasonStatement(
  args: {
    watchLaterSeasonWatcherIdEq: string,
    watchLaterSeasonSeasonIdEq: string,
  }
): Statement {
  return {
    sql: "DELETE WatchLaterSeason WHERE (WatchLaterSeason.watcherId = @watchLaterSeasonWatcherIdEq AND WatchLaterSeason.seasonId = @watchLaterSeasonSeasonIdEq)",
    params: {
      watchLaterSeasonWatcherIdEq: args.watchLaterSeasonWatcherIdEq,
      watchLaterSeasonSeasonIdEq: args.watchLaterSeasonSeasonIdEq,
    },
    types: {
      watchLaterSeasonWatcherIdEq: { type: "string" },
      watchLaterSeasonSeasonIdEq: { type: "string" },
    }
  };
}

export interface GetWatchLaterSeasonRow {
  watchLaterSeasonWatcherId?: string,
  watchLaterSeasonSeasonId?: string,
  watchLaterSeasonAddedTimeMs?: number,
}

export let GET_WATCH_LATER_SEASON_ROW: MessageDescriptor<GetWatchLaterSeasonRow> = {
  name: 'GetWatchLaterSeasonRow',
  fields: [{
    name: 'watchLaterSeasonWatcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchLaterSeasonSeasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchLaterSeasonAddedTimeMs',
    index: 3,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function getWatchLaterSeason(
  runner: Database | Transaction,
  args: {
    watchLaterSeasonWatcherIdEq: string,
    watchLaterSeasonSeasonIdEq: string,
  }
): Promise<Array<GetWatchLaterSeasonRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchLaterSeason.watcherId, WatchLaterSeason.seasonId, WatchLaterSeason.addedTimeMs FROM WatchLaterSeason WHERE (WatchLaterSeason.watcherId = @watchLaterSeasonWatcherIdEq AND WatchLaterSeason.seasonId = @watchLaterSeasonSeasonIdEq)",
    params: {
      watchLaterSeasonWatcherIdEq: args.watchLaterSeasonWatcherIdEq,
      watchLaterSeasonSeasonIdEq: args.watchLaterSeasonSeasonIdEq,
    },
    types: {
      watchLaterSeasonWatcherIdEq: { type: "string" },
      watchLaterSeasonSeasonIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetWatchLaterSeasonRow>();
  for (let row of rows) {
    resRows.push({
      watchLaterSeasonWatcherId: row.at(0).value == null ? undefined : row.at(0).value,
      watchLaterSeasonSeasonId: row.at(1).value == null ? undefined : row.at(1).value,
      watchLaterSeasonAddedTimeMs: row.at(2).value == null ? undefined : row.at(2).value.value,
    });
  }
  return resRows;
}

export function updateWatchLaterSeasonStatement(
  args: {
    watchLaterSeasonWatcherIdEq: string,
    watchLaterSeasonSeasonIdEq: string,
    setAddedTimeMs?: number,
  }
): Statement {
  return {
    sql: "UPDATE WatchLaterSeason SET addedTimeMs = @setAddedTimeMs WHERE (WatchLaterSeason.watcherId = @watchLaterSeasonWatcherIdEq AND WatchLaterSeason.seasonId = @watchLaterSeasonSeasonIdEq)",
    params: {
      watchLaterSeasonWatcherIdEq: args.watchLaterSeasonWatcherIdEq,
      watchLaterSeasonSeasonIdEq: args.watchLaterSeasonSeasonIdEq,
      setAddedTimeMs: args.setAddedTimeMs == null ? null : Spanner.float(args.setAddedTimeMs),
    },
    types: {
      watchLaterSeasonWatcherIdEq: { type: "string" },
      watchLaterSeasonSeasonIdEq: { type: "string" },
      setAddedTimeMs: { type: "float64" },
    }
  };
}

export interface ListWatchSessionsRow {
  watchSessionWatcherId?: string,
  watchSessionWatchSessionId?: string,
  watchSessionSeasonId?: string,
  watchSessionEpisodeId?: string,
  watchSessionCreatedTimeMs?: number,
}

export let LIST_WATCH_SESSIONS_ROW: MessageDescriptor<ListWatchSessionsRow> = {
  name: 'ListWatchSessionsRow',
  fields: [{
    name: 'watchSessionWatcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionWatchSessionId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionSeasonId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionEpisodeId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchSessionCreatedTimeMs',
    index: 5,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function listWatchSessions(
  runner: Database | Transaction,
  args: {
    watchSessionWatcherIdEq: string,
    watchSessionCreatedTimeMsLt?: number,
    limit: number,
  }
): Promise<Array<ListWatchSessionsRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchSession.watcherId, WatchSession.watchSessionId, WatchSession.seasonId, WatchSession.episodeId, WatchSession.createdTimeMs FROM WatchSession WHERE (WatchSession.watcherId = @watchSessionWatcherIdEq AND WatchSession.createdTimeMs < @watchSessionCreatedTimeMsLt) ORDER BY WatchSession.createdTimeMs DESC LIMIT @limit",
    params: {
      watchSessionWatcherIdEq: args.watchSessionWatcherIdEq,
      watchSessionCreatedTimeMsLt: args.watchSessionCreatedTimeMsLt == null ? null : Spanner.float(args.watchSessionCreatedTimeMsLt),
      limit: args.limit.toString(),
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
      watchSessionWatcherId: row.at(0).value == null ? undefined : row.at(0).value,
      watchSessionWatchSessionId: row.at(1).value == null ? undefined : row.at(1).value,
      watchSessionSeasonId: row.at(2).value == null ? undefined : row.at(2).value,
      watchSessionEpisodeId: row.at(3).value == null ? undefined : row.at(3).value,
      watchSessionCreatedTimeMs: row.at(4).value == null ? undefined : row.at(4).value.value,
    });
  }
  return resRows;
}

export interface ListWatchedSeasonsRow {
  watchedSeasonWatcherId?: string,
  watchedSeasonSeasonId?: string,
  watchedSeasonLatestEpisodeId?: string,
  watchedSeasonLatestWatchSessionId?: string,
  watchedSeasonUpdatedTimeMs?: number,
}

export let LIST_WATCHED_SEASONS_ROW: MessageDescriptor<ListWatchedSeasonsRow> = {
  name: 'ListWatchedSeasonsRow',
  fields: [{
    name: 'watchedSeasonWatcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedSeasonSeasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedSeasonLatestEpisodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedSeasonLatestWatchSessionId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchedSeasonUpdatedTimeMs',
    index: 5,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function listWatchedSeasons(
  runner: Database | Transaction,
  args: {
    watchedSeasonWatcherIdEq: string,
    watchedSeasonUpdatedTimeMsLt?: number,
    limit: number,
  }
): Promise<Array<ListWatchedSeasonsRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchedSeason.watcherId, WatchedSeason.seasonId, WatchedSeason.latestEpisodeId, WatchedSeason.latestWatchSessionId, WatchedSeason.updatedTimeMs FROM WatchedSeason WHERE (WatchedSeason.watcherId = @watchedSeasonWatcherIdEq AND WatchedSeason.updatedTimeMs < @watchedSeasonUpdatedTimeMsLt) ORDER BY WatchedSeason.updatedTimeMs DESC LIMIT @limit",
    params: {
      watchedSeasonWatcherIdEq: args.watchedSeasonWatcherIdEq,
      watchedSeasonUpdatedTimeMsLt: args.watchedSeasonUpdatedTimeMsLt == null ? null : Spanner.float(args.watchedSeasonUpdatedTimeMsLt),
      limit: args.limit.toString(),
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
      watchedSeasonWatcherId: row.at(0).value == null ? undefined : row.at(0).value,
      watchedSeasonSeasonId: row.at(1).value == null ? undefined : row.at(1).value,
      watchedSeasonLatestEpisodeId: row.at(2).value == null ? undefined : row.at(2).value,
      watchedSeasonLatestWatchSessionId: row.at(3).value == null ? undefined : row.at(3).value,
      watchedSeasonUpdatedTimeMs: row.at(4).value == null ? undefined : row.at(4).value.value,
    });
  }
  return resRows;
}

export interface ListWatchLaterSeasonsRow {
  watchLaterSeasonWatcherId?: string,
  watchLaterSeasonSeasonId?: string,
  watchLaterSeasonAddedTimeMs?: number,
}

export let LIST_WATCH_LATER_SEASONS_ROW: MessageDescriptor<ListWatchLaterSeasonsRow> = {
  name: 'ListWatchLaterSeasonsRow',
  fields: [{
    name: 'watchLaterSeasonWatcherId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchLaterSeasonSeasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'watchLaterSeasonAddedTimeMs',
    index: 3,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function listWatchLaterSeasons(
  runner: Database | Transaction,
  args: {
    watchLaterSeasonWatcherIdEq: string,
    watchLaterSeasonAddedTimeMsLt?: number,
    limit: number,
  }
): Promise<Array<ListWatchLaterSeasonsRow>> {
  let [rows] = await runner.run({
    sql: "SELECT WatchLaterSeason.watcherId, WatchLaterSeason.seasonId, WatchLaterSeason.addedTimeMs FROM WatchLaterSeason WHERE (WatchLaterSeason.watcherId = @watchLaterSeasonWatcherIdEq AND WatchLaterSeason.addedTimeMs < @watchLaterSeasonAddedTimeMsLt) ORDER BY WatchLaterSeason.addedTimeMs DESC LIMIT @limit",
    params: {
      watchLaterSeasonWatcherIdEq: args.watchLaterSeasonWatcherIdEq,
      watchLaterSeasonAddedTimeMsLt: args.watchLaterSeasonAddedTimeMsLt == null ? null : Spanner.float(args.watchLaterSeasonAddedTimeMsLt),
      limit: args.limit.toString(),
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
      watchLaterSeasonWatcherId: row.at(0).value == null ? undefined : row.at(0).value,
      watchLaterSeasonSeasonId: row.at(1).value == null ? undefined : row.at(1).value,
      watchLaterSeasonAddedTimeMs: row.at(2).value == null ? undefined : row.at(2).value.value,
    });
  }
  return resRows;
}
