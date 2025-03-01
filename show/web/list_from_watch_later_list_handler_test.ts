import "../../local/env";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchLaterSeasonStatement,
  insertWatchLaterSeasonStatement,
} from "../../db/sql";
import { ListFromWatchLaterListHandler } from "./list_from_watch_later_list_handler";
import { LIST_FROM_WATCH_LATER_LIST_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "ListFromWatchLaterListHandlerTest",
  cases: [
    {
      name: "ListOneBatch_ListAgainButNoMore",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchLaterSeasonStatement({
              watcherId: "account1",
              seasonId: "season1",
              addedTimeMs: 10,
            }),
            insertWatchLaterSeasonStatement({
              watcherId: "account1",
              seasonId: "season2",
              addedTimeMs: 30,
            }),
            insertWatchLaterSeasonStatement({
              watcherId: "account1",
              seasonId: "season3",
              addedTimeMs: 20,
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
        let handler = new ListFromWatchLaterListHandler(
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
                seasonIds: ["season2", "season3"],
                addedTimeCursor: 20,
              },
              LIST_FROM_WATCH_LATER_LIST_RESPONSE,
            ),
            "response 1",
          );
        }

        {
          // Execute
          let response = await handler.handle(
            "",
            { limit: 2, addedTimeCursor: 20 },
            "session1",
          );

          // Verify
          assertThat(
            response,
            eqMessage(
              {
                seasonIds: ["season1"],
              },
              LIST_FROM_WATCH_LATER_LIST_RESPONSE,
            ),
            "response 2",
          );
        }
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchLaterSeasonStatement("account1", "season1"),
            deleteWatchLaterSeasonStatement("account1", "season2"),
            deleteWatchLaterSeasonStatement("account1", "season3"),
          ]);
          await transaction.commit();
        });
      },
    },
  ],
});
