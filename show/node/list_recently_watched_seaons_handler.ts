import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { listWatchedSeasons } from "../../db/sql";
import { WatchedVideoTimeRow } from "../common/watched_video_time_row";
import { Table } from "@google-cloud/bigtable";
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
      BIGTABLE,
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private bigtable: Table,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: ListRecentlyWatchedSeasonsRequestBody,
  ): Promise<ListRecentlyWatchedSeasonsResponse> {
    let seasonRows = await listWatchedSeasons(this.database, {
      watchedSeasonWatcherIdEq: body.watcherId,
      watchedSeasonUpdatedTimeMsLt: this.getNow(),
      limit: body.limit,
    });
    let seasons = await Promise.all(
      seasonRows.map(
        async (row): Promise<WatchedSeason> => ({
          seasonId: row.watchedSeasonSeasonId,
          latestEpisodeId: row.watchedSeasonLatestEpisodeId,
          latestWatchedVideoTimeMs: await WatchedVideoTimeRow.getMs(
            this.bigtable,
            body.watcherId,
            row.watchedSeasonSeasonId,
            row.watchedSeasonLatestEpisodeId,
            row.watchedSeasonLatestWatchSessionDate,
          ),
        }),
      ),
    );
    return {
      seasons,
    };
  }
}
