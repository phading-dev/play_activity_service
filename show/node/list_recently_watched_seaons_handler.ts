import { SPANNER_DATABASE } from "../../common/spanner_database";
import { listWatchedSeasons } from "../../db/sql";
import { WATCH_TIME_TABLE, WatchTimeTable } from "../common/watch_time_table";
import { Database } from "@google-cloud/spanner";
import { ListRecentlyWatchedSeasonsHandlerInterface } from "@phading/play_activity_service_interface/show/node/handler";
import {
  ListRecentlyWatchedSeasonsRequestBody,
  ListRecentlyWatchedSeasonsResponse,
} from "@phading/play_activity_service_interface/show/node/interface";
import { WatchedSeason } from "@phading/play_activity_service_interface/show/node/watched_season";

export class ListRecentlyWatchedSeasonsHandler extends ListRecentlyWatchedSeasonsHandlerInterface {
  public static create(): ListRecentlyWatchedSeasonsHandler {
    return new ListRecentlyWatchedSeasonsHandler(
      SPANNER_DATABASE,
      WATCH_TIME_TABLE,
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private watchTimeTable: WatchTimeTable,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: ListRecentlyWatchedSeasonsRequestBody,
  ): Promise<ListRecentlyWatchedSeasonsResponse> {
    let seasonRows = await listWatchedSeasons(
      this.database,
      body.watcherId,
      this.getNow(),
      body.limit,
    );
    let seasons = await Promise.all(
      seasonRows.map(
        async (row): Promise<WatchedSeason> => ({
          seasonId: row.watchedSeasonData.seasonId,
          latestEpisodeId: row.watchedSeasonData.latestEpisodeId,
          latestEpisodeIndex: row.watchedSeasonData.latestEpisodeIndex,
          latestWatchedTimeMs: await this.watchTimeTable.getMs(
            body.watcherId,
            row.watchedSeasonData.latestWatchSessionId,
          ),
        }),
      ),
    );
    return {
      seasons,
    };
  }
}
