import { BIGTABLE } from "../../common/bigtable_client";
import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  getWatchSession,
  getWatchedEpisode,
  getWatchedSeason,
  insertWatchSessionStatement,
  insertWatchedEpisodeStatement,
  insertWatchedSeasonStatement,
  updateWatchSessionStatement,
  updateWatchedEpisodeStatement,
  updateWatchedSeasonStatement,
} from "../../db/sql";
import { ENV_VARS } from "../../env_vars";
import { LastWatchedRow } from "../common/last_watched_row";
import { WatchedVideoTimeRow } from "../common/watched_video_time_row";
import { Table } from "@google-cloud/bigtable";
import { Database } from "@google-cloud/spanner";
import { Statement } from "@google-cloud/spanner/build/src/transaction";
import { WatchEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  WatchEpisodeRequestBody,
  WatchEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";
import { TzDate } from "@selfage/tz_date";

export class WatchEpisodeHandler extends WatchEpisodeHandlerInterface {
  public static create(): WatchEpisodeHandler {
    return new WatchEpisodeHandler(
      SPANNER_DATABASE,
      BIGTABLE,
      SERVICE_CLIENT,
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private bigtable: Table,
    private serviceClient: NodeServiceClient,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: WatchEpisodeRequestBody,
    sessionStr: string,
  ): Promise<WatchEpisodeResponse> {
    if (!body.seasonId) {
      throw newBadRequestError(`"seasonId" is required.`);
    }
    if (!body.episodeId) {
      throw newBadRequestError(`"episodeId" is required.`);
    }
    if (body.watchedVideoTimeMs == null) {
      throw newBadRequestError(`"watchedVideoTimeMs" is required.`);
    }
    let { accountId, capabilities } = await this.serviceClient.send(
      newFetchSessionAndCheckCapabilityRequest({
        signedSession: sessionStr,
        capabilitiesMask: {
          checkCanConsume: true,
        },
      }),
    );
    if (!capabilities.canConsume) {
      throw newUnauthorizedError(
        `Account ${accountId} is not allowed to record watch session.`,
      );
    }
    let date = TzDate.fromTimestampMs(
      this.getNow(),
      ENV_VARS.timezoneNegativeOffset,
    ).toLocalDateISOString();
    let { seasonId, episodeId } = await LastWatchedRow.get(
      this.bigtable,
      accountId,
      date,
    );
    if (body.seasonId !== seasonId || body.episodeId !== episodeId) {
      // TODO: Use upsert
      await this.database.runTransactionAsync(async (transaction) => {
        let [sessionRows, seasonRows, episodeRows] = await Promise.all([
          getWatchSession(transaction, {
            watchSessionWatcherIdEq: accountId,
            watchSessionSeasonIdEq: body.seasonId,
            watchSessionEpisodeIdEq: body.episodeId,
            watchSessionDateEq: date,
          }),
          getWatchedSeason(transaction, {
            watchedSeasonWatcherIdEq: accountId,
            watchedSeasonSeasonIdEq: body.seasonId,
          }),
          getWatchedEpisode(transaction, {
            watchedEpisodeWatcherIdEq: accountId,
            watchedEpisodeSeasonIdEq: body.seasonId,
            watchedEpisodeEpisodeIdEq: body.episodeId,
          }),
        ]);
        let now = this.getNow();
        let statements = new Array<Statement>();
        if (sessionRows.length === 0) {
          statements.push(
            insertWatchSessionStatement({
              watcherId: accountId,
              seasonId: body.seasonId,
              episodeId: body.episodeId,
              date,
              updatedTimeMs: now,
            }),
          );
        } else {
          statements.push(
            updateWatchSessionStatement({
              watchSessionWatcherIdEq: accountId,
              watchSessionSeasonIdEq: body.seasonId,
              watchSessionEpisodeIdEq: body.episodeId,
              watchSessionDateEq: date,
              setUpdatedTimeMs: now,
            }),
          );
        }
        if (seasonRows.length === 0) {
          statements.push(
            insertWatchedSeasonStatement({
              watcherId: accountId,
              seasonId: body.seasonId,
              latestEpisodeId: body.episodeId,
              latestWatchSessionDate: date,
              updatedTimeMs: now,
            }),
          );
        } else {
          statements.push(
            updateWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: accountId,
              watchedSeasonSeasonIdEq: body.seasonId,
              setLatestEpisodeId: body.episodeId,
              setLatestWatchSessionDate: date,
              setUpdatedTimeMs: now,
            }),
          );
        }
        if (episodeRows.length === 0) {
          statements.push(
            insertWatchedEpisodeStatement({
              watcherId: accountId,
              seasonId: body.seasonId,
              episodeId: body.episodeId,
              latestWatchSessionDate: date,
              updatedTimeMs: now,
            }),
          );
        } else {
          statements.push(
            updateWatchedEpisodeStatement({
              watchedEpisodeWatcherIdEq: accountId,
              watchedEpisodeSeasonIdEq: body.seasonId,
              watchedEpisodeEpisodeIdEq: body.episodeId,
              setLatestWatchSessionDate: date,
              setUpdatedTimeMs: now,
            }),
          );
        }
        await transaction.batchUpdate(statements);
        await transaction.commit();
      });
    }

    await this.bigtable.insert([
      WatchedVideoTimeRow.setEntry(
        accountId,
        body.seasonId,
        body.episodeId,
        date,
        body.watchedVideoTimeMs,
      ),
      LastWatchedRow.setEntry(accountId, date, body.seasonId, body.episodeId),
    ]);
    return {};
  }
}
