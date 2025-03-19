import "../../local/env";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchLaterSeasonStatement,
  getWatchLaterSeason,
  insertWatchLaterSeasonStatement,
} from "../../db/sql";
import { DeleteFromWatchLaterListHandler } from "./delete_from_watch_later_list_handler";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat, isArray } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "DeleteFromWatchLaterListHandlerTest",
  cases: [
    {
      name: "DeleteSuccessfully",
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
        let handler = new DeleteFromWatchLaterListHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        // Execute
        await handler.handle("", { seasonId: "season1" }, "session1");

        // Verify
        assertThat(
          await getWatchLaterSeason(SPANNER_DATABASE, {
            watchLaterSeasonWatcherIdEq: "account1",
            watchLaterSeasonSeasonIdEq: "season1",
          }),
          isArray([]),
          "WatchLaterSeason",
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
      name: "DeleteWhenNoSeasonAdded",
      async execute() {
        // Prepare
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new DeleteFromWatchLaterListHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        // Execute
        await handler.handle("", { seasonId: "season1" }, "session1");

        // Verify no error
      },
      async tearDown() {},
    },
  ],
});
