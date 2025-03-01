import crypto = require("crypto");
import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  getWatchEpisodeSession,
  insertWatchEpisodeSessionStatement,
  updateWatchEpisodeSessionStatement,
} from "../../db/sql";
import { Database } from "@google-cloud/spanner";
import { WatchEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  WatchEpisodeRequestBody,
  WatchEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newExchangeSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import {
  newBadRequestError,
  newNotFoundError,
  newUnauthorizedError,
} from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class WatchEpisodeHandler extends WatchEpisodeHandlerInterface {
  public static create(): WatchEpisodeHandler {
    return new WatchEpisodeHandler(
      SPANNER_DATABASE,
      SERVICE_CLIENT,
      () => crypto.randomUUID(),
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
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
    await this.database.runTransactionAsync(async (transaction) => {
      if (!watchSessionId) {
        watchSessionId = this.generateUuid();
        await transaction.batchUpdate([
          insertWatchEpisodeSessionStatement({
            watchSessionId,
            watcherId: accountId,
            seasonId: body.seasonId,
            episodeId: body.episodeId,
            watchTimeMs: body.watchTimeMs,
            lastUpdatedTimeMs: this.getNow(),
          }),
        ]);
        await transaction.commit();
      } else {
        let rows = await getWatchEpisodeSession(transaction, watchSessionId);
        if (rows.length === 0) {
          throw newNotFoundError(`Watch session ${watchSessionId} not found.`);
        }
        let { watchEpisodeSessionData } = rows[0];
        if (
          watchEpisodeSessionData.seasonId !== body.seasonId ||
          watchEpisodeSessionData.episodeId !== body.episodeId
        ) {
          throw newNotFoundError(
            `Watch session ${watchSessionId} does not match season ${body.seasonId} or episode ${body.episodeId}.`,
          );
        }
        watchEpisodeSessionData.watchTimeMs = body.watchTimeMs;
        watchEpisodeSessionData.lastUpdatedTimeMs = this.getNow();
        await transaction.batchUpdate([
          updateWatchEpisodeSessionStatement(watchEpisodeSessionData),
        ]);
        await transaction.commit();
      }
    });
    return {
      watchSessionId,
    };
  }
}
