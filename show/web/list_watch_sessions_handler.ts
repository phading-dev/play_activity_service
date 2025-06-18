import { BIGTABLE } from "../../common/bigtable_client";
import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { listWatchSessions } from "../../db/sql";
import { WatchedVideoTimeRow } from "../common/watched_video_time_row";
import { Table } from "@google-cloud/bigtable";
import { Database } from "@google-cloud/spanner";
import { ListWatchSessionsHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  ListWatchSessionsRequestBody,
  ListWatchSessionsResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { WatchSession } from "@phading/play_activity_service_interface/show/web/watch_session";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class ListWatchSessionsHandler extends ListWatchSessionsHandlerInterface {
  public static create(): ListWatchSessionsHandler {
    return new ListWatchSessionsHandler(
      SPANNER_DATABASE,
      BIGTABLE,
      SERVICE_CLIENT,
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private bigtable: Table,
    private serviceClient: NodeServiceClient,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: ListWatchSessionsRequestBody,
    sessionStr: string,
  ): Promise<ListWatchSessionsResponse> {
    if (!body.limit) {
      throw newBadRequestError(`"limit" is required.`);
    }
    let { accountId, capabilities } = await this.serviceClient.send(
      newFetchSessionAndCheckCapabilityRequest({
        signedSession: sessionStr,
        capabilitiesMask: {
          checkCanConsume: true,
        },
      }),
    );
    if (!capabilities.canConsume) {
      throw newUnauthorizedError(
        `Account ${accountId} is not allowed to list watched episodes.`,
      );
    }
    let rows = await listWatchSessions(this.database, {
      watchSessionWatcherIdEq: accountId,
      watchSessionUpdatedTimeMsLt: body.updatedTimeCursor ?? this.getNow(),
      limit: body.limit,
    });
    let sessions = await Promise.all(
      rows.map(
        async (row): Promise<WatchSession> => ({
          seasonId: row.watchSessionSeasonId,
          episodeId: row.watchSessionEpisodeId,
          date: row.watchSessionDate,
          latestWatchedVideoTimeMs: await WatchedVideoTimeRow.getMs(
            this.bigtable,
            accountId,
            row.watchSessionSeasonId,
            row.watchSessionEpisodeId,
            row.watchSessionDate,
          ),
        }),
      ),
    );
    return {
      sessions,
      updatedTimeCursor:
        rows.length === body.limit
          ? rows[rows.length - 1].watchSessionUpdatedTimeMs
          : undefined,
    };
  }
}
