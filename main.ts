import http = require("http");
import { ENV_VARS } from "./env_vars";
import { GetLatestWatchedEpisodeHandler } from "./show/node/get_latest_watched_episode_handler";
import { GetLatestWatchedTimeOfEpisodeHandler } from "./show/node/get_latest_watched_time_of_episode_handler";
import { ListRecentlyWatchedSeasonsHandler } from "./show/node/list_recently_watched_seaons_handler";
import { AddToWatchLaterListHandler } from "./show/web/add_to_watch_later_list_handler";
import { DeleteFromWatchLaterListHandler } from "./show/web/delete_from_watch_later_list_handler";
import { ListFromWatchLaterListHandler } from "./show/web/list_from_watch_later_list_handler";
import { ListWatchSessionsHandler } from "./show/web/list_watch_sessions_handler";
import { WatchEpisodeHandler } from "./show/web/watch_episode_handler";
import {
  PLAY_ACTIVITY_NODE_SERVICE,
  PLAY_ACTIVITY_WEB_SERVICE,
} from "@phading/play_activity_service_interface/service";
import { ServiceHandler } from "@selfage/service_handler/service_handler";

async function main() {
  let service = ServiceHandler.create(http.createServer())
    .addCorsAllowedPreflightHandler()
    .addHealthCheckHandler()
    .addMetricsHandler();
  service
    .addHandlerRegister(PLAY_ACTIVITY_NODE_SERVICE)
    .add(GetLatestWatchedEpisodeHandler.create())
    .add(GetLatestWatchedTimeOfEpisodeHandler.create())
    .add(ListRecentlyWatchedSeasonsHandler.create());
  service
    .addHandlerRegister(PLAY_ACTIVITY_WEB_SERVICE)
    .add(AddToWatchLaterListHandler.create())
    .add(DeleteFromWatchLaterListHandler.create())
    .add(ListFromWatchLaterListHandler.create())
    .add(ListWatchSessionsHandler.create())
    .add(WatchEpisodeHandler.create());
  await service.start(ENV_VARS.port);
}

main();
