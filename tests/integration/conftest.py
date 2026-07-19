"""Pytest config for the gltest integration suite."""


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "slow: real-LLM consensus rounds; run explicitly with `-m slow`.",
    )
