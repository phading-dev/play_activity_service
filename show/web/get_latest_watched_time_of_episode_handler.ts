import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { getWatchedEpisode } from "../../db/sql";
import { WATCH_TIME_TABLE, WatchTimeTable } from "../common/watch_time_table";
import { Database } from "@google-cloud/spanner";
import { GetLatestWatchedTimeOfEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  GetLatestWatchedTimeOfEpisodeRequestBody,
  GetLatestWatchedTimeOfEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newExchangeSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class GetLatestWatchedTimeOfEpisodeHandler extends GetLatestWatchedTimeOfEpisodeHandlerInterface {
  public static create(): GetLatestWatchedTimeOfEpisodeHandler {
    return new GetLatestWatchedTimeOfEpisodeHandler(
      SPANNER_DATABASE,
      WATCH_TIME_TABLE,
      SERVICE_CLIENT,
    );
  }

  public constructor(
    private database: Database,
    private watchTimeTable: WatchTimeTable,
    private serviceClient: NodeServiceClient,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: GetLatestWatchedTimeOfEpisodeRequestBody,
    sessionStr: string,
  ): Promise<GetLatestWatchedTimeOfEpisodeResponse> {
    if (!body.seasonId) {
      throw newBadRequestError(`"seasonId" is required.`);
    }
    if (!body.episodeId) {
      throw newBadRequestError(`"episodeId" is required.`);
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
        `Account ${accountId} is not allowed to get latest watched time of episode.`,
      );
    }
    let rows = await getWatchedEpisode(
      this.database,
      accountId,
      body.seasonId,
      body.episodeId,
    );
    if (rows.length === 0) {
      // No records.
      return {};
    } else {
      let data = rows[0].watchedEpisodeData;
      return {
        episodeIndex: data.episodeIndex,
        watchedTimeMs: await this.watchTimeTable.getMs(
          accountId,
          data.latestWatchSessionId,
        ),
      };
    }
  }
}
