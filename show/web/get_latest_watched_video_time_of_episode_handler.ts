import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { getWatchedEpisode } from "../../db/sql";
import {
  WATCHED_VIDEO_TIME_TABLE,
  WatchedVideoTimeTable,
} from "../common/watched_video_time_table";
import { Database } from "@google-cloud/spanner";
import { GetLatestWatchedVideoTimeOfEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  GetLatestWatchedVideoTimeOfEpisodeRequestBody,
  GetLatestWatchedVideoTimeOfEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class GetLatestWatchedVideoTimeOfEpisodeHandler extends GetLatestWatchedVideoTimeOfEpisodeHandlerInterface {
  public static create(): GetLatestWatchedVideoTimeOfEpisodeHandler {
    return new GetLatestWatchedVideoTimeOfEpisodeHandler(
      SPANNER_DATABASE,
      WATCHED_VIDEO_TIME_TABLE,
      SERVICE_CLIENT,
    );
  }

  public constructor(
    private database: Database,
    private watchedVideoTimeTable: WatchedVideoTimeTable,
    private serviceClient: NodeServiceClient,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: GetLatestWatchedVideoTimeOfEpisodeRequestBody,
    authStr: string,
  ): Promise<GetLatestWatchedVideoTimeOfEpisodeResponse> {
    if (!body.seasonId) {
      throw newBadRequestError(`"seasonId" is required.`);
    }
    if (!body.episodeId) {
      throw newBadRequestError(`"episodeId" is required.`);
    }
    let { accountId, capabilities } = await this.serviceClient.send(
      newFetchSessionAndCheckCapabilityRequest({
        signedSession: authStr,
        capabilitiesMask: {
          checkCanConsume: true,
        },
      }),
    );
    if (!capabilities.canConsume) {
      throw newUnauthorizedError(
        `Account ${accountId} is not allowed to get latest watch time of episode.`,
      );
    }
    let rows = await getWatchedEpisode(this.database, {
      watchedEpisodeWatcherIdEq: accountId,
      watchedEpisodeSeasonIdEq: body.seasonId,
      watchedEpisodeEpisodeIdEq: body.episodeId,
    });
    if (rows.length === 0) {
      // No records.
      return {};
    } else {
      let row = rows[0];
      return {
        watchedVideoTimeMs: await this.watchedVideoTimeTable.getMs(
          accountId,
          row.watchedEpisodeLatestWatchSessionId,
        ),
      };
    }
  }
}
