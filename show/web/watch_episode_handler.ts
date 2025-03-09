import crypto = require("crypto");
import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  getWatchedEpisode,
  getWatchedSeason,
  insertWatchSessionStatement,
  insertWatchedEpisodeStatement,
  insertWatchedSeasonStatement,
  updateWatchedEpisodeStatement,
  updateWatchedSeasonStatement,
} from "../../db/sql";
import { WATCH_TIME_TABLE, WatchTimeTable } from "../common/watch_time_table";
import { Database } from "@google-cloud/spanner";
import { WatchEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  WatchEpisodeRequestBody,
  WatchEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newExchangeSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class WatchEpisodeHandler extends WatchEpisodeHandlerInterface {
  public static create(): WatchEpisodeHandler {
    return new WatchEpisodeHandler(
      SPANNER_DATABASE,
      WATCH_TIME_TABLE,
      SERVICE_CLIENT,
      () => crypto.randomUUID(),
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private watchTimeTable: WatchTimeTable,
    private serviceClient: NodeServiceClient,
    private generateUuid: () => string,
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
    if (!body.watchTimeMs) {
      throw newBadRequestError(`"watchTimeMs" is required.`);
    }
    let { accountId, capabilities } = await this.serviceClient.send(
      newExchangeSessionAndCheckCapabilityRequest({
        signedSession: sessionStr,
        capabilitiesMask: {
          checkCanConsumeShows: true,
        },
      }),
    );
    if (!capabilities.canConsumeShows) {
      throw newUnauthorizedError(
        `Account ${accountId} is not allowed to record watch session.`,
      );
    }
    let watchSessionId = body.watchSessionId;
    if (!watchSessionId) {
      watchSessionId = this.generateUuid();
      await this.database.runTransactionAsync(async (transaction) => {
        let [seasonRows, episodeRows] = await Promise.all([
          getWatchedSeason(transaction, accountId, body.seasonId),
          getWatchedEpisode(
            transaction,
            accountId,
            body.seasonId,
            body.episodeId,
          ),
        ]);
        let now = this.getNow();
        let statements = [
          insertWatchSessionStatement({
            watcherId: accountId,
            watchSessionId,
            seasonId: body.seasonId,
            episodeId: body.episodeId,
            createdTimeMs: now,
          }),
        ];
        if (seasonRows.length === 0) {
          statements.push(
            insertWatchedSeasonStatement({
              watcherId: accountId,
              seasonId: body.seasonId,
              latestEpisodeId: body.episodeId,
              latestEpisodeIndex: body.episodeIndex,
              latestWatchSessionId: watchSessionId,
              updatedTimeMs: now,
            }),
          );
        } else {
          let data = seasonRows[0].watchedSeasonData;
          data.latestEpisodeId = body.episodeId;
          data.latestEpisodeIndex = body.episodeIndex;
          data.latestWatchSessionId = watchSessionId;
          data.updatedTimeMs = now;
          statements.push(updateWatchedSeasonStatement(data));
        }
        if (episodeRows.length === 0) {
          statements.push(
            insertWatchedEpisodeStatement({
              watcherId: accountId,
              seasonId: body.seasonId,
              episodeId: body.episodeId,
              episodeIndex: body.episodeIndex,
              latestWatchSessionId: watchSessionId,
              updatedTimeMs: now,
            }),
          );
        } else {
          let data = episodeRows[0].watchedEpisodeData;
          data.latestWatchSessionId = watchSessionId;
          data.updatedTimeMs = now;
          statements.push(updateWatchedEpisodeStatement(data));
        }
        await transaction.batchUpdate(statements);
        await transaction.commit();
      });
    }
    await this.watchTimeTable.set(accountId, watchSessionId, body.watchTimeMs);
    return {
      watchSessionId,
    };
  }
}
