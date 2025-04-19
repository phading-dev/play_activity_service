import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { getWatchLaterSeason } from "../../db/sql";
import { Database } from "@google-cloud/spanner";
import { CheckInWatchLaterListHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  CheckInWatchLaterListRequestBody,
  CheckInWatchLaterListResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class CheckInWatchLaterListHandler extends CheckInWatchLaterListHandlerInterface {
  public static create(): CheckInWatchLaterListHandler {
    return new CheckInWatchLaterListHandler(SPANNER_DATABASE, SERVICE_CLIENT);
  }

  public constructor(
    private database: Database,
    private serviceClient: NodeServiceClient,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: CheckInWatchLaterListRequestBody,
    sessionStr: string,
  ): Promise<CheckInWatchLaterListResponse> {
    if (!body.seasonId) {
      throw newBadRequestError(`"seasonId" is required.`);
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
        `Account ${accountId} is not allowed to check in watch later list.`,
      );
    }
    let rows = await getWatchLaterSeason(this.database, {
      watchLaterSeasonWatcherIdEq: accountId,
      watchLaterSeasonSeasonIdEq: body.seasonId,
    });
    return {
      isIn: rows.length > 0,
    };
  }
}
