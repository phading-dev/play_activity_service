import "./env_const";
import "@phading/cluster/env_dev";
import { ENV_VARS } from "./env";

ENV_VARS.spannerInstanceId = ENV_VARS.balancedSpannerInstanceId;
