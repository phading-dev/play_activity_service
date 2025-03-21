import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  getWatchLaterSeason,
  insertWatchLaterSeasonStatement,
  updateWatchLaterSeasonStatement,
} from "../../db/sql";
import { Database } from "@google-cloud/spanner";
import { AddToWatchLaterListHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  AddToWatchLaterListRequestBody,
  AddToWatchLaterListResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class AddToWatchLaterListHandler extends AddToWatchLaterListHandlerInterface {
  public static create(): AddToWatchLaterListHandler {
    return new AddToWatchLaterListHandler(
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
    body: AddToWatchLaterListRequestBody,
    sessionStr: string,
  ): Promise<AddToWatchLaterListResponse> {
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
        `Account ${accountId} is not allowed to add to watch later list.`,
      );
    }
    await this.database.runTransactionAsync(async (transaction) => {
      let rows = await getWatchLaterSeason(transaction, {
        watchLaterSeasonWatcherIdEq: accountId,
        watchLaterSeasonSeasonIdEq: body.seasonId,
      });
      if (rows.length === 0) {
        await transaction.batchUpdate([
          insertWatchLaterSeasonStatement({
            watcherId: accountId,
            seasonId: body.seasonId,
            addedTimeMs: this.getNow(),
          }),
        ]);
        await transaction.commit();
      } else {
        await transaction.batchUpdate([
          updateWatchLaterSeasonStatement({
            watchLaterSeasonWatcherIdEq: accountId,
            watchLaterSeasonSeasonIdEq: body.seasonId,
            setAddedTimeMs: this.getNow(),
          }),
        ]);
        await transaction.commit();
      }
    });
    return {};
  }
}
