from __future__ import annotations

import sys

from alembic.config import CommandLine, Config


def main() -> None:
    cli = CommandLine()
    options = cli.parser.parse_args(sys.argv[1:])
    config = Config("alembic.ini")
    cli.run_cmd(config, options)


if __name__ == "__main__":
    main()
