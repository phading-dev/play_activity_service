import { SERVICE_CLIENT } from "../../common/service_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import { listWatchEpisodeSessionsBySeason } from "../../db/sql";
import { Database } from "@google-cloud/spanner";
import { GetContinueEpisodeHandlerInterface } from "@phading/play_activity_service_interface/show/web/handler";
import {
  GetContinueEpisodeRequestBody,
  GetContinueEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import { newExchangeSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class GetContinueEpisodeHandler extends GetContinueEpisodeHandlerInterface {
  public static create(): GetContinueEpisodeHandler {
    return new GetContinueEpisodeHandler(SPANNER_DATABASE, SERVICE_CLIENT, () =>
      Date.now(),
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
    body: GetContinueEpisodeRequestBody,
    sessionStr: string,
  ): Promise<GetContinueEpisodeResponse> {
    if (!body.seasonId) {
      throw newBadRequestError(`"seasonId" is required.`);
    }
    let { accountId, capabilities } = await this.serviceClient.send(
      newExchangeSessionAndCheckCapabilityRequest({
        signedSession: sessionStr,
        capabilitiesMask: {
          checkCanConsumeShows: true,
        },
      }),
    );
    if (!capabilities.canConsumeShows) {
      throw newUnauthorizedError(
        `Account ${accountId} is not allowed to get continue episode.`,
      );
    }
    let rows = await listWatchEpisodeSessionsBySeason(
      this.database,
      accountId,
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
