import "../../local/env";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchEpisodeSessionStatement,
  insertWatchEpisodeSessionStatement,
} from "../../db/sql";
import { ListWatchedEpisodesHandler } from "./list_watched_episodes_handler";
import { LIST_WATCHED_EPISODES_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "ListWatchedEpisodesHandlerTest",
  cases: [
    {
      name: "ListOneBatch_ListAgainButNoMore",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchEpisodeSessionStatement({
              watchSessionId: "watchSession1",
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              watchTimeMs: 1000,
              lastUpdatedTimeMs: 10,
            }),
            insertWatchEpisodeSessionStatement({
              watchSessionId: "watchSession2",
              watcherId: "account1",
              seasonId: "season2",
              episodeId: "episode2",
              watchTimeMs: 3000,
              lastUpdatedTimeMs: 30,
            }),
            insertWatchEpisodeSessionStatement({
              watchSessionId: "watchSession3",
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              watchTimeMs: 2000,
              lastUpdatedTimeMs: 20,
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
        let handler = new ListWatchedEpisodesHandler(
          SPANNER_DATABASE,
          serviceClientMock,
          () => 1000,
        );

        {
          // Execute
          let response = await handler.handle("", { limit: 2 }, "session1");

          // Verify
          assertThat(
            response,
            eqMessage(
              {
                episodes: [
                  {
                    seasonId: "season2",
                    episodeId: "episode2",
                    continueTimeMs: 3000,
                    lastWatchedTimeMs: 30,
                  },
                  {
                    seasonId: "season1",
                    episodeId: "episode1",
                    continueTimeMs: 2000,
                    lastWatchedTimeMs: 20,
                  },
                ],
                lastWatchedTimeCursor: 20,
              },
              LIST_WATCHED_EPISODES_RESPONSE,
            ),
            "response 1",
          );
        }

        {
          // Execute
          let response = await handler.handle(
            "",
            { limit: 2, lastWatchedTimeCursor: 20 },
            "session1",
          );

          // Verify
          assertThat(
            response,
            eqMessage(
              {
                episodes: [
                  {
                    seasonId: "season1",
                    episodeId: "episode1",
                    continueTimeMs: 1000,
                    lastWatchedTimeMs: 10,
                  },
                ],
              },
              LIST_WATCHED_EPISODES_RESPONSE,
            ),
            "response 2",
          );
        }
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
  ],
});
