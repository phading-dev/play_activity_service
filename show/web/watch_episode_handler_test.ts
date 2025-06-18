import "../../local/env";
import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  GET_WATCHED_EPISODE_ROW,
  GET_WATCHED_SEASON_ROW,
  GET_WATCH_SESSION_ROW,
  deleteWatchSessionStatement,
  deleteWatchedEpisodeStatement,
  deleteWatchedSeasonStatement,
  getWatchSession,
  getWatchedEpisode,
  getWatchedSeason,
  insertWatchSessionStatement,
  insertWatchedEpisodeStatement,
  insertWatchedSeasonStatement,
} from "../../db/sql";
import { LastWatchedRow } from "../common/last_watched_row";
import { WatchedVideoTimeRow } from "../common/watched_video_time_row";
import { WatchEpisodeHandler } from "./watch_episode_handler";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat, eq, isArray } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "WatchEpisodeHandlerTest",
  cases: [
    {
      name: "FirstTimeInADay",
      async execute() {
        // Prepare
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          BIGTABLE,
          serviceClientMock,
          () => new Date("2023-01-01T08:00:00Z").getTime(),
        );

        // Execute
        await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
            watchedVideoTimeMs: 60,
          },
          "session1",
        );

        // Verify
        assertThat(
          await WatchedVideoTimeRow.getMs(
            BIGTABLE,
            "account1",
            "season1",
            "episode1",
            "2023-01-01",
          ),
          eq(60),
          "WatchTime",
        );
        {
          let { seasonId, episodeId } = await LastWatchedRow.get(
            BIGTABLE,
            "account1",
            "2023-01-01",
          );
          assertThat(seasonId, eq("season1"), "LastWatchedRow seasonId");
          assertThat(episodeId, eq("episode1"), "LastWatchedRow episodeId");
        }
        assertThat(
          await getWatchSession(SPANNER_DATABASE, {
            watchSessionWatcherIdEq: "account1",
            watchSessionSeasonIdEq: "season1",
            watchSessionEpisodeIdEq: "episode1",
            watchSessionDateEq: "2023-01-01",
          }),
          isArray([
            eqMessage(
              {
                watchSessionWatcherId: "account1",
                watchSessionSeasonId: "season1",
                watchSessionEpisodeId: "episode1",
                watchSessionDate: "2023-01-01",
                watchSessionUpdatedTimeMs: new Date(
                  "2023-01-01T08:00:00Z",
                ).getTime(),
              },
              GET_WATCH_SESSION_ROW,
            ),
          ]),
          "WatchSession",
        );
        assertThat(
          await getWatchedSeason(SPANNER_DATABASE, {
            watchedSeasonWatcherIdEq: "account1",
            watchedSeasonSeasonIdEq: "season1",
          }),
          isArray([
            eqMessage(
              {
                watchedSeasonWatcherId: "account1",
                watchedSeasonSeasonId: "season1",
                watchedSeasonLatestEpisodeId: "episode1",
                watchedSeasonLatestWatchSessionDate: "2023-01-01",
                watchedSeasonUpdatedTimeMs: new Date(
                  "2023-01-01T08:00:00Z",
                ).getTime(),
              },
              GET_WATCHED_SEASON_ROW,
            ),
          ]),
          "WatchedSeason",
        );
        assertThat(
          await getWatchedEpisode(SPANNER_DATABASE, {
            watchedEpisodeWatcherIdEq: "account1",
            watchedEpisodeSeasonIdEq: "season1",
            watchedEpisodeEpisodeIdEq: "episode1",
          }),
          isArray([
            eqMessage(
              {
                watchedEpisodeWatcherId: "account1",
                watchedEpisodeSeasonId: "season1",
                watchedEpisodeEpisodeId: "episode1",
                watchedEpisodeLatestWatchSessionDate: "2023-01-01",
                watchedEpisodeUpdatedTimeMs: new Date(
                  "2023-01-01T08:00:00Z",
                ).getTime(),
              },
              GET_WATCHED_EPISODE_ROW,
            ),
          ]),
          "WatchedEpisode",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionSeasonIdEq: "season1",
              watchSessionEpisodeIdEq: "episode1",
              watchSessionDateEq: "2023-01-01",
            }),
            deleteWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: "account1",
              watchedSeasonSeasonIdEq: "season1",
            }),
            deleteWatchedEpisodeStatement({
              watchedEpisodeWatcherIdEq: "account1",
              watchedEpisodeSeasonIdEq: "season1",
              watchedEpisodeEpisodeIdEq: "episode1",
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
    {
      name: "UpdateWatchTimeOnTheSameEpisodeAndTheSameDay",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchSessionStatement({
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              date: "2023-01-01",
              updatedTimeMs: 100,
            }),
            insertWatchedSeasonStatement({
              watcherId: "account1",
              seasonId: "season1",
              latestEpisodeId: "episode1",
              latestWatchSessionDate: "2023-01-01",
              updatedTimeMs: 100,
            }),
            insertWatchedEpisodeStatement({
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              latestWatchSessionDate: "2023-01-01",
              updatedTimeMs: 100,
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.insert([
          WatchedVideoTimeRow.setEntry(
            "account1",
            "season1",
            "episode1",
            "2023-01-01",
            60,
          ),
          LastWatchedRow.setEntry(
            "account1",
            "2023-01-01",
            "season1",
            "episode1",
          ),
        ]);
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          BIGTABLE,
          serviceClientMock,
          () => new Date("2023-01-01T12:00:00Z").getTime(),
        );

        // Execute
        await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
            watchedVideoTimeMs: 120,
          },
          "session1",
        );

        // Verify
        assertThat(
          await WatchedVideoTimeRow.getMs(
            BIGTABLE,
            "account1",
            "season1",
            "episode1",
            "2023-01-01",
          ),
          eq(120),
          "WatchTime",
        );
        assertThat(
          await getWatchSession(SPANNER_DATABASE, {
            watchSessionWatcherIdEq: "account1",
            watchSessionSeasonIdEq: "season1",
            watchSessionEpisodeIdEq: "episode1",
            watchSessionDateEq: "2023-01-01",
          }),
          isArray([
            eqMessage(
              {
                watchSessionWatcherId: "account1",
                watchSessionSeasonId: "season1",
                watchSessionEpisodeId: "episode1",
                watchSessionDate: "2023-01-01",
                watchSessionUpdatedTimeMs: 100,
              },
              GET_WATCH_SESSION_ROW,
            ),
          ]),
          "WatchSession",
        );
        assertThat(
          await getWatchedSeason(SPANNER_DATABASE, {
            watchedSeasonWatcherIdEq: "account1",
            watchedSeasonSeasonIdEq: "season1",
          }),
          isArray([
            eqMessage(
              {
                watchedSeasonWatcherId: "account1",
                watchedSeasonSeasonId: "season1",
                watchedSeasonLatestEpisodeId: "episode1",
                watchedSeasonLatestWatchSessionDate: "2023-01-01",
                watchedSeasonUpdatedTimeMs: 100,
              },
              GET_WATCHED_SEASON_ROW,
            ),
          ]),
          "WatchedSeason",
        );
        assertThat(
          await getWatchedEpisode(SPANNER_DATABASE, {
            watchedEpisodeWatcherIdEq: "account1",
            watchedEpisodeSeasonIdEq: "season1",
            watchedEpisodeEpisodeIdEq: "episode1",
          }),
          isArray([
            eqMessage(
              {
                watchedEpisodeWatcherId: "account1",
                watchedEpisodeSeasonId: "season1",
                watchedEpisodeEpisodeId: "episode1",
                watchedEpisodeLatestWatchSessionDate: "2023-01-01",
                watchedEpisodeUpdatedTimeMs: 100,
              },
              GET_WATCHED_EPISODE_ROW,
            ),
          ]),
          "WatchedEpisode",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionSeasonIdEq: "season1",
              watchSessionEpisodeIdEq: "episode1",
              watchSessionDateEq: "2023-01-01",
            }),
            deleteWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: "account1",
              watchedSeasonSeasonIdEq: "season1",
            }),
            deleteWatchedEpisodeStatement({
              watchedEpisodeWatcherIdEq: "account1",
              watchedEpisodeSeasonIdEq: "season1",
              watchedEpisodeEpisodeIdEq: "episode1",
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
    {
      name: "UpdateWatchTimeWithDifferentEpisode",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchSessionStatement({
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              date: "2023-01-01",
              updatedTimeMs: 100,
            }),
            insertWatchedSeasonStatement({
              watcherId: "account1",
              seasonId: "season1",
              latestEpisodeId: "episode1",
              latestWatchSessionDate: "2022-01-01",
              updatedTimeMs: 100,
            }),
            insertWatchedEpisodeStatement({
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              latestWatchSessionDate: "2022-01-01",
              updatedTimeMs: 100,
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.insert([
          WatchedVideoTimeRow.setEntry(
            "account1",
            "season1",
            "episode1",
            "2023-01-01",
            60,
          ),
          LastWatchedRow.setEntry(
            "account1",
            "2023-01-01",
            "season1",
            "episode2",
          ),
        ]);
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          BIGTABLE,
          serviceClientMock,
          () => new Date("2023-01-01T20:00:01Z").getTime(),
        );

        // Execute
        await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
            watchedVideoTimeMs: 120,
          },
          "session1",
        );

        // Verify
        assertThat(
          await WatchedVideoTimeRow.getMs(
            BIGTABLE,
            "account1",
            "season1",
            "episode1",
            "2023-01-01",
          ),
          eq(120),
          "WatchTime",
        );
        {
          let { seasonId, episodeId } = await LastWatchedRow.get(
            BIGTABLE,
            "account1",
            "2023-01-01",
          );
          assertThat(seasonId, eq("season1"), "LastWatchedRow seasonId");
          assertThat(episodeId, eq("episode1"), "LastWatchedRow episodeId");
        }
        assertThat(
          await getWatchSession(SPANNER_DATABASE, {
            watchSessionWatcherIdEq: "account1",
            watchSessionSeasonIdEq: "season1",
            watchSessionEpisodeIdEq: "episode1",
            watchSessionDateEq: "2023-01-01",
          }),
          isArray([
            eqMessage(
              {
                watchSessionWatcherId: "account1",
                watchSessionSeasonId: "season1",
                watchSessionEpisodeId: "episode1",
                watchSessionDate: "2023-01-01",
                watchSessionUpdatedTimeMs: new Date(
                  "2023-01-01T20:00:01Z",
                ).getTime(),
              },
              GET_WATCH_SESSION_ROW,
            ),
          ]),
          "WatchSession",
        );
        assertThat(
          await getWatchedSeason(SPANNER_DATABASE, {
            watchedSeasonWatcherIdEq: "account1",
            watchedSeasonSeasonIdEq: "season1",
          }),
          isArray([
            eqMessage(
              {
                watchedSeasonWatcherId: "account1",
                watchedSeasonSeasonId: "season1",
                watchedSeasonLatestEpisodeId: "episode1",
                watchedSeasonLatestWatchSessionDate: "2023-01-01",
                watchedSeasonUpdatedTimeMs: new Date(
                  "2023-01-01T20:00:01Z",
                ).getTime(),
              },
              GET_WATCHED_SEASON_ROW,
            ),
          ]),
          "WatchedSeason",
        );
        assertThat(
          await getWatchedEpisode(SPANNER_DATABASE, {
            watchedEpisodeWatcherIdEq: "account1",
            watchedEpisodeSeasonIdEq: "season1",
            watchedEpisodeEpisodeIdEq: "episode1",
          }),
          isArray([
            eqMessage(
              {
                watchedEpisodeWatcherId: "account1",
                watchedEpisodeSeasonId: "season1",
                watchedEpisodeEpisodeId: "episode1",
                watchedEpisodeLatestWatchSessionDate: "2023-01-01",
                watchedEpisodeUpdatedTimeMs: new Date(
                  "2023-01-01T20:00:01Z",
                ).getTime(),
              },
              GET_WATCHED_EPISODE_ROW,
            ),
          ]),
          "WatchedEpisode",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionSeasonIdEq: "season1",
              watchSessionEpisodeIdEq: "episode1",
              watchSessionDateEq: "2023-01-01",
            }),
            deleteWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: "account1",
              watchedSeasonSeasonIdEq: "season1",
            }),
            deleteWatchedEpisodeStatement({
              watchedEpisodeWatcherIdEq: "account1",
              watchedEpisodeSeasonIdEq: "season1",
              watchedEpisodeEpisodeIdEq: "episode1",
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
  ],
});
