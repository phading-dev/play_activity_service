import { SPANNER_DATABASE } from "../../common/spanner_database";
import { listWatchEpisodeSessionsBySeason } from "../../db/sql";
import { Database } from "@google-cloud/spanner";
import { GetContinueEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/node/handler";
import {
  GetContinueEpisodeRequestBody,
  GetContinueEpisodeResponse,
} from "@phading/play_activity_service_interface/show/node/interface";

export class GetContinueEpisodeHandler extends GetContinueEpisodeHandlerInterface {
  public static create(): GetContinueEpisodeHandler {
    return new GetContinueEpisodeHandler(SPANNER_DATABASE, () => Date.now());
  }

  public constructor(
    private database: Database,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: GetContinueEpisodeRequestBody,
  ): Promise<GetContinueEpisodeResponse> {
    let rows = await listWatchEpisodeSessionsBySeason(
      this.database,
      body.watcherId,
      body.seasonId,
      this.getNow(),
      1,
    );
    if (rows.length === 0) {
      // No records.
      return {};
    } else {
      let { watchEpisodeSessionData } = rows[0];
      return {
        episodeId: watchEpisodeSessionData.episodeId,
        continueTimeMs: watchEpisodeSessionData.watchTimeMs,
      };
    }
  }
}
