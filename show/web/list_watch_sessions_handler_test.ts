import "../../local/env";
import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchSessionStatement,
  insertWatchSessionStatement,
} from "../../db/sql";
import { WatchedVideoTimeRow } from "../common/watched_video_time_row";
import { ListWatchSessionsHandler } from "./list_watch_sessions_handler";
import { LIST_WATCH_SESSIONS_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
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
              seasonId: "season1",
              episodeId: "episode1",
              date: "2023-10-23",
              updatedTimeMs: 100,
            }),
            insertWatchSessionStatement({
              watcherId: "account1",
              seasonId: "season2",
              episodeId: "episode2",
              date: "2023-10-23",
              updatedTimeMs: 200,
            }),
            insertWatchSessionStatement({
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              date: "2023-10-24",
              updatedTimeMs: 300,
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.insert([
          WatchedVideoTimeRow.setEntry(
            "account1",
            "season1",
            "episode1",
            "2023-10-23",
            60,
          ),
          WatchedVideoTimeRow.setEntry(
            "account1",
            "season2",
            "episode2",
            "2023-10-23",
            120,
          ),
        ]);
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new ListWatchSessionsHandler(
          SPANNER_DATABASE,
          BIGTABLE,
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
                    date: "2023-10-24",
                    latestWatchedVideoTimeMs: 0,
                  },
                  {
                    seasonId: "season2",
                    episodeId: "episode2",
                    date: "2023-10-23",
                    latestWatchedVideoTimeMs: 120,
                  },
                ],
                updatedTimeCursor: 200,
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
            { limit: 2, updatedTimeCursor: 200 },
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
                    date: "2023-10-23",
                    latestWatchedVideoTimeMs: 60,
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
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionSeasonIdEq: "season1",
              watchSessionEpisodeIdEq: "episode1",
              watchSessionDateEq: "2023-10-23",
            }),
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionSeasonIdEq: "season2",
              watchSessionEpisodeIdEq: "episode2",
              watchSessionDateEq: "2023-10-23",
            }),
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionSeasonIdEq: "season1",
              watchSessionEpisodeIdEq: "episode1",
              watchSessionDateEq: "2023-10-24",
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
  ],
});
