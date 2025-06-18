import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { getWatchedSeason } from "../../db/sql";
import { WatchedVideoTimeRow } from "../common/watched_video_time_row";
import { Table } from "@google-cloud/bigtable";
import { Database } from "@google-cloud/spanner";
import { GetLatestWatchedEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/node/handler";
import {
  GetLatestWatchedEpisodeRequestBody,
  GetLatestWatchedEpisodeResponse,
} from "@phading/play_activity_service_interface/show/node/interface";

export class GetLatestWatchedEpisodeHandler extends GetLatestWatchedEpisodeHandlerInterface {
  public static create(): GetLatestWatchedEpisodeHandler {
    return new GetLatestWatchedEpisodeHandler(SPANNER_DATABASE, BIGTABLE);
  }

  public constructor(
    private database: Database,
    private bigtable: Table,
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
        watchedVideoTimeMs: await WatchedVideoTimeRow.getMs(
          this.bigtable,
          body.watcherId,
          body.seasonId,
          season.watchedSeasonLatestEpisodeId,
          season.watchedSeasonLatestWatchSessionDate,
        ),
      };
    }
  }
}
