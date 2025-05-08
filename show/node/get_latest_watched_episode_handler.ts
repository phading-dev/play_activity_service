import { SPANNER_DATABASE } from "../../common/spanner_database";
import { getWatchedSeason } from "../../db/sql";
import {
  WATCHED_VIDEO_TIME_TABLE,
  WatchedVideoTimeTable,
} from "../common/watched_video_time_table";
import { Database } from "@google-cloud/spanner";
import { GetLatestWatchedEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/node/handler";
import {
  GetLatestWatchedEpisodeRequestBody,
  GetLatestWatchedEpisodeResponse,
} from "@phading/play_activity_service_interface/show/node/interface";

export class GetLatestWatchedEpisodeHandler extends GetLatestWatchedEpisodeHandlerInterface {
  public static create(): GetLatestWatchedEpisodeHandler {
    return new GetLatestWatchedEpisodeHandler(
      SPANNER_DATABASE,
      WATCHED_VIDEO_TIME_TABLE,
    );
  }

  public constructor(
    private database: Database,
    private watchedVideoTimeTable: WatchedVideoTimeTable,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: GetLatestWatchedEpisodeRequestBody,
  ): Promise<GetLatestWatchedEpisodeResponse> {
    let rows = await getWatchedSeason(this.database, {
      watchedSeasonWatcherIdEq: body.watcherId,
      watchedSeasonSeasonIdEq: body.seasonId,
    });
    if (rows.length === 0) {
      // No records.
      return {};
    } else {
      let season = rows[0];
      return {
        episodeId: season.watchedSeasonLatestEpisodeId,
        watchedVideoTimeMs: await this.watchedVideoTimeTable.getMs(
          body.watcherId,
          season.watchedSeasonLatestWatchSessionId,
        ),
      };
    }
  }
}
