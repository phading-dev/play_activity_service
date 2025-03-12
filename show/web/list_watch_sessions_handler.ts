import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { listWatchSessions } from "../../db/sql";
import { WATCH_TIME_TABLE, WatchTimeTable } from "../common/watch_time_table";
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
      WATCH_TIME_TABLE,
      SERVICE_CLIENT,
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private watchTimeTable: WatchTimeTable,
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
    let rows = await listWatchSessions(
      this.database,
      accountId,
      body.createdTimeCursor ?? this.getNow(),
      body.limit,
    );
    let sessions = await Promise.all(
      rows.map(
        async (row): Promise<WatchSession> => ({
          seasonId: row.watchSessionData.seasonId,
          episodeId: row.watchSessionData.episodeId,
          latestWatchedTimeMs: await this.watchTimeTable.getMs(
            accountId,
            row.watchSessionData.watchSessionId,
          ),
          createdTimeMs: row.watchSessionData.createdTimeMs,
        }),
      ),
    );
    return {
      sessions,
      createdTimeCursor:
        rows.length === body.limit
          ? rows[rows.length - 1].watchSessionData.createdTimeMs
          : undefined,
    };
  }
}
