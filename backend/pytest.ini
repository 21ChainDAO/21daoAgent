[pytest]
# Fixed 2 xdist workers (deterministic, not reliant on the agent passing -n). loadscope pins each test
# class/module to one worker — generated suites share one preview backend and assume sequential shared
# state — so it parallelizes across classes/modules without cross-test races.
# AGENT: do NOT modify addopts; keep exactly -n 2 --dist loadscope and run only what is configured here.
# Serial = `-n 0` (NOT `-p no:xdist`, which errors because addopts still passes -n/--dist). A custom `-n`
# option in your own pytest setup collides with xdist's -n — rename it.
required_plugins = pytest-xdist
addopts = -n 2 --dist loadscope
