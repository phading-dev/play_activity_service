import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { deleteWatchLaterSeasonStatement } from "../../db/sql";
import { Database } from "@google-cloud/spanner";
import { DeleteFromWatchLaterListHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  DeleteFromWatchLaterListRequestBody,
  DeleteFromWatchLaterListResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class DeleteFromWatchLaterListHandler extends DeleteFromWatchLaterListHandlerInterface {
  public static create(): DeleteFromWatchLaterListHandler {
    return new DeleteFromWatchLaterListHandler(
      SPANNER_DATABASE,
      SERVICE_CLIENT,
    );
  }

  public constructor(
    private database: Database,
    private serviceClient: NodeServiceClient,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: DeleteFromWatchLaterListRequestBody,
    sessionStr: string,
  ): Promise<DeleteFromWatchLaterListResponse> {
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
        `Account ${accountId} is not allowed to delete from watch later list.`,
      );
    }
    await this.database.runTransactionAsync(async (transaction) => {
      await transaction.batchUpdate([
        deleteWatchLaterSeasonStatement({
          watchLaterSeasonWatcherIdEq: accountId,
          watchLaterSeasonSeasonIdEq: body.seasonId,
        }),
      ]);
      await transaction.commit();
    });
    return {};
  }
}
