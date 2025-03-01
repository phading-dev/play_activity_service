import "../../local/env";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  GET_WATCH_LATER_SEASON_ROW,
  deleteWatchLaterSeasonStatement,
  getWatchLaterSeason,
  insertWatchLaterSeasonStatement,
} from "../../db/sql";
import { AddToWatchLaterListHandler } from "./add_to_watch_later_list_handler";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat, isArray } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "AddToWatchLaterListHandlerTest",
  cases: [
    {
      name: "AddFirstTime",
      async execute() {
        // Prepare
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new AddToWatchLaterListHandler(
          SPANNER_DATABASE,
          serviceClientMock,
          () => 1000,
        );

        // Execute
        await handler.handle("", { seasonId: "season1" }, "session1");

        // Verify
        assertThat(
          await getWatchLaterSeason(SPANNER_DATABASE, "account1", "season1"),
          isArray([
            eqMessage(
              {
                watchLaterSeasonData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  addedTimeMs: 1000,
                },
              },
              GET_WATCH_LATER_SEASON_ROW,
            ),
          ]),
          "WatchLaterSeason",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchLaterSeasonStatement("account1", "season1"),
          ]);
          await transaction.commit();
        });
      },
    },
    {
      name: "AddSecondTimeByUpdatingAddedTime",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchLaterSeasonStatement({
              watcherId: "account1",
              seasonId: "season1",
              addedTimeMs: 10,
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
        let handler = new AddToWatchLaterListHandler(
          SPANNER_DATABASE,
          serviceClientMock,
          () => 1000,
        );

        // Execute
        await handler.handle("", { seasonId: "season1" }, "session1");

        // Verify
        assertThat(
          await getWatchLaterSeason(SPANNER_DATABASE, "account1", "season1"),
          isArray([
            eqMessage(
              {
                watchLaterSeasonData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  addedTimeMs: 1000,
                },
              },
              GET_WATCH_LATER_SEASON_ROW,
            ),
          ]),
          "WatchLaterSeason",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchLaterSeasonStatement("account1", "season1"),
          ]);
          await transaction.commit();
        });
      },
    },
  ],
});
