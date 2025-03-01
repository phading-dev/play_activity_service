import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { listWatchEpisodeSessions } from "../../db/sql";
import { Database } from "@google-cloud/spanner";
import { EpisodeWatched } from "@phading/play_activity_service_interface/show/web/episode_watched";
import { ListWatchedEpisodesHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  ListWatchedEpisodesRequestBody,
  ListWatchedEpisodesResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newExchangeSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class ListWatchedEpisodesHandler extends ListWatchedEpisodesHandlerInterface {
  public static create(): ListWatchedEpisodesHandler {
    return new ListWatchedEpisodesHandler(
      SPANNER_DATABASE,
      SERVICE_CLIENT,
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private serviceClient: NodeServiceClient,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: ListWatchedEpisodesRequestBody,
    sessionStr: string,
  ): Promise<ListWatchedEpisodesResponse> {
    if (!body.limit) {
      throw newBadRequestError(`"limit" is required.`);
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
        `Account ${accountId} is not allowed to list watched episodes.`,
      );
    }
    let rows = await listWatchEpisodeSessions(
      this.database,
      accountId,
      body.lastWatchedTimeCursor ?? this.getNow(),
      body.limit,
    );
    return {
      episodes: rows.map(
        (row): EpisodeWatched => ({
          seasonId: row.watchEpisodeSessionData.seasonId,
          episodeId: row.watchEpisodeSessionData.episodeId,
          lastWatchedTimeMs: row.watchEpisodeSessionData.lastUpdatedTimeMs,
          continueTimeMs: row.watchEpisodeSessionData.watchTimeMs,
        }),
      ),
      lastWatchedTimeCursor:
        rows.length === body.limit
          ? rows[rows.length - 1].watchEpisodeSessionData.lastUpdatedTimeMs
          : undefined,
    };
  }
}
