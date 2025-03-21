import { SPANNER_DATABASE } from "../../common/spanner_database";
import { getWatchedEpisode } from "../../db/sql";
import { WATCH_TIME_TABLE, WatchTimeTable } from "../common/watch_time_table";
import { Database } from "@google-cloud/spanner";
import { GetLatestWatchedTimeOfEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/node/handler";
import {
  GetLatestWatchedTimeOfEpisodeRequestBody,
  GetLatestWatchedTimeOfEpisodeResponse,
} from "@phading/play_activity_service_interface/show/node/interface";

export class GetLatestWatchedTimeOfEpisodeHandler extends GetLatestWatchedTimeOfEpisodeHandlerInterface {
  public static create(): GetLatestWatchedTimeOfEpisodeHandler {
    return new GetLatestWatchedTimeOfEpisodeHandler(
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
    body: GetLatestWatchedTimeOfEpisodeRequestBody,
  ): Promise<GetLatestWatchedTimeOfEpisodeResponse> {
    let rows = await getWatchedEpisode(this.database, {
      watchedEpisodeWatcherIdEq: body.watcherId,
      watchedEpisodeSeasonIdEq: body.seasonId,
      watchedEpisodeEpisodeIdEq: body.episodeId,
    });
    if (rows.length === 0) {
      // No records.
      return {};
    } else {
      let row = rows[0];
      return {
        episodeIndex: row.watchedEpisodeEpisodeIndex,
        watchedTimeMs: await this.watchTimeTable.getMs(
          body.watcherId,
          row.watchedEpisodeLatestWatchSessionId,
        ),
      };
    }
  }
}
