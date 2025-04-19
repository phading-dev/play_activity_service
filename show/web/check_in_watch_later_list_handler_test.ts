import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchLaterSeasonStatement,
  insertWatchLaterSeasonStatement,
} from "../../db/sql";
import { CheckInWatchLaterListHandler } from "./check_in_watch_later_list_handler";
import { CHECK_IN_WATCH_LATER_LIST_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "CheckInWatchLaterListHandlerTest",
  cases: [
    {
      name: "IsInWatchLaterList",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchLaterSeasonStatement({
              watcherId: "account1",
              seasonId: "season1",
            }),
          ]);
          await transaction.commit();
        });
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new CheckInWatchLaterListHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        // Execute
        let response = await handler.handle(
          "",
          { seasonId: "season1" },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              isIn: true,
            },
            CHECK_IN_WATCH_LATER_LIST_RESPONSE,
          ),
          "response",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchLaterSeasonStatement({
              watchLaterSeasonWatcherIdEq: "account1",
              watchLaterSeasonSeasonIdEq: "season1",
            }),
          ]);
          await transaction.commit();
        });
      },
    },
    {
      name: "IsNotInWatchLaterList",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchLaterSeasonStatement({
              watcherId: "account1",
              seasonId: "season2",
            }),
          ]);
          await transaction.commit();
        });
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new CheckInWatchLaterListHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        // Execute
        let response = await handler.handle(
          "",
          { seasonId: "season1" },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              isIn: false,
            },
            CHECK_IN_WATCH_LATER_LIST_RESPONSE,
          ),
          "response",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchLaterSeasonStatement({
              watchLaterSeasonWatcherIdEq: "account1",
              watchLaterSeasonSeasonIdEq: "season2",
            }),
          ]);
          await transaction.commit();
        });
      },
    },
  ],
});
