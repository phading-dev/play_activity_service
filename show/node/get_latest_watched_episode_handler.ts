import { SPANNER_DATABASE } from "../../common/spanner_database";
import { getWatchedSeason } from "../../db/sql";
import { WATCH_TIME_TABLE, WatchTimeTable } from "../common/watch_time_table";
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
      WATCH_TIME_TABLE,
    );
  }

  public constructor(
    private database: Database,
    private watchTimeTable: WatchTimeTable,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: GetLatestWatchedEpisodeRequestBody,
  ): Promise<GetLatestWatchedEpisodeResponse> {
    let rows = await getWatchedSeason(
      this.database,
      body.watcherId,
      body.seasonId,
    );
    if (rows.length === 0) {
      // No records.
      return {};
    } else {
      let season = rows[0];
      return {
        episodeId: season.watchedSeasonData.latestEpisodeId,
        episodeIndex: season.watchedSeasonData.latestEpisodeIndex,
        watchedTimeMs: await this.watchTimeTable.getMs(
          body.watcherId,
          season.watchedSeasonData.latestWatchSessionId,
        ),
      };
    }
  }
}
