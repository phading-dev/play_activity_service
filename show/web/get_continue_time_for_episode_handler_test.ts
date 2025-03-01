import "../../env_local";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchEpisodeSessionStatement,
  insertWatchEpisodeSessionStatement,
} from "../../db/sql";
import { GetContinueTimeForEpisodeHandler } from "./get_continue_time_for_episode_handler";
import { GET_CONTINUE_TIME_FOR_EPISODE_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "GetContinueTimeForEpisodeHandlerTest",
  cases: [
    {
      name: "GetLastWatchedSessionOfEpisode",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchEpisodeSessionStatement({
              watchSessionId: "watchSession1",
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              watchTimeMs: 2000,
              lastUpdatedTimeMs: 100,
            }),
            insertWatchEpisodeSessionStatement({
              watchSessionId: "watchSession2",
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              watchTimeMs: 3000,
              lastUpdatedTimeMs: 900,
            }),
            insertWatchEpisodeSessionStatement({
              watchSessionId: "watchSession3",
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              watchTimeMs: 4000,
              lastUpdatedTimeMs: 1100,
            }),
          ]);
          await transaction.commit();
        });
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new GetContinueTimeForEpisodeHandler(
          SPANNER_DATABASE,
          serviceClientMock,
          () => 1000,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
          },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              continueTimeMs: 3000,
            },
            GET_CONTINUE_TIME_FOR_EPISODE_RESPONSE,
          ),
          "response",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchEpisodeSessionStatement("watchSession1"),
            deleteWatchEpisodeSessionStatement("watchSession2"),
            deleteWatchEpisodeSessionStatement("watchSession3"),
          ]);
          await transaction.commit();
        });
      },
    },
    {
      name: "NoEpisodeWatched",
      async execute() {
        // Prepare
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new GetContinueTimeForEpisodeHandler(
          SPANNER_DATABASE,
          serviceClientMock,
          () => 1000,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
          },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage({}, GET_CONTINUE_TIME_FOR_EPISODE_RESPONSE),
          "response",
        );
      },
      async tearDown() {},
    },
  ],
});
