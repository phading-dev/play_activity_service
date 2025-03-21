import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { listWatchLaterSeasons } from "../../db/sql";
import { Database } from "@google-cloud/spanner";
import { ListFromWatchLaterListHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  ListFromWatchLaterListRequestBody,
  ListFromWatchLaterListResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class ListFromWatchLaterListHandler extends ListFromWatchLaterListHandlerInterface {
  public static create(): ListFromWatchLaterListHandler {
    return new ListFromWatchLaterListHandler(
      SPANNER_DATABASE,
      SERVICE_CLIENT,
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private serviceClient: NodeServiceClient,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: ListFromWatchLaterListRequestBody,
    sessionStr: string,
  ): Promise<ListFromWatchLaterListResponse> {
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
        `Account ${accountId} is not allowed to list from watch later list.`,
      );
    }
    let rows = await listWatchLaterSeasons(this.database, {
      watchLaterSeasonWatcherIdEq: accountId,
      watchLaterSeasonAddedTimeMsLt: body.addedTimeCursor ?? this.getNow(),
      limit: body.limit,
    });
    return {
      seasonIds: rows.map((row) => row.watchLaterSeasonSeasonId),
      addedTimeCursor:
        rows.length === body.limit
          ? rows[rows.length - 1].watchLaterSeasonAddedTimeMs
          : undefined,
    };
  }
}
