import "../../local/env";
import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchSessionStatement,
  insertWatchSessionStatement,
} from "../../db/sql";
import { WATCH_TIME_TABLE } from "../common/watch_time_table";
import { ListWatchSessionsHandler } from "./list_watch_sessions_handler";
import { LIST_WATCH_SESSIONS_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "ListWatchSessionsHandlerTest",
  cases: [
    {
      name: "ListOneBatch_ListAgainButNoMore",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchSessionStatement({
              watcherId: "account1",
              watchSessionId: "watchSession1",
              seasonId: "season1",
              episodeId: "episode1",
              createdTimeMs: 100,
            }),
            insertWatchSessionStatement({
              watcherId: "account1",
              watchSessionId: "watchSession2",
              seasonId: "season2",
              episodeId: "episode2",
              createdTimeMs: 200,
            }),
            insertWatchSessionStatement({
              watcherId: "account1",
              watchSessionId: "watchSession3",
              seasonId: "season1",
              episodeId: "episode1",
              createdTimeMs: 300,
            }),
          ]);
          await transaction.commit();
        });
        await WATCH_TIME_TABLE.set("account1", "watchSession1", 60);
        await WATCH_TIME_TABLE.set("account1", "watchSession2", 120);
        await WATCH_TIME_TABLE.set("account1", "watchSession3", 180);
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new ListWatchSessionsHandler(
          SPANNER_DATABASE,
          WATCH_TIME_TABLE,
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
                sessions: [
                  {
                    seasonId: "season1",
                    episodeId: "episode1",
                    latestWatchedTimeMs: 180,
                    createdTimeMs: 300,
                  },
                  {
                    seasonId: "season2",
                    episodeId: "episode2",
                    latestWatchedTimeMs: 120,
                    createdTimeMs: 200,
                  },
                ],
                createdTimeCursor: 200,
              },
              LIST_WATCH_SESSIONS_RESPONSE,
            ),
            "response 1",
          );
        }

        {
          // Execute
          let response = await handler.handle(
            "",
            { limit: 2, createdTimeCursor: 200 },
            "session1",
          );

          // Verify
          assertThat(
            response,
            eqMessage(
              {
                sessions: [
                  {
                    seasonId: "season1",
                    episodeId: "episode1",
                    latestWatchedTimeMs: 60,
                    createdTimeMs: 100,
                  },
                ],
              },
              LIST_WATCH_SESSIONS_RESPONSE,
            ),
            "response 2",
          );
        }
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchSessionStatement("account1", "watchSession1"),
            deleteWatchSessionStatement("account1", "watchSession2"),
            deleteWatchSessionStatement("account1", "watchSession3"),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
  ],
});
